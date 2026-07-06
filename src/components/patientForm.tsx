import { Icon } from './Icon';
import type { Patient, Treatment } from '../data/types';
import { computeBalances, formatMoney, totalSaldo } from '../lib/format';

// Peças compartilhadas entre a ficha ADULTO e a ficha CRIANÇA.

export interface TabDef {
  id: string;
  label: string;
  icon: string;
}

export function TabsNav({
  tabs,
  active,
  onChange,
}: {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="flex flex-wrap gap-2 bg-surface-container p-2 rounded-2xl border border-outline-variant">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex-1 min-w-[140px] px-6 py-4 rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isActive
                ? 'bg-primary-container text-on-primary-container'
                : 'text-on-surface-variant hover:bg-surface-container-highest'
            }`}
          >
            <Icon name={t.icon} /> {t.label}
          </button>
        );
      })}
    </nav>
  );
}

/** Rodapé fixo com Cancelar / Salvar (sempre visível e destacado). */
export function SaveBar({
  nome,
  onCancel,
  onSave,
}: {
  nome?: string;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <footer className="fixed bottom-0 left-0 md:left-80 right-0 bg-surface/90 backdrop-blur-md border-t border-outline-variant py-5 px-margin-safe z-40">
      <div className="max-w-max-width mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="hidden md:flex flex-col">
          <span className="font-label-lg text-primary">Editando paciente:</span>
          <span className="font-headline-md text-on-surface">{nome || 'Novo paciente'}</span>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <button
            onClick={onCancel}
            className="flex-1 md:w-48 h-16 rounded-xl border-2 border-primary text-primary font-button-text text-button-text hover:bg-primary-container/10 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            className="flex-[2] md:w-80 h-16 rounded-xl bg-primary text-on-primary font-button-text text-button-text shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Icon name="save" /> SALVAR
          </button>
        </div>
      </div>
    </footer>
  );
}

/** Tabela de tratamentos/financeiro (§9.2) — adicionar e editar linhas, saldo automático. */
export function TreatmentsSection({
  patient,
  onChange,
}: {
  patient: Patient;
  onChange: (tratamentos: Treatment[]) => void;
}) {
  const tratamentos = patient.tratamentos ?? [];
  const balances = computeBalances(tratamentos);

  function addRow() {
    const novo: Treatment = {
      id: `t-${Date.now().toString(36)}`,
      data: new Date().toISOString().slice(0, 10),
      dente: '',
      descricao: '',
      debito: 0,
      credito: 0,
    };
    onChange([...tratamentos, novo]);
  }

  function updateRow(id: string, patch: Partial<Treatment>) {
    onChange(tratamentos.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  function removeRow(id: string) {
    onChange(tratamentos.filter((t) => t.id !== id));
  }

  const cell = 'p-3 border-b border-outline-variant';
  const cellInput =
    'w-full bg-transparent border-none focus:ring-0 focus:outline-none text-body-md px-2 py-1 rounded';

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <h2 className="font-headline-md text-headline-md text-secondary">Tratamentos & Financeiro</h2>
        <button
          onClick={addRow}
          className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label-lg text-label-lg hover:opacity-90 transition-all flex items-center gap-2"
        >
          <Icon name="add" /> Adicionar Linha
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[720px]">
          <thead>
            <tr className="bg-surface-container-high text-primary">
              <th className={`${cell} font-label-lg`}>Data</th>
              <th className={`${cell} font-label-lg`}>Dente</th>
              <th className={`${cell} font-label-lg`}>Tratamento</th>
              <th className={`${cell} font-label-lg`}>Débito (R$)</th>
              <th className={`${cell} font-label-lg`}>Crédito (R$)</th>
              <th className={`${cell} font-label-lg`}>Saldo (R$)</th>
              <th className={`${cell} font-label-lg text-center`}>Ação</th>
            </tr>
          </thead>
          <tbody className="text-body-md">
            {tratamentos.map((t, i) => (
              <tr key={t.id} className="hover:bg-surface-container transition-colors">
                <td className={cell}>
                  <input
                    type="date"
                    className={cellInput}
                    value={t.data ?? ''}
                    onChange={(e) => updateRow(t.id, { data: e.target.value })}
                  />
                </td>
                <td className={cell}>
                  <input
                    className={cellInput}
                    placeholder="Ex: 16"
                    value={t.dente ?? ''}
                    onChange={(e) => updateRow(t.id, { dente: e.target.value })}
                  />
                </td>
                <td className={cell}>
                  <input
                    className={cellInput}
                    placeholder="Procedimento"
                    value={t.descricao ?? ''}
                    onChange={(e) => updateRow(t.id, { descricao: e.target.value })}
                  />
                </td>
                <td className={cell}>
                  <input
                    type="number"
                    className={`${cellInput} text-error`}
                    value={t.debito ?? 0}
                    onChange={(e) => updateRow(t.id, { debito: Number(e.target.value) })}
                  />
                </td>
                <td className={cell}>
                  <input
                    type="number"
                    className={`${cellInput} text-green-700`}
                    value={t.credito ?? 0}
                    onChange={(e) => updateRow(t.id, { credito: Number(e.target.value) })}
                  />
                </td>
                <td className={`${cell} font-bold ${balances[i] < 0 ? 'text-error' : 'text-green-700'}`}>
                  {formatMoney(balances[i])}
                </td>
                <td className={`${cell} text-center`}>
                  <button
                    onClick={() => removeRow(t.id)}
                    className="text-error hover:bg-error-container p-2 rounded-full transition-colors"
                    title="Remover linha"
                  >
                    <Icon name="delete" />
                  </button>
                </td>
              </tr>
            ))}
            {tratamentos.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-on-surface-variant italic">
                  Nenhum tratamento lançado. Clique em “Adicionar Linha”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="p-6 bg-surface-container rounded-2xl flex justify-between items-center">
        <span className="text-on-surface-variant font-label-lg">Saldo atual do paciente</span>
        <span
          className={`text-headline-md font-bold ${
            totalSaldo(tratamentos) < 0 ? 'text-error' : 'text-green-700'
          }`}
        >
          {formatMoney(totalSaldo(tratamentos))}
        </span>
      </div>
    </div>
  );
}
