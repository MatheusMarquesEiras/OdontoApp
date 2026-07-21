import { useEffect, useState } from 'react';
import type { Update } from '@tauri-apps/plugin-updater';
import { runningInTauri } from '../data/backend';
import { Icon } from './Icon';

// Atualização automática. Ao abrir o app (só no desktop/Tauri), verifica no
// GitHub Releases se há versão nova. Se houver, mostra um aviso perguntando se
// a pessoa quer atualizar agora — nada acontece sem o "sim". Baixa, instala e
// reinicia. Offline ou sem release: ignora em silêncio (não atrapalha o uso).

type Fase = 'perguntar' | 'baixando';

export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [fase, setFase] = useState<Fase>('perguntar');
  const [pct, setPct] = useState(0);
  const [erro, setErro] = useState('');
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    if (!runningInTauri()) return;
    let cancelado = false;
    (async () => {
      try {
        const { check } = await import('@tauri-apps/plugin-updater');
        const u = await check();
        if (!cancelado && u) setUpdate(u);
      } catch {
        /* sem internet ou sem release publicada → não faz nada */
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (!update || fechado) return null;

  async function instalar() {
    if (!update) return;
    setErro('');
    setFase('baixando');
    try {
      let total = 0;
      let baixado = 0;
      await update.downloadAndInstall((e) => {
        if (e.event === 'Started') total = e.data.contentLength ?? 0;
        else if (e.event === 'Progress') {
          baixado += e.data.chunkLength ?? 0;
          if (total > 0) setPct(Math.min(100, Math.round((baixado / total) * 100)));
        }
      });
      const { relaunch } = await import('@tauri-apps/plugin-process');
      await relaunch();
    } catch {
      setErro('Não foi possível instalar agora. Tente mais tarde.');
      setFase('perguntar');
    }
  }

  const baixando = fase === 'baixando';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-sm">
      <div className="bg-surface-container-lowest w-full max-w-md rounded-[2rem] border border-outline-variant p-8 shadow-xl animate-zoom-in flex flex-col gap-4">
        <div className="w-20 h-20 bg-primary-container/20 rounded-full flex items-center justify-center text-primary mx-auto">
          <Icon name="rocket_launch" className="text-[48px]" />
        </div>
        <h2 className="font-headline-md text-headline-md text-on-surface text-center">
          Nova versão disponível
        </h2>
        <p className="text-on-surface-variant font-body-md text-center">
          A versão <span className="font-bold text-primary">{update.version}</span> do OdontoApp está
          pronta. Seus dados e a sua senha continuam do mesmo jeito após atualizar.
        </p>

        {update.body && !baixando && (
          <div className="max-h-32 overflow-y-auto rounded-lg bg-surface-container px-4 py-3 text-sm text-on-surface-variant whitespace-pre-line">
            {update.body}
          </div>
        )}

        {baixando && (
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full rounded-full bg-surface-container-highest overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm text-on-surface-variant text-center">
              Baixando e instalando… {pct}%
            </span>
          </div>
        )}

        {erro && (
          <div className="flex items-center gap-2 text-error font-label-lg justify-center">
            <Icon name="error" /> {erro}
          </div>
        )}

        <div className="w-full flex flex-col gap-3 pt-1">
          <button
            onClick={instalar}
            disabled={baixando}
            className="w-full h-14 bg-primary text-on-primary font-button-text rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Icon
              name={baixando ? 'progress_activity' : 'download'}
              className={baixando ? 'animate-spin' : ''}
            />
            {baixando ? 'Atualizando…' : 'Atualizar agora'}
          </button>
          {!baixando && (
            <button
              onClick={() => setFechado(true)}
              className="w-full h-14 bg-surface-container-highest text-on-surface font-button-text rounded-xl hover:bg-outline-variant transition-colors"
            >
              Agora não
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
