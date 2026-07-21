import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '../data/store';
import { useProfile } from '../data/profile';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

// Exclusão de paciente (§9.5 / Etapa 6): tela de confirmação separada com
// o nome em destaque e contagem de 5 segundos antes de habilitar o botão.
// A espera pode ser desligada no Perfil (com aviso dos riscos).

export function DeleteConfirmPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const paciente = usePatients((s) => (id ? s.getPatient(id) : undefined));
  const deletePatient = usePatients((s) => s.deletePatient);
  const deleteDelay = useProfile((s) => s.deleteDelay);

  const [segundos, setSegundos] = useState(deleteDelay ? 5 : 0);

  useEffect(() => {
    if (segundos <= 0) return;
    const t = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [segundos]);

  if (!paciente) return <Navigate to="/pacientes" replace />;

  const habilitado = segundos <= 0;

  function excluir() {
    if (!habilitado || !id) return;
    deletePatient(id);
    toast.show(`Paciente ${paciente!.nome ?? ''} excluído(a).`, 'info');
    navigate('/pacientes');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] border border-outline-variant p-8 shadow-xl animate-zoom-in">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center text-error">
            <Icon name="warning" className="text-[48px]" />
          </div>

          <div className="space-y-2">
            <h2 className="font-headline-md text-headline-md text-on-surface">
              Tem certeza que deseja excluir?
            </h2>
            <p className="text-on-surface-variant font-body-md">
              Esta ação removerá permanentemente todos os registros clínicos, exames e histórico
              financeiro deste paciente.
            </p>
          </div>

          <div className="w-full py-6 px-4 bg-surface-container rounded-2xl border border-primary-container/30">
            <span className="text-on-surface-variant font-label-lg block mb-1">Paciente selecionado</span>
            <span className="font-headline-md text-primary block">{paciente.nome || 'Sem nome'}</span>
          </div>

          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={excluir}
              disabled={!habilitado}
              className={`w-full h-14 font-button-text rounded-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden ${
                habilitado
                  ? 'bg-error text-on-error hover:opacity-90 active:scale-[0.98] shadow-md'
                  : 'bg-error/10 text-error/50 border border-error/20 cursor-not-allowed'
              }`}
            >
              {habilitado ? (
                <>
                  <Icon name="delete_forever" /> Excluir definitivamente
                </>
              ) : (
                `Aguarde ${segundos}...`
              )}
              {!habilitado && (
                <div
                  className="absolute bottom-0 left-0 h-1 bg-error/30 transition-all duration-1000"
                  style={{ width: `${(5 - segundos) * 20}%` }}
                />
              )}
            </button>

            <button
              onClick={() => navigate('/pacientes')}
              className="w-full h-14 bg-surface-container-highest text-on-surface font-button-text rounded-xl hover:bg-outline-variant transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
