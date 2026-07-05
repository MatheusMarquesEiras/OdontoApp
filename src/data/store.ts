import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Patient, PatientType } from './types';
import { seedPatients } from './mockData';

// ─────────────────────────────────────────────────────────────
// "Banco de dados" mock. Persistido em localStorage para simular
// a base local (SQLite) descrita no PLANEJAMENTO.md. Toda a lógica
// de CRUD que a camada Rust faria fica aqui, no cliente.
// ─────────────────────────────────────────────────────────────

function uid(prefix = 'p') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface PatientsState {
  patients: Patient[];
  createPatient: (tipo: PatientType) => Patient;
  getPatient: (id: string) => Patient | undefined;
  savePatient: (patient: Patient) => void;
  deletePatient: (id: string) => void;
  resetToSeed: () => void;
}

export const usePatients = create<PatientsState>()(
  persist(
    (set, get) => ({
      patients: seedPatients,
      createPatient: (tipo) => {
        const now = new Date().toISOString();
        const novo: Patient = {
          id: uid(),
          tipo,
          tratamentos: [],
          criadoEm: now,
          atualizadoEm: now,
        };
        set((s) => ({ patients: [novo, ...s.patients] }));
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
      },
      deletePatient: (id) => set((s) => ({ patients: s.patients.filter((p) => p.id !== id) })),
      resetToSeed: () => set({ patients: seedPatients }),
    }),
    { name: 'odontoapp-patients' },
  ),
);

// ─────────────────────────────────────────────────────────────
// Backup (§9.5) — mock. Guarda "cópias" carimbadas com data.
// ─────────────────────────────────────────────────────────────

export interface BackupEntry {
  id: string;
  criadoEm: string;
  registros: number;
  tipo: 'automatico' | 'manual';
}

interface BackupState {
  backups: BackupEntry[];
  fazerBackup: (tipo: BackupEntry['tipo'], registros: number) => BackupEntry;
}

export const useBackups = create<BackupState>()(
  persist(
    (set) => ({
      backups: [],
      fazerBackup: (tipo, registros) => {
        const entry: BackupEntry = {
          id: uid('bkp'),
          criadoEm: new Date().toISOString(),
          registros,
          tipo,
        };
        // mantém apenas as 8 cópias mais recentes (não encher o disco — §9.5)
        set((s) => ({ backups: [entry, ...s.backups].slice(0, 8) }));
        return entry;
      },
    }),
    { name: 'odontoapp-backups' },
  ),
);
