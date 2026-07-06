import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/auth';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

type Mode = 'entrar' | 'criar' | 'recuperar';

// Tela de abertura (§3 / Etapa 2). Três modos:
//  - criar: primeiro uso, cria senha simples (com confirmação) e gera a chave
//  - entrar: desbloquear com a senha
//  - recuperar: usa a chave de recuperação para definir nova senha

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { initialized, refreshInit, definirSenha, entrar, recuperarComChave } = useAuth();

  const [mode, setMode] = useState<Mode | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [chave, setChave] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    void refreshInit();
  }, [refreshInit]);

  // Define o modo inicial assim que sabemos se já existe senha cadastrada.
  useEffect(() => {
    if (mode === null && initialized !== null) setMode(initialized ? 'entrar' : 'criar');
  }, [initialized, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setOcupado(true);
    try {
      if (mode === 'criar') {
        if (!senha.trim()) return setErro('Escolha uma senha (pode ser simples).');
        if (senha !== confirmar) return setErro('As senhas não são iguais. Confira e digite de novo.');
        await definirSenha(senha.trim());
        navigate('/chave-recuperacao');
        return;
      }
      if (mode === 'entrar') {
        if (await entrar(senha)) navigate('/pacientes');
        else setErro('Senha incorreta. Tente novamente.');
        return;
      }
      // recuperar
      if (!senha.trim()) return setErro('Digite a nova senha.');
      if (await recuperarComChave(chave, senha.trim())) {
        toast.show('Senha redefinida com sucesso!');
        navigate('/pacientes');
      } else {
        setErro('Chave de recuperação inválida.');
      }
    } finally {
      setOcupado(false);
    }
  }

  if (mode === null) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-on-surface-variant">
        <Icon name="progress_activity" className="text-4xl animate-spin" />
      </div>
    );
  }

  const titulos: Record<Mode, { titulo: string; sub: string; botao: string }> = {
    criar: { titulo: 'Bem-vinda ao OdontoApp', sub: 'Crie uma senha para proteger os dados. Pode ser simples.', botao: 'Criar senha e continuar' },
    entrar: { titulo: 'OdontoApp', sub: 'Portal do Profissional', botao: 'Entrar' },
    recuperar: { titulo: 'Recuperar acesso', sub: 'Digite sua chave de recuperação e escolha uma nova senha.', botao: 'Redefinir senha' },
  };
  const t = titulos[mode];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden">
      {/* Decoração atmosférica */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-surface-container rounded-full opacity-60 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-secondary-container rounded-full opacity-40 blur-[120px]" />
      </div>

      <main className="relative z-10 w-full max-w-[520px] px-stack-sm animate-fade-in">
        <div className="text-center mb-stack-lg">
          <div className="inline-flex items-center justify-center mb-stack-sm">
            <img src="/app-icon.svg" alt="OdontoApp" className="w-24 h-24 drop-shadow-md" />
          </div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">{t.titulo}</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-stack-xs opacity-80">{t.sub}</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant p-stack-md rounded-xl">
          <form onSubmit={handleSubmit} className="space-y-stack-md">
            {mode === 'recuperar' && (
              <div className="flex flex-col gap-stack-xs">
                <label className="font-label-lg text-label-lg text-on-surface ml-1">Chave de recuperação</label>
                <input
                  className="w-full h-16 px-6 font-body-lg text-body-lg bg-surface border-[1.5px] border-outline-variant rounded-lg text-center tracking-widest uppercase"
                  placeholder="A1B2-C3D4-E5F6-G7H8-J9K0"
                  value={chave}
                  onChange={(e) => setChave(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-stack-xs">
              <label className="font-label-lg text-label-lg text-on-surface ml-1">
                {mode === 'entrar' ? 'Digite sua Senha' : 'Nova senha'}
              </label>
              <div className="relative">
                <input
                  className="w-full h-20 px-6 font-body-lg text-body-lg bg-surface border-[1.5px] border-outline-variant rounded-lg text-center tracking-[0.4em]"
                  type="password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoFocus
                />
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-on-surface-variant opacity-40">
                  <Icon name="lock" />
                </div>
              </div>
            </div>

            {mode === 'criar' && (
              <div className="flex flex-col gap-stack-xs">
                <label className="font-label-lg text-label-lg text-on-surface ml-1">Confirme sua senha</label>
                <div className="relative">
                  <input
                    className="w-full h-20 px-6 font-body-lg text-body-lg bg-surface border-[1.5px] border-outline-variant rounded-lg text-center tracking-[0.4em]"
                    type="password"
                    placeholder="••••••••"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-on-surface-variant opacity-40">
                    <Icon name="lock" />
                  </div>
                </div>
                <span className="text-sm text-on-surface-variant ml-1">
                  Digite a mesma senha de novo, só para conferir.
                </span>
              </div>
            )}

            {erro && (
              <div className="flex items-center gap-2 text-error font-label-lg">
                <Icon name="error" /> {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={ocupado}
              className="w-full h-20 bg-primary text-on-primary font-button-text text-button-text rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-3 disabled:opacity-60"
            >
              {t.botao}
              <Icon name={ocupado ? 'progress_activity' : 'arrow_forward'} className={ocupado ? 'animate-spin' : ''} />
            </button>

            {mode === 'entrar' && (
              <div className="text-center pt-stack-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('recuperar');
                    setErro('');
                  }}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            )}
            {mode === 'recuperar' && (
              <div className="text-center pt-stack-sm">
                <button
                  type="button"
                  onClick={() => {
                    setMode('entrar');
                    setErro('');
                  }}
                  className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors underline-offset-4 hover:underline"
                >
                  ← Voltar para o login
                </button>
              </div>
            )}
          </form>
        </div>

        <p className="mt-stack-lg text-center font-body-md text-on-surface-variant text-[14px]">
          Sistema de Gestão Clínica · v1.0.0
        </p>

        {import.meta.env.DEV && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { localStorage.clear(); location.reload(); }}
              className="text-xs text-on-surface-variant opacity-50 hover:opacity-100 underline transition-opacity"
            >
              [dev] Limpar dados e recomeçar
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
