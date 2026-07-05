import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '../data/store';
import { usePatientDraft } from '../lib/useDraft';
import type { ChildFicha } from '../data/types';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { exportPatientDocx } from '../lib/docx';
import { calcAge } from '../lib/format';
import { cpfHint } from '../lib/validation';
import {
  Card,
  TextField,
  TextArea,
  SelectField,
  SimNaoToggle,
  CheckboxGroup,
} from '../components/ui';
import { TabsNav, SaveBar, TreatmentsSection, type TabDef } from '../components/patientForm';
import { Odontograma } from '../components/Odontograma';

const TABS: TabDef[] = [
  { id: 'dados', label: 'Dados', icon: 'person' },
  { id: 'saude', label: 'Saúde e Hábitos', icon: 'monitor_heart' },
  { id: 'higiene', label: 'Higiene e Dieta', icon: 'restaurant' },
  { id: 'historico', label: 'Histórico', icon: 'history_edu' },
  { id: 'plano', label: 'Plano de Tratamento', icon: 'assignment' },
];

const MOTIVOS = ['1ª vez', 'Rotina', 'Dor', 'Cárie', 'Encaminhamento Médico/Fono', 'Trauma (queda/pancada)', 'Mordida incorreta'];
const QUEM_ESCOVA = ['A própria criança', 'Responsáveis', 'Ambos'];

export function ChildFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const savePatient = usePatients((s) => s.savePatient);
  const [draft, setDraft] = usePatientDraft(id);
  const [tab, setTab] = useState('dados');

  if (!draft) return <Navigate to="/pacientes" replace />;

  const set = (patch: Partial<typeof draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setFicha = (patch: Partial<ChildFicha>) =>
    setDraft((d) => (d ? { ...d, ficha: { ...d.ficha, ...patch } } : d));

  const f = draft.ficha ?? {};
  const idade = calcAge(draft.dataNascimento);

  function salvar() {
    savePatient(draft!);
    toast.show('Ficha salva com sucesso!');
  }

  return (
    <Layout>
      <div className="flex flex-col gap-stack-md mb-32">
        {/* Bento header (lúdico) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="md:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-container-highest flex items-center justify-center text-primary flex-shrink-0">
              <Icon name="child_care" className="text-[56px]" filled />
            </div>
            <div className="min-w-0">
              <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1 truncate">
                {draft.nome || 'Novo Paciente Infantil'}
              </h1>
              <p className="text-on-surface-variant font-body-lg">
                {idade !== null ? `${idade} anos · ` : ''}Odontopediatria — cuidado humanizado e lúdico.
              </p>
            </div>
          </div>
          <div className="bg-primary text-white rounded-xl p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <Icon name="volunteer_activism" className="text-4xl" />
              <button
                onClick={() => {
                  savePatient({ ...draft, tipo: 'adulto' });
                  toast.show('Alterado para ficha adulta.', 'info');
                }}
                className="text-sm font-bold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1 flex items-center gap-1 transition-colors"
                title="Trocar para ficha adulta"
              >
                <Icon name="swap_horiz" className="text-base" /> Trocar tipo
              </button>
            </div>
            <p className="font-headline-md text-headline-md leading-tight mt-4">Ficha Infantil</p>
          </div>
        </section>

        <TabsNav tabs={TABS} active={tab} onChange={setTab} />

        {/* Dados */}
        {tab === 'dados' && (
          <Card className="flex flex-col gap-stack-md">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
              <span className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-sm">1</span>
              Identificação da Criança
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <TextField label="Nome Completo" value={draft.nome} onChange={(v) => set({ nome: v })} placeholder="Nome da criança" />
              <TextField label="Data de Nascimento" type="date" value={draft.dataNascimento} onChange={(v) => set({ dataNascimento: v })} />
              <TextField label="Escola / Creche" value={f.escola} onChange={(v) => setFicha({ escola: v })} />
              <TextField label="Série / Ano" value={f.serie} onChange={(v) => setFicha({ serie: v })} placeholder="Ex: 1º Ano" />
              <TextField label="Nome do Pai" value={f.nomePai} onChange={(v) => setFicha({ nomePai: v })} />
              <TextField label="Nome da Mãe" value={f.nomeMae} onChange={(v) => setFicha({ nomeMae: v })} />
              <TextField label="Telefone" type="tel" value={draft.telefone} onChange={(v) => set({ telefone: v })} />
              <TextField label="Bairro" value={f.bairro} onChange={(v) => setFicha({ bairro: v })} />
              <TextField label="Cidade" value={draft.cidade} onChange={(v) => set({ cidade: v })} />
              <TextField label="Indicação" value={f.indicacao} onChange={(v) => setFicha({ indicacao: v })} />
            </div>
            <CheckboxGroup label="Motivo da consulta" options={MOTIVOS} values={f.motivos} onChange={(v) => setFicha({ motivos: v })} />
          </Card>
        )}

        {/* Saúde e Hábitos */}
        {tab === 'saude' && (
          <Card className="flex flex-col gap-stack-md">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
              <span className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-sm">2</span>
              Histórico de Saúde e Hábitos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div className="space-y-stack-md">
                <h4 className="font-label-lg text-label-lg text-secondary border-b pb-2 border-outline-variant">Informações Médicas</h4>
                <TextArea label="A criança possui alergias?" value={f.alergiasCrianca} onChange={(v) => setFicha({ alergiasCrianca: v })} placeholder="Medicamentos ou alimentos" rows={3} />
                <TextArea label="Uso contínuo de medicamentos?" value={f.medicamentosContinuos} onChange={(v) => setFicha({ medicamentosContinuos: v })} placeholder="Quais e dosagens?" rows={3} />
                <SimNaoToggle label="Faz tratamento com fonoaudiólogo?" value={f.fonoaudiologo} onChange={(v) => setFicha({ fonoaudiologo: v })} />
              </div>
              <div className="space-y-1">
                <h4 className="font-label-lg text-label-lg text-secondary border-b pb-2 border-outline-variant mb-3">Hábitos Parafuncionais</h4>
                <SimNaoToggle label="Usa mamadeira?" value={f.usaMamadeira} onChange={(v) => setFicha({ usaMamadeira: v })} />
                {f.usaMamadeira === 'sim' && <div className="py-2"><TextField label="Até que idade?" value={f.mamadeiraIdade} onChange={(v) => setFicha({ mamadeiraIdade: v })} /></div>}
                <SimNaoToggle label="Usa chupeta?" value={f.usaChupeta} onChange={(v) => setFicha({ usaChupeta: v })} />
                {f.usaChupeta === 'sim' && <div className="py-2"><TextField label="Até que idade?" value={f.chupetaIdade} onChange={(v) => setFicha({ chupetaIdade: v })} /></div>}
                <SimNaoToggle label="Chupa os dedos?" value={f.chupaDedos} onChange={(v) => setFicha({ chupaDedos: v })} />
                <SimNaoToggle label="Rói unhas?" value={f.roiUnhas} onChange={(v) => setFicha({ roiUnhas: v })} />
                <SimNaoToggle label="Ronca ao dormir?" value={f.ronco} onChange={(v) => setFicha({ ronco: v })} />
                <SimNaoToggle label="Respira pela boca?" value={f.respiraBoca} onChange={(v) => setFicha({ respiraBoca: v })} />
                <SimNaoToggle label="Range/aperta os dentes (bruxismo)?" value={f.bruxismo} onChange={(v) => setFicha({ bruxismo: v })} />
              </div>
            </div>
            <div className="border-t border-outline-variant pt-stack-md">
              <h4 className="font-label-lg text-label-lg text-secondary border-b pb-2 border-outline-variant mb-4">Gestação, Parto e Aleitamento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                <SelectField label="Tipo de parto" value={f.tipoParto} onChange={(v) => setFicha({ tipoParto: v })} options={['Normal', 'Cesárea', 'Fórceps']} />
                <SelectField label="Aleitamento" value={f.aleitamento} onChange={(v) => setFicha({ aleitamento: v })} options={['Materno', 'Artificial', 'Ambos']} />
                <TextField label="Aleitamento até que idade?" value={f.aleitamentoIdade} onChange={(v) => setFicha({ aleitamentoIdade: v })} />
              </div>
              <div className="mt-3">
                <CheckboxGroup
                  label="Durante a gestação houve:"
                  options={['Diabetes gestacional', 'Hipertensão', 'Gravidez de risco', 'Parto prematuro', 'Baixo peso']}
                  values={[
                    ...(f.diabetesGestacional === 'sim' ? ['Diabetes gestacional'] : []),
                    ...(f.hipertensaoGestacional === 'sim' ? ['Hipertensão'] : []),
                    ...(f.gravidezRisco === 'sim' ? ['Gravidez de risco'] : []),
                    ...(f.partoPrematuro === 'sim' ? ['Parto prematuro'] : []),
                    ...(f.baixoPeso === 'sim' ? ['Baixo peso'] : []),
                  ]}
                  onChange={(vals) =>
                    setFicha({
                      diabetesGestacional: vals.includes('Diabetes gestacional') ? 'sim' : 'nao',
                      hipertensaoGestacional: vals.includes('Hipertensão') ? 'sim' : 'nao',
                      gravidezRisco: vals.includes('Gravidez de risco') ? 'sim' : 'nao',
                      partoPrematuro: vals.includes('Parto prematuro') ? 'sim' : 'nao',
                      baixoPeso: vals.includes('Baixo peso') ? 'sim' : 'nao',
                    })
                  }
                />
              </div>
            </div>
          </Card>
        )}

        {/* Higiene e Dieta */}
        {tab === 'higiene' && (
          <Card className="flex flex-col gap-stack-md">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
              <span className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-sm">3</span>
              Higiene e Rotina Alimentar
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <SelectField label="Frequência de escovação diária" value={f.escovacoesDia} onChange={(v) => setFicha({ escovacoesDia: v })} options={['1 vez ao dia', '2 vezes ao dia', '3 vezes ou mais ao dia', 'Ocasionalmente']} />
              <TextField label="Creme dental (ppm flúor / marca)" value={f.cremeFluor} onChange={(v) => setFicha({ cremeFluor: v })} placeholder="Ex: 1100 ppm" />
              <SelectField label="Tipo de escova" value={f.tipoEscova} onChange={(v) => setFicha({ tipoEscova: v })} options={['Macia pequena', 'Macia grande', 'Dura pequena', 'Dura grande']} />
              <SelectField label="Escova antes de dormir?" value={f.escovaAntesDormir} onChange={(v) => setFicha({ escovaAntesDormir: v })} options={['Sim', 'Não', 'Às vezes']} />
            </div>
            <CheckboxGroup label="Quem realiza a escovação?" options={QUEM_ESCOVA} values={f.quemEscova} onChange={(v) => setFicha({ quemEscova: v })} />
            <SimNaoToggle label="Usa fio dental?" value={f.fioDental} onChange={(v) => setFicha({ fioDental: v })} />
            <div className="flex flex-col gap-3">
              <span className="font-label-lg text-label-lg text-primary">Consumo de açúcar / doces</span>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { v: 'Raramente', icon: 'sentiment_very_satisfied' },
                  { v: 'Fins de semana', icon: 'sentiment_satisfied' },
                  { v: 'Diário (Pequeno)', icon: 'sentiment_neutral' },
                  { v: 'Frequentemente', icon: 'sentiment_dissatisfied' },
                ].map((o) => {
                  const active = f.consumoAcucar === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => setFicha({ consumoAcucar: o.v })}
                      className={`flex flex-col items-center p-4 rounded-xl border transition-all ${
                        active ? 'bg-primary-container text-on-primary-container border-primary' : 'bg-surface-container border-transparent hover:border-primary'
                      }`}
                    >
                      <Icon name={o.icon} className="text-3xl mb-2" />
                      <span className="text-sm text-center">{o.v}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Histórico */}
        {tab === 'historico' && (
          <Card className="flex flex-col gap-stack-md">
            <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-3">
              <span className="w-8 h-8 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center text-sm">4</span>
              Histórico Odontológico Anterior
            </h3>
            <TextArea label="Já consultou um dentista antes? Por quê?" value={f.jaConsultouDentista} onChange={(v) => setFicha({ jaConsultouDentista: v })} rows={3} />
            <SimNaoToggle label="Teve alguma experiência traumática em consultório anterior?" value={f.experienciaTraumatica} onChange={(v) => setFicha({ experienciaTraumatica: v })} />
            <TextField label="Histórico de traumatismo dental (quedas/batidas)" value={f.traumatismoDental} onChange={(v) => setFicha({ traumatismoDental: v })} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter border-t border-outline-variant pt-stack-md">
              <SimNaoToggle label="Autoriza foto para rede social da clínica?" value={f.autorizaFoto} onChange={(v) => setFicha({ autorizaFoto: v })} />
              <TextField label="Programa/desenho/música preferido" value={f.preferencias} onChange={(v) => setFicha({ preferencias: v })} />
            </div>
            <h4 className="font-label-lg text-label-lg text-secondary border-b pb-2 border-outline-variant mt-4">Termo de Responsável</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
              <TextField label="Nome do responsável" value={f.nomeResponsavel} onChange={(v) => setFicha({ nomeResponsavel: v })} />
              <TextField label="RG do responsável" value={f.rgResponsavel} onChange={(v) => setFicha({ rgResponsavel: v })} />
              <TextField label="CPF do responsável" value={f.cpfResponsavel} onChange={(v) => setFicha({ cpfResponsavel: v })} hint={cpfHint(f.cpfResponsavel)} />
            </div>
            <TextArea label="Outras informações importantes" value={f.outrasInformacoes} onChange={(v) => setFicha({ outrasInformacoes: v })} rows={3} />

            <div className="border-t border-outline-variant pt-stack-md">
              <h4 className="font-headline-md text-headline-md text-secondary mb-4">Odontograma (dentição decídua)</h4>
              <Odontograma tipo="crianca" value={draft.odontograma} onChange={(o) => set({ odontograma: o })} />
            </div>
          </Card>
        )}

        {/* Plano de Tratamento */}
        {tab === 'plano' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Plano de Tratamento</h2>
            <TextArea label="Descrição do plano" rows={3} value={draft.plano?.descricao} onChange={(v) => set({ plano: { ...draft.plano, descricao: v } })} />
            <div className="border-t border-outline-variant pt-stack-md">
              <TreatmentsSection patient={draft} onChange={(t) => set({ tratamentos: t })} />
            </div>
            <button
              onClick={() => exportPatientDocx(draft).then(() => toast.show('Ficha DOCX gerada!'))}
              className="flex-1 bg-surface-variant text-on-surface-variant h-14 rounded-lg font-label-lg border border-outline hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
            >
              <Icon name="description" /> Gerar Ficha (DOCX)
            </button>
          </Card>
        )}
      </div>

      <SaveBar nome={draft.nome} onCancel={() => navigate('/pacientes')} onSave={salvar} />
    </Layout>
  );
}
