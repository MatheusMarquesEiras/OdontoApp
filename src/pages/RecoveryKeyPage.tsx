import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../data/auth';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

// Tela dedicada da CHAVE DE RECUPERAÇÃO (§3, comportamento específico):
//  - mostra a chave em fonte grande
//  - "Copiar chave" e "Salvar em .txt"
//  - aviso com "OK" que NÃO fecha a tela (apenas confirma leitura)
//  - a tela SÓ fecha no "X" — assim a chave nunca some antes da hora

export function RecoveryKeyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const chave = useAuth((s) => s.chaveRecuperacao);
  const [avisoLido, setAvisoLido] = useState(false);

  if (!chave) return <Navigate to="/" replace />;

  function copiar() {
    navigator.clipboard?.writeText(chave!).then(
      () => toast.show('Chave copiada para a área de transferência!'),
      () => toast.show('Não foi possível copiar automaticamente.', 'error'),
    );
  }

  function salvarTxt() {
    const blob = new Blob([`CHAVE DE RECUPERAÇÃO ODONTOAPP: ${chave}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chave_recuperacao_odontoapp.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.show('Arquivo .txt gerado!');
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-margin-safe">
      <main className="relative w-full max-w-4xl bg-surface-container-low border border-outline-variant rounded-xl p-stack-lg flex flex-col items-center text-center animate-fade-in">
        {/* Botão X — única forma de fechar a tela */}
        <button
          onClick={() => navigate('/pacientes')}
          title="Já guardei minha chave — fechar"
          className="absolute top-6 right-6 p-stack-xs text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-all active:scale-95"
        >
          <Icon name="close" className="text-4xl" />
        </button>

        <header className="mb-stack-md">
          <h1 className="font-headline-lg text-headline-lg text-primary mb-stack-sm">
            Guarde sua Chave de Segurança
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            Esta chave é a única forma de recuperar seu acesso caso esqueça sua senha. Ela não pode ser
            recuperada se for perdida.
          </p>
        </header>

        <section className="w-full bg-surface-container-highest border border-outline p-stack-md rounded-xl mb-stack-md">
          <div className="flex flex-col items-center gap-stack-sm">
            <span className="font-label-lg text-label-lg text-secondary uppercase tracking-widest">
              Sua Chave Mestra
            </span>
            <div className="py-stack-md px-stack-lg select-all">
              <span className="text-[40px] md:text-[60px] font-extrabold text-primary break-all leading-tight">
                {chave}
              </span>
            </div>
          </div>
        </section>

        <section className="flex flex-col md:flex-row gap-gutter w-full justify-center mb-stack-lg">
          <button
            onClick={copiar}
            className="flex items-center justify-center gap-stack-xs bg-primary text-on-primary font-button-text text-button-text min-h-[64px] px-10 rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm"
          >
            <Icon name="content_copy" /> Copiar Chave
          </button>
          <button
            onClick={salvarTxt}
            className="flex items-center justify-center gap-stack-xs border-2 border-primary text-primary font-button-text text-button-text min-h-[64px] px-10 rounded-xl hover:bg-surface-container-high transition-all active:scale-95"
          >
            <Icon name="download" /> Salvar em arquivo .txt
          </button>
        </section>

        <div className="w-full max-w-3xl bg-error-container text-on-error-container p-stack-md rounded-xl flex flex-col md:flex-row items-center gap-stack-md">
          <Icon name="warning" className="text-[48px] text-error flex-shrink-0" />
          <div className="flex-grow text-left">
            <p className="font-label-lg text-label-lg font-bold mb-1">Importante:</p>
            <p className="font-body-md text-body-md">
              Cole esta chave em um arquivo e guarde em um pendrive ou HD externo. Evite guardar apenas no
              seu computador principal. Perder a senha <b>e</b> a chave torna os dados irrecuperáveis.
            </p>
          </div>
          <button
            onClick={() => {
              setAvisoLido(true);
              toast.show('Aviso confirmado. A tela continua aberta.', 'info');
            }}
            className={`px-8 py-4 rounded-lg font-bold whitespace-nowrap transition-all ${
              avisoLido ? 'bg-primary text-on-primary' : 'bg-on-error-container text-white hover:opacity-80'
            }`}
          >
            {avisoLido ? 'Li o aviso ✓' : 'OK'}
          </button>
        </div>

        <p className="mt-stack-md text-on-surface-variant font-body-md text-[14px]">
          Quando terminar de guardar, feche esta tela pelo <b>X</b> no canto superior.
        </p>
      </main>
    </div>
  );
}
