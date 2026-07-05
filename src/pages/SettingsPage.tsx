import { useEffect, useState } from 'react';
import { usePatients, useBackups } from '../data/store';
import { useAuth } from '../data/auth';
import { mockRecoveryKey, runningInTauri, backend } from '../data/backend';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Card } from '../components/ui';
import { useToast } from '../components/Toast';

// Backup e Segurança (§9.5 / Etapa 10).
// No app Tauri o backup copia o arquivo .db criptografado de verdade; no
// navegador (mock) a cópia é simbólica. O backup automático "ao fechar" é
// disparado pela camada Rust no evento de fechamento da janela.

export function SettingsPage() {
  const toast = useToast();
  const patients = usePatients((s) => s.patients);
  const resetToSeed = usePatients((s) => s.resetToSeed);
  const { backups, load, fazerBackup } = useBackups();
  const chaveSessao = useAuth((s) => s.chaveRecuperacao);
  const chave = chaveSessao ?? mockRecoveryKey();
  const [dataDir, setDataDir] = useState('');

  useEffect(() => {
    void load();
    void backend.getDataDir().then(setDataDir);
  }, [load]);

  async function backupAgora() {
    const entry = await fazerBackup();
    toast.show(`Backup criado (${entry.registros} registros).`);
  }

  async function backupEscolherLocal() {
    if (!runningInTauri()) {
      toast.show('Escolha de local disponível apenas no app desktop.', 'info');
      return;
    }
    const { save } = await import('@tauri-apps/plugin-dialog');
    const stamp = new Date().toISOString().slice(0, 10);
    const path = await save({
      title: 'Salvar backup do banco',
      filters: [{ name: 'Banco OdontoApp', extensions: ['db'] }],
      defaultPath: `odontoapp-backup-${stamp}.db`,
    });
    if (!path) return;
    await backend.backupTo(path);
    await load();
    const nome = path.split(/[\\/]/).pop() ?? path;
    toast.show(`Backup salvo: ${nome}`);
  }

  return (
    <Layout>
      <h1 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md">Backup e Segurança</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-3 text-primary">
            <Icon name="backup" className="text-3xl" />
            <h2 className="font-headline-md text-headline-md">Backup dos dados</h2>
          </div>
          <p className="font-body-md text-on-surface-variant">
            O backup automático acontece ao fechar o aplicativo. As cópias permanecem criptografadas.
          </p>

          {dataDir && (
            <div className="bg-surface-container rounded-lg px-4 py-3 text-sm">
              <span className="text-secondary font-semibold">Local do banco:</span>{' '}
              <span className="text-on-surface-variant break-all">{dataDir}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={backupAgora}
              className="h-14 px-6 rounded-xl bg-primary text-on-primary font-button-text text-button-text shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="save" /> Backup rápido
            </button>
            <button
              onClick={backupEscolherLocal}
              className="h-14 px-6 rounded-xl border-2 border-primary text-primary font-button-text text-button-text hover:bg-surface-container-high active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="folder_open" /> Salvar em...
            </button>
          </div>

          <div className="mt-2">
            <h3 className="font-label-lg text-label-lg text-secondary mb-2">Últimas cópias</h3>
            {backups.length === 0 ? (
              <p className="text-on-surface-variant italic">Nenhum backup gerado ainda.</p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {backups.map((b) => (
                  <li key={b.id} className="flex flex-col py-3 gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <Icon name="folder_zip" className="text-on-surface-variant flex-shrink-0" />
                        <span className="truncate">{new Date(b.criadoEm).toLocaleString('pt-BR')}</span>
                      </span>
                      <span className="text-on-surface-variant text-sm whitespace-nowrap">
                        {b.registros} reg. · {b.tipo}
                      </span>
                    </div>
                    {b.caminho && (
                      <span className="text-xs text-on-surface-variant opacity-60 truncate pl-7">
                        {b.caminho}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        <Card className="flex flex-col gap-stack-sm">
          <div className="flex items-center gap-3 text-primary">
            <Icon name="key" className="text-3xl" />
            <h2 className="font-headline-md text-headline-md">Chave de recuperação</h2>
          </div>
          <p className="font-body-md text-on-surface-variant">
            Guarde sua chave em local seguro. Sem a senha e sem a chave, os dados são irrecuperáveis por
            design (a base é criptografada).
          </p>
          <div className="bg-surface-container-highest border border-outline rounded-xl p-6 text-center">
            <span className="font-label-lg text-secondary uppercase tracking-widest block mb-2">
              Sua chave
            </span>
            {chave ? (
              <span className="text-[28px] font-extrabold text-primary break-all select-all">{chave}</span>
            ) : (
              <span className="text-body-md text-on-surface-variant">
                A chave só é exibida uma vez, no primeiro acesso. Guarde-a com cuidado — ela não pode ser
                consultada de novo por segurança.
              </span>
            )}
          </div>

          <div className="mt-4 border-t border-outline-variant pt-4">
            <h3 className="font-label-lg text-label-lg text-secondary mb-2">Dados</h3>
            <p className="text-on-surface-variant text-sm mb-3">
              {patients.length} pacientes carregados{' '}
              {runningInTauri() ? '(banco local criptografado)' : '(modo demonstração no navegador)'}.
            </p>
            <button
              onClick={async () => {
                await resetToSeed();
                toast.show('Base de demonstração restaurada.', 'info');
              }}
              className="h-12 px-6 rounded-lg border-2 border-outline-variant text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center gap-2"
            >
              <Icon name="restart_alt" /> Restaurar dados de demonstração
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
