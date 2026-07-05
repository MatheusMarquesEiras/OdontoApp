import { usePatients, useBackups } from '../data/store';
import { useAuth } from '../data/auth';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { Card } from '../components/ui';
import { useToast } from '../components/Toast';

// Backup e Segurança (§9.5 / Etapa 10, mock).
// Backup manual + histórico das últimas cópias. O backup automático "ao fechar"
// seria disparado no evento de fechamento da janela do Tauri.

export function SettingsPage() {
  const toast = useToast();
  const patients = usePatients((s) => s.patients);
  const resetToSeed = usePatients((s) => s.resetToSeed);
  const { backups, fazerBackup } = useBackups();
  const chave = useAuth((s) => s.chaveRecuperacao);

  function backupAgora() {
    const entry = fazerBackup('manual', patients.length);
    toast.show(`Backup criado (${entry.registros} registros).`);
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
            O backup automático acontece ao fechar o aplicativo. Você também pode gerar uma cópia agora —
            útil antes de levar os dados em um pendrive. As cópias permanecem criptografadas.
          </p>
          <button
            onClick={backupAgora}
            className="h-16 px-8 rounded-xl bg-primary text-on-primary font-button-text text-button-text shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3 self-start"
          >
            <Icon name="save" /> Fazer backup agora
          </button>

          <div className="mt-4">
            <h3 className="font-label-lg text-label-lg text-secondary mb-2">Últimas cópias</h3>
            {backups.length === 0 ? (
              <p className="text-on-surface-variant italic">Nenhum backup manual gerado ainda.</p>
            ) : (
              <ul className="divide-y divide-outline-variant">
                {backups.map((b) => (
                  <li key={b.id} className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2">
                      <Icon name="folder_zip" className="text-on-surface-variant" />
                      {new Date(b.criadoEm).toLocaleString('pt-BR')}
                    </span>
                    <span className="text-on-surface-variant text-sm">
                      {b.registros} registros · {b.tipo}
                    </span>
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
            <span className="text-[28px] font-extrabold text-primary break-all select-all">
              {chave ?? '—'}
            </span>
          </div>

          <div className="mt-4 border-t border-outline-variant pt-4">
            <h3 className="font-label-lg text-label-lg text-secondary mb-2">Dados (mock)</h3>
            <p className="text-on-surface-variant text-sm mb-3">
              {patients.length} pacientes carregados. Você pode restaurar a base de demonstração.
            </p>
            <button
              onClick={() => {
                resetToSeed();
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
