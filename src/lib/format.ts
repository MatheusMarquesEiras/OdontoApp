import type { Patient, Treatment } from '../data/types';

export const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function formatMoney(v?: number): string {
  return brl.format(v ?? 0);
}

/** Data ISO (yyyy-mm-dd ou timestamp) → dd/mm/aaaa. */
export function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR');
}

/** Idade a partir da data de nascimento. */
export function calcAge(nascimento?: string): number | null {
  if (!nascimento) return null;
  const d = new Date(`${nascimento}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

/** Saldo acumulado linha a linha (crédito − débito somados). */
export function computeBalances(tratamentos: Treatment[] = []): number[] {
  let saldo = 0;
  return tratamentos.map((t) => {
    saldo += (t.credito ?? 0) - (t.debito ?? 0);
    return saldo;
  });
}

export function totalSaldo(tratamentos: Treatment[] = []): number {
  const b = computeBalances(tratamentos);
  return b.length ? b[b.length - 1] : 0;
}

export function patientLabel(tipo: Patient['tipo']): string {
  return tipo === 'adulto' ? 'Adulto' : 'Criança';
}
