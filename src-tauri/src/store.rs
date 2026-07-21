// Camada de dados + criptografia (PLANEJAMENTO.md §3, Etapas 1 e 2).
//
// Modelo de segurança (o mesmo que o plano descreve):
//   • uma CHAVE-MESTRA aleatória (32 bytes) protege os dados;
//   • ela é guardada "embrulhada duas vezes": uma cópia cifrada com uma chave
//     derivada da SENHA, outra com uma chave derivada da CHAVE DE RECUPERAÇÃO;
//   • trocar a senha só re-embrulha a cópia da senha — não recifra os dados.
//
// Aqui os registros dos pacientes são cifrados com AEAD (XChaCha20-Poly1305)
// usando a chave-mestra, e gravados num SQLite (feature `bundled`). É uma
// alternativa 100% Rust ao SQLCipher, que exige compilar OpenSSL. A migração
// para SQLCipher no futuro é uma troca de feature + `PRAGMA key`.

use argon2::Argon2;
use chacha20poly1305::aead::Aead;
use chacha20poly1305::{KeyInit, XChaCha20Poly1305, XNonce};
use rand::RngCore;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const NONCE_LEN: usize = 24;
const KEY_LEN: usize = 32;
const SALT_LEN: usize = 16;

pub type MasterKey = [u8; KEY_LEN];

#[derive(Serialize, Deserialize)]
struct KeyFile {
    version: u32,
    salt_pwd: String,
    salt_rec: String,
    wrapped_pwd: String, // hex(nonce || ciphertext)
    wrapped_rec: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BackupEntry {
    pub id: String,
    pub criado_em: String,
    pub registros: i64,
    pub tipo: String,
    pub caminho: String,
}

// ── Caminhos ─────────────────────────────────────────────────
pub fn ensure_dir(dir: &Path) -> Result<(), String> {
    fs::create_dir_all(dir).map_err(|e| e.to_string())
}
fn keys_path(dir: &Path) -> PathBuf {
    dir.join("keys.json")
}
fn db_path(dir: &Path) -> PathBuf {
    dir.join("odontoapp.db")
}
fn backups_dir(dir: &Path) -> PathBuf {
    dir.join("backups")
}

pub fn is_initialized(dir: &Path) -> bool {
    keys_path(dir).exists()
}

// ── Aleatoriedade / chave de recuperação ─────────────────────
fn random_bytes(n: usize) -> Vec<u8> {
    let mut v = vec![0u8; n];
    rand::rngs::OsRng.fill_bytes(&mut v);
    v
}

pub fn gen_recovery_key() -> String {
    const ALPHABET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sem ambíguos
    let bytes = random_bytes(20);
    let mut groups: Vec<String> = Vec::with_capacity(5);
    for g in 0..5 {
        let s: String = (0..4)
            .map(|i| ALPHABET[bytes[g * 4 + i] as usize % ALPHABET.len()] as char)
            .collect();
        groups.push(s);
    }
    groups.join("-")
}

fn normalize_recovery(s: &str) -> String {
    s.chars()
        .filter(|c| c.is_ascii_alphanumeric())
        .collect::<String>()
        .to_uppercase()
}

// ── Primitivas de criptografia ───────────────────────────────
fn derive_key(secret: &[u8], salt: &[u8]) -> Result<MasterKey, String> {
    let mut out = [0u8; KEY_LEN];
    Argon2::default()
        .hash_password_into(secret, salt, &mut out)
        .map_err(|e| format!("kdf: {e}"))?;
    Ok(out)
}

fn seal(plaintext: &[u8], key: &[u8]) -> Result<Vec<u8>, String> {
    let cipher = XChaCha20Poly1305::new_from_slice(key).map_err(|e| e.to_string())?;
    let nonce_bytes = random_bytes(NONCE_LEN);
    let nonce = XNonce::from_slice(&nonce_bytes);
    let ct = cipher
        .encrypt(nonce, plaintext)
        .map_err(|_| "falha ao cifrar".to_string())?;
    let mut out = nonce_bytes;
    out.extend_from_slice(&ct);
    Ok(out)
}

fn open_seal(blob: &[u8], key: &[u8]) -> Option<Vec<u8>> {
    if blob.len() < NONCE_LEN {
        return None;
    }
    let cipher = XChaCha20Poly1305::new_from_slice(key).ok()?;
    let (nonce_bytes, ct) = blob.split_at(NONCE_LEN);
    cipher.decrypt(XNonce::from_slice(nonce_bytes), ct).ok()
}

// ── keys.json ────────────────────────────────────────────────
fn read_keyfile(dir: &Path) -> Result<KeyFile, String> {
    let txt = fs::read_to_string(keys_path(dir)).map_err(|e| e.to_string())?;
    serde_json::from_str(&txt).map_err(|e| e.to_string())
}
fn write_keyfile(dir: &Path, kf: &KeyFile) -> Result<(), String> {
    let txt = serde_json::to_string_pretty(kf).map_err(|e| e.to_string())?;
    fs::write(keys_path(dir), txt).map_err(|e| e.to_string())
}

// ── Fluxos de acesso ─────────────────────────────────────────
/// Primeiro uso: cria chave-mestra, chave de recuperação e o keys.json.
pub fn setup(dir: &Path, senha: &str) -> Result<(String, MasterKey), String> {
    ensure_dir(dir)?;
    if is_initialized(dir) {
        return Err("banco já inicializado".into());
    }
    let mut master = [0u8; KEY_LEN];
    rand::rngs::OsRng.fill_bytes(&mut master);
    let recovery = gen_recovery_key();

    let salt_pwd = random_bytes(SALT_LEN);
    let salt_rec = random_bytes(SALT_LEN);
    let key_pwd = derive_key(senha.as_bytes(), &salt_pwd)?;
    let key_rec = derive_key(normalize_recovery(&recovery).as_bytes(), &salt_rec)?;

    let kf = KeyFile {
        version: 1,
        salt_pwd: hex::encode(&salt_pwd),
        salt_rec: hex::encode(&salt_rec),
        wrapped_pwd: hex::encode(seal(&master, &key_pwd)?),
        wrapped_rec: hex::encode(seal(&master, &key_rec)?),
    };
    write_keyfile(dir, &kf)?;

    // cria o banco vazio já com o schema
    let conn = open_db(dir)?;
    drop(conn);
    Ok((recovery, master))
}

/// Desbloqueia com a senha. Ok(None) = senha incorreta.
pub fn unlock(dir: &Path, senha: &str) -> Result<Option<MasterKey>, String> {
    let kf = read_keyfile(dir)?;
    let salt = hex::decode(&kf.salt_pwd).map_err(|e| e.to_string())?;
    let key = derive_key(senha.as_bytes(), &salt)?;
    let wrapped = hex::decode(&kf.wrapped_pwd).map_err(|e| e.to_string())?;
    match open_seal(&wrapped, &key) {
        Some(m) if m.len() == KEY_LEN => {
            let mut mk = [0u8; KEY_LEN];
            mk.copy_from_slice(&m);
            Ok(Some(mk))
        }
        _ => Ok(None),
    }
}

/// Recupera com a chave e define nova senha. Ok(None) = chave inválida.
pub fn recover(dir: &Path, chave: &str, nova_senha: &str) -> Result<Option<MasterKey>, String> {
    let mut kf = read_keyfile(dir)?;
    let salt_rec = hex::decode(&kf.salt_rec).map_err(|e| e.to_string())?;
    let key_rec = derive_key(normalize_recovery(chave).as_bytes(), &salt_rec)?;
    let wrapped_rec = hex::decode(&kf.wrapped_rec).map_err(|e| e.to_string())?;
    let master = match open_seal(&wrapped_rec, &key_rec) {
        Some(m) if m.len() == KEY_LEN => m,
        _ => return Ok(None),
    };
    // re-embrulha a cópia da senha com a nova senha
    let salt_pwd = random_bytes(SALT_LEN);
    let key_pwd = derive_key(nova_senha.as_bytes(), &salt_pwd)?;
    kf.salt_pwd = hex::encode(&salt_pwd);
    kf.wrapped_pwd = hex::encode(seal(&master, &key_pwd)?);
    write_keyfile(dir, &kf)?;

    let mut mk = [0u8; KEY_LEN];
    mk.copy_from_slice(&master);
    Ok(Some(mk))
}

/// Troca a senha: valida a senha atual e re-embrulha só a cópia da senha da
/// chave-mestra (os dados não são recifrados). Ok(false) = senha atual incorreta.
pub fn change_password(dir: &Path, senha_atual: &str, nova_senha: &str) -> Result<bool, String> {
    let mut kf = read_keyfile(dir)?;
    let salt = hex::decode(&kf.salt_pwd).map_err(|e| e.to_string())?;
    let key = derive_key(senha_atual.as_bytes(), &salt)?;
    let wrapped = hex::decode(&kf.wrapped_pwd).map_err(|e| e.to_string())?;
    let master = match open_seal(&wrapped, &key) {
        Some(m) if m.len() == KEY_LEN => m,
        _ => return Ok(false),
    };
    // re-embrulha a cópia da senha com a nova senha (novo salt + novo nonce)
    let salt_pwd = random_bytes(SALT_LEN);
    let key_pwd = derive_key(nova_senha.as_bytes(), &salt_pwd)?;
    kf.salt_pwd = hex::encode(&salt_pwd);
    kf.wrapped_pwd = hex::encode(seal(&master, &key_pwd)?);
    write_keyfile(dir, &kf)?;
    Ok(true)
}

// ── Banco ────────────────────────────────────────────────────
pub fn open_db(dir: &Path) -> Result<Connection, String> {
    let conn = Connection::open(db_path(dir)).map_err(|e| e.to_string())?;
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS pacientes (
            id TEXT PRIMARY KEY,
            tipo TEXT NOT NULL,
            blob BLOB NOT NULL,
            criado_em TEXT,
            atualizado_em TEXT
        );",
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
}

pub fn save_patient(
    conn: &Connection,
    master: &MasterKey,
    id: &str,
    tipo: &str,
    json: &str,
) -> Result<(), String> {
    let blob = seal(json.as_bytes(), master)?;
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO pacientes (id, tipo, blob, criado_em, atualizado_em)
         VALUES (?1, ?2, ?3, ?4, ?4)
         ON CONFLICT(id) DO UPDATE SET tipo=?2, blob=?3, atualizado_em=?4",
        params![id, tipo, blob, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn list_patients(conn: &Connection, master: &MasterKey) -> Result<Vec<String>, String> {
    let mut stmt = conn
        .prepare("SELECT blob FROM pacientes ORDER BY atualizado_em DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| row.get::<_, Vec<u8>>(0))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        let blob = r.map_err(|e| e.to_string())?;
        if let Some(plain) = open_seal(&blob, master) {
            if let Ok(s) = String::from_utf8(plain) {
                out.push(s);
            }
        }
    }
    Ok(out)
}

pub fn get_patient(
    conn: &Connection,
    master: &MasterKey,
    id: &str,
) -> Result<Option<String>, String> {
    let blob: Option<Vec<u8>> = conn
        .query_row("SELECT blob FROM pacientes WHERE id = ?1", params![id], |r| {
            r.get(0)
        })
        .ok();
    Ok(blob
        .and_then(|b| open_seal(&b, master))
        .and_then(|p| String::from_utf8(p).ok()))
}

pub fn delete_patient(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM pacientes WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn count_patients(dir: &Path) -> i64 {
    open_db(dir)
        .and_then(|c| {
            c.query_row("SELECT COUNT(*) FROM pacientes", [], |r| r.get::<_, i64>(0))
                .map_err(|e| e.to_string())
        })
        .unwrap_or(0)
}

// ── Backup ───────────────────────────────────────────────────
/// Índice dos backups salvos fora da pasta interna (ver `backup_to`),
/// para que também apareçam em "Últimas cópias".
fn external_index_path(dir: &Path) -> PathBuf {
    backups_dir(dir).join("externos.json")
}

fn load_external_backups(dir: &Path) -> Vec<BackupEntry> {
    fs::read_to_string(external_index_path(dir))
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save_external_backups(dir: &Path, list: &[BackupEntry]) {
    if ensure_dir(&backups_dir(dir)).is_ok() {
        if let Ok(json) = serde_json::to_string_pretty(list) {
            let _ = fs::write(external_index_path(dir), json);
        }
    }
}

/// Copia o arquivo do banco para um caminho escolhido pelo usuário.
pub fn backup_to(src_dir: &Path, dest: &Path) -> Result<BackupEntry, String> {
    let src = db_path(src_dir);
    if !src.exists() {
        return Err("banco ainda não existe".into());
    }
    if let Some(parent) = dest.parent() {
        if !parent.as_os_str().is_empty() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }
    let registros = count_patients(src_dir);
    fs::copy(&src, dest).map_err(|e| e.to_string())?;
    let entry = BackupEntry {
        id: dest.file_name().unwrap_or_default().to_string_lossy().to_string(),
        criado_em: chrono::Utc::now().to_rfc3339(),
        registros,
        tipo: "externo".into(),
        caminho: dest.to_string_lossy().to_string(),
    };
    let mut list = load_external_backups(src_dir);
    list.retain(|b| b.caminho != entry.caminho); // regravou no mesmo lugar → substitui
    list.insert(0, entry.clone());
    list.truncate(8);
    save_external_backups(src_dir, &list);
    Ok(entry)
}

/// Copia o arquivo do banco para backups/ carimbado com data e nº de registros.
pub fn backup(dir: &Path, tipo: &str) -> Result<BackupEntry, String> {
    let src = db_path(dir);
    if !src.exists() {
        return Err("banco ainda não existe".into());
    }
    let bdir = backups_dir(dir);
    ensure_dir(&bdir)?;
    let registros = count_patients(dir);
    let stamp = chrono::Local::now().format("%Y%m%d-%H%M%S").to_string();
    let nome = format!("odontoapp-{stamp}-{registros}.db");
    let dest = bdir.join(&nome);
    fs::copy(&src, &dest).map_err(|e| e.to_string())?;
    prune_backups(&bdir, 8);
    Ok(BackupEntry {
        id: nome.clone(),
        criado_em: chrono::Utc::now().to_rfc3339(),
        registros,
        tipo: tipo.to_string(),
        caminho: dest.to_string_lossy().to_string(),
    })
}

fn prune_backups(bdir: &Path, keep: usize) {
    let mut files: Vec<PathBuf> = match fs::read_dir(bdir) {
        Ok(rd) => rd
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| p.extension().map(|x| x == "db").unwrap_or(false))
            .collect(),
        Err(_) => return,
    };
    files.sort(); // nomes começam com a data → ordena cronologicamente
    if files.len() > keep {
        for old in &files[..files.len() - keep] {
            let _ = fs::remove_file(old);
        }
    }
}

pub fn list_backups(dir: &Path) -> Vec<BackupEntry> {
    let bdir = backups_dir(dir);
    let files: Vec<PathBuf> = match fs::read_dir(&bdir) {
        Ok(rd) => rd
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| p.extension().map(|x| x == "db").unwrap_or(false))
            .collect(),
        Err(_) => Vec::new(),
    };
    let mut all: Vec<BackupEntry> = files
        .into_iter()
        .map(|p| {
            let nome = p.file_name().unwrap_or_default().to_string_lossy().to_string();
            // odontoapp-YYYYMMDD-HHMMSS-<registros>.db
            let registros = nome
                .trim_end_matches(".db")
                .rsplit('-')
                .next()
                .and_then(|s| s.parse::<i64>().ok())
                .unwrap_or(0);
            let criado = fs::metadata(&p)
                .and_then(|m| m.modified())
                .map(|t| chrono::DateTime::<chrono::Utc>::from(t).to_rfc3339())
                .unwrap_or_default();
            BackupEntry {
                id: nome.clone(),
                criado_em: criado,
                registros,
                tipo: "manual".into(),
                caminho: p.to_string_lossy().to_string(),
            }
        })
        .collect();
    // Junta os backups salvos em locais escolhidos pelo usuário (se ainda existirem —
    // um pendrive removido some da lista até ser plugado de novo).
    all.extend(
        load_external_backups(dir)
            .into_iter()
            .filter(|b| Path::new(&b.caminho).exists()),
    );
    all.sort_by(|a, b| b.criado_em.cmp(&a.criado_em)); // mais recentes primeiro
    all
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp() -> PathBuf {
        let mut d = std::env::temp_dir();
        d.push(format!("odontoapp-test-{}", rand::random::<u64>()));
        d
    }

    #[test]
    fn ciclo_completo_de_acesso_e_dados() {
        let dir = tmp();
        assert!(!is_initialized(&dir));

        // primeiro uso
        let (recovery, _m) = setup(&dir, "1234").unwrap();
        assert!(is_initialized(&dir));
        assert_eq!(recovery.len(), 24); // 5 grupos de 4 + 4 hífens

        // senha errada não abre; senha certa abre
        assert!(unlock(&dir, "9999").unwrap().is_none());
        let master = unlock(&dir, "1234").unwrap().expect("senha correta deve abrir");

        // grava e lê um paciente (round-trip pela cifra)
        let conn = open_db(&dir).unwrap();
        let json = r#"{"id":"p1","tipo":"adulto","nome":"Fulana"}"#;
        save_patient(&conn, &master, "p1", "adulto", json).unwrap();
        let lidos = list_patients(&conn, &master).unwrap();
        assert_eq!(lidos, vec![json.to_string()]);
        assert_eq!(get_patient(&conn, &master, "p1").unwrap().as_deref(), Some(json));

        // o blob no banco NÃO está em texto puro
        let blob: Vec<u8> = conn
            .query_row("SELECT blob FROM pacientes WHERE id='p1'", [], |r| r.get(0))
            .unwrap();
        assert!(!String::from_utf8_lossy(&blob).contains("Fulana"));

        // recuperação com a chave define nova senha e continua abrindo os dados
        assert!(recover(&dir, "chave-errada-xxxx", "nova").unwrap().is_none());
        let m2 = recover(&dir, &recovery, "novaSenha").unwrap().expect("chave válida");
        let conn2 = open_db(&dir).unwrap();
        assert_eq!(list_patients(&conn2, &m2).unwrap(), vec![json.to_string()]);
        assert!(unlock(&dir, "novaSenha").unwrap().is_some());
        assert!(unlock(&dir, "1234").unwrap().is_none()); // senha antiga não vale mais

        // troca de senha: senha atual errada falha; certa troca e passa a valer
        assert!(!change_password(&dir, "errada", "maisNova").unwrap());
        assert!(change_password(&dir, "novaSenha", "maisNova").unwrap());
        assert!(unlock(&dir, "maisNova").unwrap().is_some());
        assert!(unlock(&dir, "novaSenha").unwrap().is_none());
        // os dados continuam acessíveis após a troca (chave-mestra intacta)
        let conn3 = open_db(&dir).unwrap();
        let m3 = unlock(&dir, "maisNova").unwrap().unwrap();
        assert_eq!(list_patients(&conn3, &m3).unwrap(), vec![json.to_string()]);

        // backup gera arquivo e aparece na listagem
        delete_patient(&conn2, "p1").unwrap();
        let entry = backup(&dir, "manual").unwrap();
        assert!(Path::new(&entry.caminho).exists());
        assert!(!list_backups(&dir).is_empty());

        let _ = fs::remove_dir_all(&dir);
    }
}
