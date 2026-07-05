import { useNavigate } from 'react-router-dom';
import { usePatients } from '../data/store';
import type { PatientType } from '../data/types';
import { Icon } from '../components/Icon';

// Seleção do tipo de paciente (§6 / Etapa 3): "Este paciente é ADULTO ou CRIANÇA?"
// A escolha cria o registro e abre o formulário correspondente.

export function NewPatientTypePage() {
  const navigate = useNavigate();
  const createPatient = usePatients((s) => s.createPatient);

  function escolher(tipo: PatientType) {
    const novo = createPatient(tipo);
    navigate(`/paciente/${novo.id}`);
  }

  const cards: { tipo: PatientType; icon: string; titulo: string; desc: string }[] = [
    { tipo: 'adulto', icon: 'person', titulo: 'ADULTO', desc: 'Ficha clínica completa para pacientes acima de 12 anos.' },
    { tipo: 'crianca', icon: 'child_care', titulo: 'CRIANÇA', desc: 'Odontopediatria com anamnese lúdica e focada.' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex justify-between items-center w-full px-margin-safe h-20 max-w-max-width mx-auto">
        <span className="text-headline-md font-headline-md font-bold text-primary">OdontoApp</span>
        <button
          onClick={() => navigate('/pacientes')}
          className="flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-xl font-label-lg text-label-lg"
        >
          <Icon name="arrow_back" /> Voltar
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center px-margin-safe py-stack-lg">
        <div className="max-w-4xl w-full animate-fade-in">
          <div className="text-center mb-stack-lg">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Novo Prontuário</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant">
              Este paciente é <span className="font-bold text-primary">ADULTO</span> ou{' '}
              <span className="font-bold text-primary">CRIANÇA</span>?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {cards.map((c) => (
              <button
                key={c.tipo}
                onClick={() => escolher(c.tipo)}
                className="group relative bg-surface-container-lowest border border-outline-variant p-10 rounded-[2rem] flex flex-col items-center justify-center transition-all duration-300 hover:border-primary hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-[0.98]"
              >
                <div className="w-32 h-32 mb-8 bg-surface-container rounded-full flex items-center justify-center transition-all duration-500 group-hover:bg-secondary-container group-hover:scale-110">
                  <Icon name={c.icon} className="text-[64px] text-primary" />
                </div>
                <span className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors">
                  {c.titulo}
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant mt-4 text-center">{c.desc}</p>
                <div className="mt-8 flex items-center gap-2 text-primary font-label-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>Selecionar</span>
                  <Icon name="chevron_right" />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-stack-lg text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-surface-container-low rounded-full text-on-surface-variant border border-outline-variant/30">
              <Icon name="info" className="text-[20px]" />
              <span className="font-label-lg text-label-lg">
                Você poderá trocar o tipo depois, dentro da ficha.
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
