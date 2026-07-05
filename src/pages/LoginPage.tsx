import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../data/auth';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';

type Mode = 'entrar' | 'criar' | 'recuperar';

// Tela de abertura (§3 / Etapa 2, mock). Três modos:
//  - criar: primeiro uso, cria senha simples e gera a chave de recuperação
//  - entrar: desbloquear com a senha
//  - recuperar: usa a chave de recuperação para definir nova senha

export function LoginPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { senha: senhaDefinida, definirSenha, entrar, recuperarComChave } = useAuth();

  const primeiraVez = !senhaDefinida;
  const [mode, setMode] = useState<Mode>(primeiraVez ? 'criar' : 'entrar');
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [chave, setChave] = useState('');
  const [erro, setErro] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');

    if (mode === 'criar') {
      if (!senha.trim()) {
        setErro('Escolha uma senha (pode ser simples).');
        return;
      }
      if (senha !== confirmar) {
        setErro('As senhas não são iguais. Confira e digite de novo.');
        return;
      }
      definirSenha(senha.trim());
      navigate('/chave-recuperacao');
      return;
    }

    if (mode === 'entrar') {
      if (entrar(senha)) {
        navigate('/pacientes');
      } else {
        setErro('Senha incorreta. Tente novamente.');
      }
      return;
    }

    // recuperar
    if (!senha.trim()) {
      setErro('Digite a nova senha.');
      return;
    }
    if (recuperarComChave(chave, senha.trim())) {
      toast.show('Senha redefinida com sucesso!');
      navigate('/pacientes');
    } else {
      setErro('Chave de recuperação inválida.');
    }
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
          <div className="inline-flex items-center justify-center p-stack-sm bg-primary-container rounded-xl mb-stack-sm shadow-sm">
            <Icon name="dentistry" className="text-on-primary-container text-[48px]" filled />
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
              className="w-full h-20 bg-primary text-on-primary font-button-text text-button-text rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-3"
            >
              {t.botao}
              <Icon name="arrow_forward" />
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
      </main>
    </div>
  );
}
