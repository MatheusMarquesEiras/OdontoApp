import { useRef, useState } from 'react';
import { useProfile } from '../data/profile';
import { useAuth } from '../data/auth';
import { hexToHsl, hslToHex, themeSwatch } from '../lib/theme';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Logo } from '../components/Logo';
import { Card } from '../components/ui';
import { useToast } from '../components/Toast';

// Perfil (Etapa final). Reúne as preferências de exibição e de segurança:
//   • foto/logotipo que substitui o dente no canto superior esquerdo;
//   • cores da interface (roleta de matiz + saturação + brilho);
//   • troca de senha (com confirmação final);
//   • liga/desliga a espera de 5 s antes de excluir (com aviso dos riscos).

// Reduz e converte a imagem escolhida numa data URL pequena para o localStorage.
function fileToDataUrl(file: File, max = 512): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Arquivo de imagem inválido.'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas indisponível.'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const PRESETS: { nome: string; hue: number }[] = [
  { nome: 'Roxo', hue: 289 },
  { nome: 'Rosa', hue: 330 },
  { nome: 'Vermelho', hue: 2 },
  { nome: 'Laranja', hue: 28 },
  { nome: 'Âmbar', hue: 45 },
  { nome: 'Verde', hue: 140 },
  { nome: 'Turquesa', hue: 178 },
  { nome: 'Azul', hue: 212 },
  { nome: 'Índigo', hue: 255 },
];

export function ProfilePage() {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const { photo, hue, saturation, brightness, themeCustom, deleteDelay } = useProfile();
  const setPhoto = useProfile((s) => s.setPhoto);
  const setTheme = useProfile((s) => s.setTheme);
  const resetTheme = useProfile((s) => s.resetTheme);
  const setDeleteDelay = useProfile((s) => s.setDeleteDelay);
  const trocarSenha = useAuth((s) => s.trocarSenha);

  // ── Troca de senha ──────────────────────────────────────────
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmarTroca, setConfirmarTroca] = useState(false);

  // ── Aviso ao desligar a espera de exclusão ──────────────────
  const [avisoEspera, setAvisoEspera] = useState(false);

  async function escolherFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reenviar o mesmo arquivo depois
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.show('Escolha um arquivo de imagem (PNG, JPG…).', 'error');
      return;
    }
    try {
      setPhoto(await fileToDataUrl(file));
      toast.show('Logotipo atualizado.');
    } catch {
      toast.show('Não foi possível usar essa imagem.', 'error');
    }
  }

  function pedirTroca(e: React.FormEvent) {
    e.preventDefault();
    setErroSenha('');
    if (!senhaAtual) return setErroSenha('Digite a senha atual.');
    if (!novaSenha.trim()) return setErroSenha('Digite a nova senha.');
    if (novaSenha !== confirmarSenha)
      return setErroSenha('A confirmação não confere com a nova senha.');
    if (novaSenha === senhaAtual)
      return setErroSenha('A nova senha é igual à atual. Escolha uma diferente.');
    setConfirmarTroca(true); // abre a confirmação final
  }

  async function efetivarTroca() {
    setOcupado(true);
    try {
      const ok = await trocarSenha(senhaAtual, novaSenha.trim());
      if (ok) {
        toast.show('Senha alterada com sucesso.');
        setSenhaAtual('');
        setNovaSenha('');
        setConfirmarSenha('');
        setErroSenha('');
      } else {
        setErroSenha('Senha atual incorreta. Nada foi alterado.');
      }
    } catch {
      setErroSenha('Não foi possível trocar a senha.');
    } finally {
      setOcupado(false);
      setConfirmarTroca(false);
    }
  }

  function alternarEspera() {
    if (deleteDelay) {
      setAvisoEspera(true); // desligar → pede confirmação com aviso
    } else {
      setDeleteDelay(true); // religar a proteção é imediato
      toast.show('Espera de 5 segundos reativada.');
    }
  }

  const previewColor = themeSwatch({ hue, saturation, brightness });
  const hueColor = hslToHex(hue, 90, 45);

  return (
    <Layout>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md">Perfil</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter items-start">
        {/* ── Foto / logotipo ─────────────────────────────────── */}
        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-3 text-primary">
            <Icon name="photo_camera" className="text-3xl" />
            <h2 className="font-headline-md text-headline-md">Foto do perfil</h2>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Envie a foto ou o logotipo da clínica. Ele aparece no canto superior esquerdo, no lugar do
            dente, e também na tela de acesso.
          </p>

          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container flex items-center justify-center border border-outline-variant overflow-hidden shrink-0">
              <Logo className="w-24 h-24" />
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="h-12 px-6 rounded-lg bg-primary text-on-primary font-button-text hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
              >
                <Icon name="upload" /> Enviar imagem
              </button>
              {photo && (
                <button
                  onClick={() => {
                    setPhoto(null);
                    toast.show('Logotipo removido. O dente voltou.', 'info');
                  }}
                  className="h-12 px-6 rounded-lg border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center gap-2"
                >
                  <Icon name="restart_alt" /> Voltar ao dente
                </button>
              )}
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={escolherFoto}
          />
        </Card>

        {/* ── Cores da interface ──────────────────────────────── */}
        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-primary">
              <Icon name="palette" className="text-3xl" />
              <h2 className="font-headline-md text-headline-md">Cores da interface</h2>
            </div>
            <span
              className="w-10 h-10 rounded-full border-2 border-outline shadow-inner shrink-0"
              style={{ background: previewColor }}
              title="Cor atual"
            />
          </div>
          <p className="font-body-md text-on-surface-variant">
            Escolha a cor e o brilho do app. Toque numa cor pronta ou use a roleta abaixo.
          </p>

          {/* Cores prontas */}
          <div className="flex flex-wrap gap-3">
            {PRESETS.map((p) => {
              const cor = hslToHex(p.hue, 85, 40);
              const ativo = themeCustom && Math.abs(((hue - p.hue + 540) % 360) - 180) > 175;
              return (
                <button
                  key={p.nome}
                  onClick={() => setTheme({ hue: p.hue })}
                  title={p.nome}
                  className={`w-11 h-11 rounded-full border-2 transition-all active:scale-90 ${
                    ativo ? 'border-on-surface scale-110' : 'border-outline-variant hover:scale-105'
                  }`}
                  style={{ background: cor }}
                />
              );
            })}
          </div>

          {/* Roleta de matiz */}
          <label className="flex flex-col gap-2 mt-2">
            <span className="font-label-lg text-label-lg text-secondary flex items-center gap-2">
              <Icon name="colorize" /> Matiz (roleta de cores)
            </span>
            <input
              type="range"
              className="theme-range"
              min={0}
              max={360}
              value={hue}
              onChange={(e) => setTheme({ hue: Number(e.target.value) })}
              style={{
                background:
                  'linear-gradient(to right, hsl(0 90% 50%), hsl(60 90% 50%), hsl(120 90% 50%), hsl(180 90% 50%), hsl(240 90% 50%), hsl(300 90% 50%), hsl(360 90% 50%))',
              }}
            />
          </label>

          {/* Saturação */}
          <label className="flex flex-col gap-2">
            <span className="font-label-lg text-label-lg text-secondary flex items-center gap-2">
              <Icon name="opacity" /> Intensidade da cor
            </span>
            <input
              type="range"
              className="theme-range"
              min={0}
              max={130}
              value={saturation}
              onChange={(e) => setTheme({ saturation: Number(e.target.value) })}
              style={{
                background: `linear-gradient(to right, hsl(${hue} 0% 60%), ${hueColor})`,
              }}
            />
          </label>

          {/* Brilho */}
          <label className="flex flex-col gap-2">
            <span className="font-label-lg text-label-lg text-secondary flex items-center gap-2">
              <Icon name="brightness_6" /> Brilho da cor
            </span>
            <input
              type="range"
              className="theme-range"
              min={-12}
              max={15}
              value={brightness}
              onChange={(e) => setTheme({ brightness: Number(e.target.value) })}
              style={{
                background: `linear-gradient(to right, hsl(${hue} 80% 20%), hsl(${hue} 80% 42%), hsl(${hue} 80% 62%))`,
              }}
            />
          </label>

          <div className="flex flex-wrap items-center gap-3 mt-1">
            <label className="h-12 px-5 rounded-lg border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center gap-2 cursor-pointer">
              <Icon name="palette" /> Disco de cores
              <input
                type="color"
                className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent p-0"
                value={previewColor}
                onChange={(e) => {
                  const { h, s } = hexToHsl(e.target.value);
                  setTheme({ hue: h, saturation: Math.min(130, Math.max(20, s)) });
                }}
              />
            </label>
            {themeCustom && (
              <button
                onClick={() => {
                  resetTheme();
                  toast.show('Cor padrão (roxo) restaurada.', 'info');
                }}
                className="h-12 px-5 rounded-lg border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center gap-2"
              >
                <Icon name="restart_alt" /> Cor padrão
              </button>
            )}
          </div>

          {/* Pré-visualização */}
          <div className="mt-2 rounded-xl border border-outline-variant p-4 bg-surface-container-low flex flex-wrap items-center gap-3">
            <button className="h-11 px-5 rounded-lg bg-primary text-on-primary font-button-text">
              Botão
            </button>
            <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-secondary-container text-on-secondary-container">
              Adulto
            </span>
            <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-tertiary-container text-on-tertiary-container">
              Criança
            </span>
            <span className="font-headline-md text-primary">Título</span>
          </div>
        </Card>

        {/* ── Trocar senha ────────────────────────────────────── */}
        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-3 text-primary">
            <Icon name="password" className="text-3xl" />
            <h2 className="font-headline-md text-headline-md">Trocar senha</h2>
          </div>
          <p className="font-body-md text-on-surface-variant">
            A troca exige a senha atual. Seus dados continuam intactos — apenas a senha de acesso muda.
          </p>

          <form onSubmit={pedirTroca} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-primary">Senha atual</label>
              <input
                type="password"
                className="h-14 px-4 rounded-lg border-[1.5px] border-outline-variant bg-surface text-body-lg w-full"
                placeholder="••••••••"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-primary">Nova senha</label>
              <input
                type="password"
                className="h-14 px-4 rounded-lg border-[1.5px] border-outline-variant bg-surface text-body-lg w-full"
                placeholder="••••••••"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-label-lg text-label-lg text-primary">Confirmar nova senha</label>
              <input
                type="password"
                className="h-14 px-4 rounded-lg border-[1.5px] border-outline-variant bg-surface text-body-lg w-full"
                placeholder="••••••••"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            {erroSenha && (
              <div className="flex items-center gap-2 text-error font-label-lg">
                <Icon name="error" /> {erroSenha}
              </div>
            )}

            <button
              type="submit"
              className="h-14 px-6 rounded-xl bg-primary text-on-primary font-button-text hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 self-start"
            >
              <Icon name="lock_reset" /> Trocar senha
            </button>
          </form>
        </Card>

        {/* ── Exclusão de pacientes ───────────────────────────── */}
        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-3 text-primary">
            <Icon name="timer" className="text-3xl" />
            <h2 className="font-headline-md text-headline-md">Espera antes de excluir</h2>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Por segurança, o botão de excluir um paciente só é liberado após 5 segundos, evitando
            exclusões por engano.
          </p>

          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant">
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                name={deleteDelay ? 'verified_user' : 'gpp_maybe'}
                className={`text-3xl ${deleteDelay ? 'text-primary' : 'text-error'}`}
              />
              <div className="min-w-0">
                <span className="font-label-lg text-label-lg text-on-surface block">
                  Espera de 5 segundos
                </span>
                <span className="text-sm text-on-surface-variant">
                  {deleteDelay ? 'Ativada (recomendado)' : 'Desativada — exclusão imediata'}
                </span>
              </div>
            </div>
            <button
              role="switch"
              aria-checked={deleteDelay}
              onClick={alternarEspera}
              className={`relative w-16 h-9 rounded-full transition-colors shrink-0 ${
                deleteDelay ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-7 h-7 rounded-full bg-surface-container-lowest shadow transition-transform ${
                  deleteDelay ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>
      </div>

      {/* ── Confirmação final da troca de senha ─────────────────── */}
      {confirmarTroca && (
        <ModalOverlay>
          <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center text-primary mx-auto">
            <Icon name="lock_reset" className="text-[48px]" />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface text-center">
            Deseja realmente trocar a senha?
          </h2>
          <p className="text-on-surface-variant font-body-md text-center">
            A partir de agora o acesso ao app usará a nova senha. Guarde-a com cuidado — sem ela (e sem
            a chave de recuperação) os dados não podem ser abertos.
          </p>
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={efetivarTroca}
              disabled={ocupado}
              className="w-full h-14 bg-primary text-on-primary font-button-text rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Icon name={ocupado ? 'progress_activity' : 'check'} className={ocupado ? 'animate-spin' : ''} />
              Sim, trocar a senha
            </button>
            <button
              onClick={() => setConfirmarTroca(false)}
              disabled={ocupado}
              className="w-full h-14 bg-surface-container-highest text-on-surface font-button-text rounded-xl hover:bg-outline-variant transition-colors"
            >
              Cancelar
            </button>
          </div>
        </ModalOverlay>
      )}

      {/* ── Aviso de risco ao desligar a espera de 5 s ──────────── */}
      {avisoEspera && (
        <ModalOverlay>
          <div className="w-20 h-20 bg-error-container rounded-full flex items-center justify-center text-error mx-auto">
            <Icon name="warning" className="text-[48px]" />
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface text-center">
            Desligar a espera de 5 segundos?
          </h2>
          <div className="text-on-surface-variant font-body-md space-y-2">
            <p>Sem a espera, os riscos aumentam:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Um clique acidental exclui o paciente na hora.</li>
              <li>A exclusão é permanente e não há como desfazer.</li>
              <li>Some todo o histórico clínico, exames e financeiro daquele paciente.</li>
            </ul>
            <p className="pt-1">
              Recomendamos manter a espera ativada. Você pode religá-la aqui a qualquer momento.
            </p>
          </div>
          <div className="w-full flex flex-col gap-3 pt-2">
            <button
              onClick={() => {
                setDeleteDelay(false);
                setAvisoEspera(false);
                toast.show('Espera desligada. Cuidado ao excluir.', 'info');
              }}
              className="w-full h-14 bg-error text-on-error font-button-text rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Icon name="gpp_maybe" /> Entendo os riscos, desligar
            </button>
            <button
              onClick={() => setAvisoEspera(false)}
              className="w-full h-14 bg-surface-container-highest text-on-surface font-button-text rounded-xl hover:bg-outline-variant transition-colors"
            >
              Manter ativada
            </button>
          </div>
        </ModalOverlay>
      )}
    </Layout>
  );
}

// Sobreposição central reutilizada pelas confirmações (mesmo padrão da exclusão).
function ModalOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] border border-outline-variant p-8 shadow-xl animate-zoom-in flex flex-col gap-4">
        {children}
      </div>
    </div>
  );
}
