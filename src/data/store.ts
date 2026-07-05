import { create } from 'zustand';
import type { Patient, PatientType } from './types';
import { seedPatients } from './mockData';
import { backend, type BackupEntry } from './backend';

// ─────────────────────────────────────────────────────────────
// Store dos pacientes. Mantém uma cópia em memória (leitura síncrona
// para as telas) e faz "write-through" para o backend (Rust/SQLite ou
// localStorage). Carregado após o desbloqueio.
// ─────────────────────────────────────────────────────────────

function uid(prefix = 'p') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PatientsState {
  patients: Patient[];
  loaded: boolean;
  load: () => Promise<void>;
  seedDemo: () => Promise<void>;
  createPatient: (tipo: PatientType) => Patient;
  getPatient: (id: string) => Patient | undefined;
  savePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  resetToSeed: () => Promise<void>;
  clear: () => void;
}

export const usePatients = create<PatientsState>()((set, get) => ({
  patients: [],
  loaded: false,
  load: async () => {
    const patients = await backend.listPatients();
    set({ patients, loaded: true });
  },
  seedDemo: async () => {
    for (const p of seedPatients) await backend.savePatient(p);
    set({ patients: seedPatients, loaded: true });
  },
  createPatient: (tipo) => {
    const now = new Date().toISOString();
    const novo: Patient = { id: uid(), tipo, tratamentos: [], criadoEm: now, atualizadoEm: now };
    set((s) => ({ patients: [novo, ...s.patients] }));
    void backend.savePatient(novo);
    return novo;
  },
  getPatient: (id) => get().patients.find((p) => p.id === id),
  savePatient: (patient) => {
    const atualizado = { ...patient, atualizadoEm: new Date().toISOString() };
    set((s) => {
      const existe = s.patients.some((p) => p.id === patient.id);
      return {
        patients: existe
          ? s.patients.map((p) => (p.id === patient.id ? atualizado : p))
          : [atualizado, ...s.patients],
      };
    });
    void backend.savePatient(atualizado);
  },
  deletePatient: (id) => {
    set((s) => ({ patients: s.patients.filter((p) => p.id !== id) }));
    void backend.deletePatient(id);
  },
  resetToSeed: async () => {
    for (const p of get().patients) await backend.deletePatient(p.id);
    for (const p of seedPatients) await backend.savePatient(p);
    set({ patients: seedPatients, loaded: true });
  },
  clear: () => set({ patients: [], loaded: false }),
}));

// ─────────────────────────────────────────────────────────────
// Backups (§9.5). No Tauri copia o arquivo .db de verdade; no mock,
// registra a cópia simbolicamente.
// ─────────────────────────────────────────────────────────────

interface BackupState {
  backups: BackupEntry[];
  load: () => Promise<void>;
  fazerBackup: () => Promise<BackupEntry>;
}

export const useBackups = create<BackupState>()((set) => ({
  backups: [],
  load: async () => set({ backups: await backend.listBackups() }),
  fazerBackup: async () => {
    const registros = usePatients.getState().patients.length;
    const entry = await backend.backupNow(registros);
    set((s) => ({ backups: [entry, ...s.backups.filter((b) => b.id !== entry.id)].slice(0, 8) }));
    return entry;
  },
}));

export type { BackupEntry };
