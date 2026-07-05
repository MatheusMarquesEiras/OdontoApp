import type { ReactNode } from 'react';
import type { SimNao } from '../data/types';

// Controles de formulário do design system: rótulo sempre acima do campo,
// campos altos (h-14), bordas de alto contraste. Nada é obrigatório (§4).

const inputBase =
  'h-14 px-4 rounded-lg border-[1.5px] border-outline-variant bg-surface text-body-lg font-body-lg w-full transition-all';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`bg-surface-container-lowest border border-outline-variant rounded-xl p-stack-md ${className}`}
    >
      {children}
    </section>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="font-label-lg text-label-lg text-primary">{children}</label>;
}

interface FieldProps {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
}

export function TextField({ label, value = '', onChange, placeholder, type = 'text', hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <input
        className={inputBase}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <span className="text-sm text-on-surface-variant italic">{hint}</span>}
    </div>
  );
}

export function TextArea({
  label,
  value = '',
  onChange,
  placeholder,
  rows = 3,
}: FieldProps & { rows?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <textarea
        className="rounded-lg border-[1.5px] border-outline-variant bg-surface text-body-lg font-body-lg p-4 w-full"
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function SelectField({
  label,
  value = '',
  onChange,
  options,
}: Omit<FieldProps, 'placeholder' | 'type'> & { options: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <select className={inputBase} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Selecione…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Par de botões grandes Sim / Não (anamnese). */
export function SimNaoToggle({
  label,
  value = '',
  onChange,
}: {
  label: string;
  value?: SimNao;
  onChange: (v: SimNao) => void;
}) {
  const btn = (active: boolean) =>
    `flex-1 md:flex-none px-8 py-3 rounded-lg border-2 font-bold transition-all ${
      active
        ? 'bg-primary-container text-on-primary-container border-primary'
        : 'border-outline-variant text-on-surface hover:bg-secondary-container'
    }`;
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b border-outline-variant gap-4">
      <span className="font-body-lg text-body-lg max-w-2xl">{label}</span>
      <div className="flex gap-4">
        <button type="button" className={btn(value === 'nao')} onClick={() => onChange('nao')}>
          NÃO
        </button>
        <button type="button" className={btn(value === 'sim')} onClick={() => onChange('sim')}>
          SIM
        </button>
      </div>
    </div>
  );
}

/** Grupo de checkboxes ampliados (1.5x) — enfermidades, alergias, etc. */
export function CheckboxGroup({
  label,
  options,
  values = [],
  onChange,
}: {
  label: string;
  options: string[];
  values?: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter((v) => v !== opt) : [...values, opt]);
  };
  return (
    <div className="flex flex-col gap-3">
      <Label>{label}</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <label
              key={opt}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                active
                  ? 'bg-primary-container text-on-primary-container border-primary'
                  : 'bg-surface border-outline-variant hover:border-primary'
              }`}
            >
              <input
                type="checkbox"
                className="w-6 h-6 rounded text-primary focus:ring-primary"
                checked={active}
                onChange={() => toggle(opt)}
              />
              <span className="font-body-md">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = 'button',
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`h-16 px-10 rounded-xl bg-primary text-on-primary font-button-text text-button-text shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 ${className}`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-16 px-10 rounded-xl border-2 border-primary text-primary font-button-text text-button-text hover:bg-primary-container/10 active:scale-95 transition-all flex items-center justify-center gap-3 ${className}`}
    >
      {children}
    </button>
  );
}
