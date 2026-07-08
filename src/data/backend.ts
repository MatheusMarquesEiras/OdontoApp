import { invoke } from '@tauri-apps/api/core';
import type { Patient } from './types';
import { seedPatients } from './mockData';

// ─────────────────────────────────────────────────────────────
// Camada de acesso a dados. Duas implementações:
//   • tauriBackend — chama os comandos Rust (SQLite + criptografia real).
//   • mockBackend  — localStorage, para rodar no navegador (dev/screenshots).
// A escolha é automática: se estivermos dentro do Tauri, usa o Rust.
// ─────────────────────────────────────────────────────────────

export interface BackupEntry {
  id: string;
  criadoEm: string;
  registros: number;
  tipo: 'automatico' | 'manual' | 'externo';
  caminho?: string;
}

export interface Backend {
  isInitialized(): Promise<boolean>;
  /** Primeiro uso: cria a senha e retorna a chave de recuperação gerada. */
  setup(senha: string): Promise<string>;
  /** Desbloqueia com a senha. false = senha incorreta. */
  unlock(senha: string): Promise<boolean>;
  /** Recupera o acesso com a chave e define nova senha. false = chave inválida. */
  recover(chave: string, novaSenha: string): Promise<boolean>;
  lock(): Promise<void>;
  listPatients(): Promise<Patient[]>;
  savePatient(p: Patient): Promise<void>;
  deletePatient(id: string): Promise<void>;
  backupNow(registros: number): Promise<BackupEntry>;
  backupTo(path: string): Promise<BackupEntry>;
  listBackups(): Promise<BackupEntry[]>;
  getDataDir(): Promise<string>;
}

export const runningInTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function gerarChaveRecuperacao(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos
  const grupo = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return Array.from({ length: 5 }, grupo).join('-');
}

// ── Implementação Tauri (Rust) ───────────────────────────────
const tauriBackend: Backend = {
  isInitialized: () => invoke('db_is_initialized'),
  setup: (senha) => invoke('db_setup', { senha }),
  unlock: (senha) => invoke('db_unlock', { senha }),
  recover: (chave, novaSenha) => invoke('db_recover', { chave, novaSenha }),
  lock: () => invoke('db_lock'),
  listPatients: async () => {
    const rows = await invoke<string[]>('db_list_patients');
    return rows.map((j) => JSON.parse(j) as Patient);
  },
  savePatient: (p) =>
    invoke('db_save_patient', {
      id: p.id,
      tipo: p.tipo,
      json: JSON.stringify(p),
    }),
  deletePatient: (id) => invoke('db_delete_patient', { id }),
  backupNow: () => invoke('db_backup_now'),
  backupTo: (path) => invoke('db_backup_to', { path }),
  listBackups: () => invoke('db_list_backups'),
  getDataDir: () => invoke('db_get_data_dir'),
};

// ── Implementação mock (localStorage) ────────────────────────
const AUTH_KEY = 'odontoapp-auth';
const PAT_KEY = 'odontoapp-patients';
const BKP_KEY = 'odontoapp-backups';

interface MockAuth {
  senha: string;
  chave: string;
}

const readJson = <T>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};
const writeJson = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');

const mockBackend: Backend = {
  async isInitialized() {
    return !!readJson<MockAuth | null>(AUTH_KEY, null)?.senha;
  },
  async setup(senha) {
    const chave = gerarChaveRecuperacao();
    writeJson(AUTH_KEY, { senha, chave } satisfies MockAuth);
    // semeia dados de demonstração no primeiro uso
    if (readJson<Patient[]>(PAT_KEY, []).length === 0) writeJson(PAT_KEY, seedPatients);
    return chave;
  },
  async unlock(senha) {
    return readJson<MockAuth | null>(AUTH_KEY, null)?.senha === senha;
  },
  async recover(chave, novaSenha) {
    const auth = readJson<MockAuth | null>(AUTH_KEY, null);
    if (auth && norm(auth.chave) === norm(chave)) {
      writeJson(AUTH_KEY, { senha: novaSenha, chave: auth.chave } satisfies MockAuth);
      return true;
    }
    return false;
  },
  async lock() {
    /* mock: nada a fazer (a "sessão" é só o estado em memória) */
  },
  async listPatients() {
    return readJson<Patient[]>(PAT_KEY, []);
  },
  async savePatient(p) {
    const list = readJson<Patient[]>(PAT_KEY, []);
    const i = list.findIndex((x) => x.id === p.id);
    if (i >= 0) list[i] = p;
    else list.unshift(p);
    writeJson(PAT_KEY, list);
  },
  async deletePatient(id) {
    writeJson(
      PAT_KEY,
      readJson<Patient[]>(PAT_KEY, []).filter((p) => p.id !== id),
    );
  },
  async backupNow(registros) {
    const entry: BackupEntry = {
      id: `bkp-${Date.now().toString(36)}`,
      criadoEm: new Date().toISOString(),
      registros,
      tipo: 'manual',
    };
    const list = [entry, ...readJson<BackupEntry[]>(BKP_KEY, [])].slice(0, 8);
    writeJson(BKP_KEY, list);
    return entry;
  },
  async backupTo(path) {
    const registros = readJson<Patient[]>(PAT_KEY, []).length;
    const entry: BackupEntry = {
      id: `bkp-${Date.now().toString(36)}`,
      criadoEm: new Date().toISOString(),
      registros,
      tipo: 'externo',
      caminho: path,
    };
    const list = [entry, ...readJson<BackupEntry[]>(BKP_KEY, [])].slice(0, 8);
    writeJson(BKP_KEY, list);
    return entry;
  },
  async listBackups() {
    return readJson<BackupEntry[]>(BKP_KEY, []);
  },
  async getDataDir() {
    return '(modo navegador — sem arquivo local)';
  },
};

/** Chave mestra de recuperação atual (só o mock consegue reexibir; ver Settings). */
export function mockRecoveryKey(): string | null {
  return readJson<MockAuth | null>(AUTH_KEY, null)?.chave ?? null;
}

export const backend: Backend = runningInTauri() ? tauriBackend : mockBackend;
