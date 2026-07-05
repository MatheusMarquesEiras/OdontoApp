import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../data/store';
import type { PatientType } from '../data/types';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { patientLabel } from '../lib/format';

type Filtro = 'todos' | PatientType;

export function PatientsListPage() {
  const navigate = useNavigate();
  const patients = usePatients((s) => s.patients);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return patients.filter((p) => {
      if (filtro !== 'todos' && p.tipo !== filtro) return false;
      if (!q) return true;
      return [p.nome, p.cpf, p.rg, p.telefone, p.celular, p.cidade]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [patients, busca, filtro]);

  const filtros: { id: Filtro; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'adulto', label: 'Adultos' },
    { id: 'crianca', label: 'Crianças' },
  ];

  return (
    <Layout>
      {/* Cabeçalho + busca + ação */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-stack-md">
        <div className="flex-1 max-w-3xl">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-6">Lista de Pacientes</h1>
          <div className="relative">
            <Icon
              name="search"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-outline text-2xl"
            />
            <input
              className="w-full h-16 pl-14 pr-6 rounded-xl border-[1.5px] border-outline-variant bg-surface text-body-lg font-body-lg"
              placeholder="Buscar por nome, CPF, telefone ou cidade"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => navigate('/novo')}
          className="flex items-center justify-center gap-2 bg-primary text-on-primary h-16 px-10 rounded-xl font-button-text text-button-text shadow-sm hover:shadow-md transition-all active:opacity-80"
        >
          <Icon name="person_add" /> + Novo Paciente
        </button>
      </section>

      {/* Filtros */}
      <section className="flex gap-4 mb-stack-md overflow-x-auto pb-2">
        {filtros.map((f) => {
          const active = filtro === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFiltro(f.id)}
              className={`px-8 py-3 rounded-full border-[1.5px] font-label-lg text-label-lg transition-colors whitespace-nowrap ${
                active
                  ? 'border-primary-container bg-primary text-on-primary'
                  : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </section>

      {/* Grade de pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
        {filtrados.map((p) => (
          <div
            key={p.id}
            className="bg-surface-container-lowest rounded-xl border border-outline-variant p-6 hover:border-primary transition-all flex flex-col gap-4 group"
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors truncate">
                  {p.nome || 'Sem nome'}
                </h3>
                <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-body-md">
                  <Icon name="call" className="text-base" />
                  {p.telefone || p.celular || '—'}
                </div>
              </div>
              <span
                className={`px-4 py-1 rounded-full text-sm font-bold whitespace-nowrap ${
                  p.tipo === 'adulto'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-tertiary-container text-on-tertiary-container'
                }`}
              >
                {patientLabel(p.tipo)}
              </span>
            </div>
            <div className="mt-2 flex gap-3">
              <button
                onClick={() => navigate(`/paciente/${p.id}`)}
                className="flex-1 h-14 bg-surface-container-high text-primary rounded-lg font-button-text text-button-text hover:bg-primary-container hover:text-on-primary-container transition-all"
              >
                Abrir
              </button>
              <button
                onClick={() => navigate(`/excluir/${p.id}`)}
                title="Excluir"
                className="w-14 h-14 flex items-center justify-center bg-error-container text-on-error-container rounded-lg hover:bg-error hover:text-on-error transition-all"
              >
                <Icon name="delete" />
              </button>
            </div>
          </div>
        ))}

        {/* Cartão "Adicionar Novo" */}
        <button
          onClick={() => navigate('/novo')}
          className="bg-surface-container flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-outline-variant p-6 min-h-[180px] hover:bg-surface-container-highest hover:border-primary transition-all group"
        >
          <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container group-hover:scale-110 transition-transform">
            <Icon name="person_add" className="text-3xl" />
          </div>
          <p className="font-headline-md text-headline-md text-primary">Adicionar Novo</p>
        </button>
      </div>

      {filtrados.length === 0 && (
        <div className="text-center py-stack-lg text-on-surface-variant">
          <Icon name="search_off" className="text-5xl opacity-50" />
          <p className="font-body-lg mt-4">Nenhum paciente encontrado para esta busca.</p>
        </div>
      )}
    </Layout>
  );
}
