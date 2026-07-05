import { useState } from 'react';
import { usePatients } from '../data/store';
import type { Patient } from '../data/types';

// Carrega uma cópia editável do paciente (draft). As edições só entram no
// "banco" mock ao chamar savePatient — permite Cancelar sem persistir.
export function usePatientDraft(id?: string) {
  const [draft, setDraft] = useState<Patient | null>(() => {
    const p = id ? usePatients.getState().getPatient(id) : undefined;
    return p ? structuredClone(p) : null;
  });
  return [draft, setDraft] as const;
}
