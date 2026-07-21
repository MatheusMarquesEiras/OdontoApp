// Camada Rust do OdontoApp. Expõe ao frontend os comandos de acesso seguro
// (senha + chave de recuperação) e de CRUD sobre o banco local criptografado,
// além do backup do arquivo. Ver `store.rs` para o modelo de segurança.

mod store;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{Manager, State};

#[derive(Default)]
struct Session {
    conn: Option<rusqlite::Connection>,
    master: Option<store::MasterKey>,
}

struct AppState(Mutex<Session>);

fn data_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    store::ensure_dir(&dir)?;
    Ok(dir)
}

// ── Acesso ───────────────────────────────────────────────────
#[tauri::command]
fn db_is_initialized(app: tauri::AppHandle) -> Result<bool, String> {
    Ok(store::is_initialized(&data_dir(&app)?))
}

#[tauri::command]
fn db_setup(app: tauri::AppHandle, state: State<AppState>, senha: String) -> Result<String, String> {
    let dir = data_dir(&app)?;
    let (recovery, master) = store::setup(&dir, &senha)?;
    let conn = store::open_db(&dir)?;
    let mut s = state.0.lock().map_err(|e| e.to_string())?;
    s.conn = Some(conn);
    s.master = Some(master);
    Ok(recovery)
}

#[tauri::command]
fn db_unlock(app: tauri::AppHandle, state: State<AppState>, senha: String) -> Result<bool, String> {
    let dir = data_dir(&app)?;
    match store::unlock(&dir, &senha)? {
        Some(master) => {
            let conn = store::open_db(&dir)?;
            let mut s = state.0.lock().map_err(|e| e.to_string())?;
            s.conn = Some(conn);
            s.master = Some(master);
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
fn db_recover(
    app: tauri::AppHandle,
    state: State<AppState>,
    chave: String,
    nova_senha: String,
) -> Result<bool, String> {
    let dir = data_dir(&app)?;
    match store::recover(&dir, &chave, &nova_senha)? {
        Some(master) => {
            let conn = store::open_db(&dir)?;
            let mut s = state.0.lock().map_err(|e| e.to_string())?;
            s.conn = Some(conn);
            s.master = Some(master);
            Ok(true)
        }
        None => Ok(false),
    }
}

#[tauri::command]
fn db_change_password(
    app: tauri::AppHandle,
    senha_atual: String,
    nova_senha: String,
) -> Result<bool, String> {
    store::change_password(&data_dir(&app)?, &senha_atual, &nova_senha)
}

#[tauri::command]
fn db_lock(state: State<AppState>) -> Result<(), String> {
    let mut s = state.0.lock().map_err(|e| e.to_string())?;
    s.conn = None;
    s.master = None;
    Ok(())
}

// ── Pacientes ────────────────────────────────────────────────
#[tauri::command]
fn db_list_patients(state: State<AppState>) -> Result<Vec<String>, String> {
    let s = state.0.lock().map_err(|e| e.to_string())?;
    let conn = s.conn.as_ref().ok_or("app bloqueado")?;
    let master = s.master.as_ref().ok_or("app bloqueado")?;
    store::list_patients(conn, master)
}

#[tauri::command]
fn db_get_patient(state: State<AppState>, id: String) -> Result<Option<String>, String> {
    let s = state.0.lock().map_err(|e| e.to_string())?;
    let conn = s.conn.as_ref().ok_or("app bloqueado")?;
    let master = s.master.as_ref().ok_or("app bloqueado")?;
    store::get_patient(conn, master, &id)
}

#[tauri::command]
fn db_save_patient(
    state: State<AppState>,
    id: String,
    tipo: String,
    json: String,
) -> Result<(), String> {
    let s = state.0.lock().map_err(|e| e.to_string())?;
    let conn = s.conn.as_ref().ok_or("app bloqueado")?;
    let master = s.master.as_ref().ok_or("app bloqueado")?;
    store::save_patient(conn, master, &id, &tipo, &json)
}

#[tauri::command]
fn db_delete_patient(state: State<AppState>, id: String) -> Result<(), String> {
    let s = state.0.lock().map_err(|e| e.to_string())?;
    let conn = s.conn.as_ref().ok_or("app bloqueado")?;
    store::delete_patient(conn, &id)
}

// ── Backup ───────────────────────────────────────────────────
#[tauri::command]
fn db_backup_now(app: tauri::AppHandle) -> Result<store::BackupEntry, String> {
    store::backup(&data_dir(&app)?, "manual")
}

#[tauri::command]
fn db_backup_to(app: tauri::AppHandle, path: String) -> Result<store::BackupEntry, String> {
    store::backup_to(&data_dir(&app)?, std::path::Path::new(&path))
}

#[tauri::command]
fn db_get_data_dir(app: tauri::AppHandle) -> Result<String, String> {
    Ok(data_dir(&app)?.to_string_lossy().to_string())
}

#[tauri::command]
fn db_list_backups(app: tauri::AppHandle) -> Result<Vec<store::BackupEntry>, String> {
    Ok(store::list_backups(&data_dir(&app)?))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // Atualização automática só existe no desktop.
            #[cfg(desktop)]
            app.handle()
                .plugin(tauri_plugin_updater::Builder::new().build())?;
            let _ = app;
            Ok(())
        })
        .manage(AppState(Mutex::new(Session::default())))
        .on_window_event(|window, event| {
            // Backup automático ao fechar (§9.5): copia o .db se já houver base.
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Ok(dir) = window.app_handle().path().app_data_dir() {
                    if store::is_initialized(&dir) {
                        let _ = store::backup(&dir, "automatico");
                    }
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            db_is_initialized,
            db_setup,
            db_unlock,
            db_recover,
            db_change_password,
            db_lock,
            db_list_patients,
            db_get_patient,
            db_save_patient,
            db_delete_patient,
            db_backup_now,
            db_backup_to,
            db_get_data_dir,
            db_list_backups,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
