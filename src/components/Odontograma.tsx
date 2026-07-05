import { useState } from 'react';
import type { Odontograma as OdontogramaData, PatientType, ToothStatus } from '../data/types';
import { Icon } from './Icon';

// Odontograma (§7.3 adulto / §8.11 criança). Componente visual: escolha um
// "estado" na paleta e clique nos dentes para marcá-los. Numeração FDI.

interface StatusMeta {
  label: string;
  dot: string; // cor do marcador na paleta
  tooth: string; // classes do dente quando neste estado
}

const STATUS: Record<ToothStatus, StatusMeta> = {
  higido: { label: 'Hígido', dot: 'bg-surface-container-highest border-outline', tooth: 'bg-surface border-outline-variant text-on-surface' },
  carie: { label: 'Cárie', dot: 'bg-error', tooth: 'bg-error-container border-error text-on-error-container' },
  restaurado: { label: 'Restaurado', dot: 'bg-blue-500', tooth: 'bg-blue-100 border-blue-500 text-blue-800' },
  ausente: { label: 'Ausente', dot: 'bg-on-surface', tooth: 'bg-surface-container-highest border-outline text-outline line-through' },
  coroa: { label: 'Coroa', dot: 'bg-amber-400', tooth: 'bg-amber-100 border-amber-500 text-amber-800' },
  tratamento: { label: 'Tratamento', dot: 'bg-primary-container', tooth: 'bg-primary-container border-primary text-on-primary-container' },
};

const ORDEM: ToothStatus[] = ['carie', 'restaurado', 'coroa', 'tratamento', 'ausente', 'higido'];

// Numeração FDI por quadrante (da direita do paciente para a esquerda).
const ADULTO = {
  supDir: [18, 17, 16, 15, 14, 13, 12, 11],
  supEsq: [21, 22, 23, 24, 25, 26, 27, 28],
  infDir: [48, 47, 46, 45, 44, 43, 42, 41],
  infEsq: [31, 32, 33, 34, 35, 36, 37, 38],
};
const CRIANCA = {
  supDir: [55, 54, 53, 52, 51],
  supEsq: [61, 62, 63, 64, 65],
  infDir: [85, 84, 83, 82, 81],
  infEsq: [71, 72, 73, 74, 75],
};

export function Odontograma({
  tipo,
  value = {},
  onChange,
}: {
  tipo: PatientType;
  value?: OdontogramaData;
  onChange: (o: OdontogramaData) => void;
}) {
  const [brush, setBrush] = useState<ToothStatus>('carie');
  const arcadas = tipo === 'crianca' ? CRIANCA : ADULTO;

  function paint(dente: number) {
    const key = String(dente);
    const atual = value[key] ?? 'higido';
    const next = { ...value };
    // clicar com o mesmo estado (ou pintar de hígido) "apaga" a marcação
    if (brush === 'higido' || atual === brush) delete next[key];
    else next[key] = brush;
    onChange(next);
  }

  const Dente = ({ n }: { n: number }) => {
    const st = value[String(n)] ?? 'higido';
    return (
      <button
        type="button"
        onClick={() => paint(n)}
        title={`Dente ${n} — ${STATUS[st].label}`}
        className={`w-11 h-14 rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition-all hover:scale-105 ${STATUS[st].tooth}`}
      >
        <Icon name="dentistry" className="text-lg" filled />
        {n}
      </button>
    );
  };

  const Fileira = ({ dir, esq }: { dir: number[]; esq: number[] }) => (
    <div className="flex justify-center gap-1 flex-wrap">
      <div className="flex gap-1">{dir.map((n) => <Dente key={n} n={n} />)}</div>
      <div className="w-px bg-outline-variant mx-1" />
      <div className="flex gap-1">{esq.map((n) => <Dente key={n} n={n} />)}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Paleta de estados (pincel) */}
      <div className="flex flex-wrap gap-2">
        {ORDEM.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setBrush(s)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 font-label-lg text-sm transition-all ${
              brush === s ? 'border-primary bg-surface-container-high' : 'border-outline-variant hover:bg-surface-container-high'
            }`}
          >
            <span className={`w-4 h-4 rounded-full border ${STATUS[s].dot}`} />
            {STATUS[s].label}
          </button>
        ))}
      </div>
      <p className="text-sm text-on-surface-variant -mt-1">
        Escolha um estado acima e clique nos dentes. Numeração FDI ·{' '}
        {tipo === 'crianca' ? 'dentição decídua (de leite)' : 'dentição permanente'}.
      </p>

      {/* Arcadas */}
      <div className="bg-surface-container-low border border-outline-variant rounded-2xl p-4 flex flex-col gap-3">
        <Fileira dir={arcadas.supDir} esq={arcadas.supEsq} />
        <div className="text-center text-xs text-on-surface-variant tracking-widest uppercase">
          — direita · esquerda —
        </div>
        <Fileira dir={arcadas.infDir} esq={arcadas.infEsq} />
      </div>
    </div>
  );
}

/** Resumo textual dos dentes marcados (usado na exportação DOCX). */
export function resumoOdontograma(odo?: OdontogramaData): string {
  if (!odo) return '';
  const marcados = Object.entries(odo).filter(([, s]) => s !== 'higido');
  if (marcados.length === 0) return '';
  return marcados
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([dente, s]) => `${dente}: ${STATUS[s].label}`)
    .join('; ');
}
