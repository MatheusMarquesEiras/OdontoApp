import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { usePatients } from '../data/store';
import { usePatientDraft } from '../lib/useDraft';
import type { AdultAnamnese, AdultExame } from '../data/types';
import { Layout } from '../components/Layout';
import { Icon } from '../components/Icon';
import { useToast } from '../components/Toast';
import { exportPatientDocx } from '../lib/docx';
import { calcAge } from '../lib/format';
import {
  Card,
  TextField,
  TextArea,
  SelectField,
  SimNaoToggle,
  CheckboxGroup,
} from '../components/ui';
import { TabsNav, SaveBar, TreatmentsSection, type TabDef } from '../components/patientForm';

const TABS: TabDef[] = [
  { id: 'dados', label: 'Dados Pessoais', icon: 'person' },
  { id: 'anamnese', label: 'Anamnese', icon: 'monitor_heart' },
  { id: 'exame', label: 'Exame Intra-oral', icon: 'dentistry' },
  { id: 'plano', label: 'Plano de Tratamento', icon: 'assignment' },
];

const ENFERMIDADES = ['Diabetes', 'Tuberculose', 'Artrite', 'Problemas cardíacos', 'Asma', 'Hipertensão', 'Problemas renais', 'Problemas hepáticos'];
const ANESTESICOS = ['Sedativos', 'Barbitúricos', 'Outra droga'];
const ALERGIAS = ['Aspirina', 'Penicilina', 'Sulfas', 'Iodo'];

export function AdultFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const savePatient = usePatients((s) => s.savePatient);
  const [draft, setDraft] = usePatientDraft(id);
  const [tab, setTab] = useState('dados');

  if (!draft) return <Navigate to="/pacientes" replace />;

  const set = (patch: Partial<typeof draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setAnamnese = (patch: Partial<AdultAnamnese>) =>
    setDraft((d) => (d ? { ...d, anamnese: { ...d.anamnese, ...patch } } : d));
  const setExame = (patch: Partial<AdultExame>) =>
    setDraft((d) => (d ? { ...d, exame: { ...d.exame, ...patch } } : d));

  const a = draft.anamnese ?? {};
  const e = draft.exame ?? {};
  const idade = calcAge(draft.dataNascimento);

  function salvar() {
    savePatient(draft!);
    toast.show('Prontuário salvo com sucesso!');
  }

  return (
    <Layout>
      <div className="flex flex-col gap-stack-md mb-32">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-primary">Prontuário do Paciente</h1>
              <p className="text-on-surface-variant font-body-md">
                {draft.nome || 'Novo paciente'}
                {idade !== null && ` · ${idade} anos`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-full bg-secondary-container text-on-secondary-container font-bold">
                Adulto
              </span>
              <button
                onClick={() => {
                  savePatient({ ...draft, tipo: 'crianca' });
                  toast.show('Alterado para ficha infantil.', 'info');
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-lg"
                title="Trocar para ficha infantil"
              >
                <Icon name="swap_horiz" /> Trocar tipo
              </button>
            </div>
          </div>
          <TabsNav tabs={TABS} active={tab} onChange={setTab} />
        </div>

        {/* Dados Pessoais */}
        {tab === 'dados' && (
          <Card className="flex flex-col gap-stack-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              <TextField label="Nome Completo" value={draft.nome} onChange={(v) => set({ nome: v })} placeholder="Ex: Maria Oliveira Santos" />
              <TextField label="CPF" value={draft.cpf} onChange={(v) => set({ cpf: v })} placeholder="000.000.000-00" />
              <TextField label="RG" value={draft.rg} onChange={(v) => set({ rg: v })} />
              <TextField label="Data de Nascimento" type="date" value={draft.dataNascimento} onChange={(v) => set({ dataNascimento: v })} />
              <SelectField label="Sexo" value={draft.sexo} onChange={(v) => set({ sexo: v })} options={['Feminino', 'Masculino', 'Outro']} />
              <SelectField label="Estado Civil" value={draft.estadoCivil} onChange={(v) => set({ estadoCivil: v })} options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']} />
              <TextField label="Profissão" value={draft.profissao} onChange={(v) => set({ profissao: v })} />
              <TextField label="Telefone / WhatsApp" type="tel" value={draft.telefone} onChange={(v) => set({ telefone: v })} placeholder="(11) 99999-9999" />
              <TextField label="E-mail" type="email" value={draft.email} onChange={(v) => set({ email: v })} placeholder="paciente@email.com" hint={draft.email && !draft.email.includes('@') ? 'E-mail parece incompleto (você ainda pode salvar).' : undefined} />
              <TextField label="Cidade" value={draft.cidade} onChange={(v) => set({ cidade: v })} />
              <TextField label="UF" value={draft.uf} onChange={(v) => set({ uf: v })} />
              <TextField label="Indicado por" value={draft.indicadoPor} onChange={(v) => set({ indicadoPor: v })} />
            </div>
            <TextArea label="Endereço Completo" value={draft.endereco} onChange={(v) => set({ endereco: v })} placeholder="Rua, número, complemento, bairro, cidade, CEP" />
          </Card>
        )}

        {/* Anamnese */}
        {tab === 'anamnese' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Questionário de Saúde</h2>
            <div className="flex flex-col">
              <SimNaoToggle label="Está sob tratamento médico atualmente?" value={a.sobTratamentoMedico} onChange={(v) => setAnamnese({ sobTratamentoMedico: v })} />
              <SimNaoToggle label="Possui alergia a algum medicamento?" value={a.alergiaMedicamento} onChange={(v) => setAnamnese({ alergiaMedicamento: v })} />
              <SimNaoToggle label="É hipertenso ou diabético?" value={a.hipertensoDiabetico} onChange={(v) => setAnamnese({ hipertensoDiabetico: v })} />
              <SimNaoToggle label="Já teve problemas com anestesia local?" value={a.problemaAnestesia} onChange={(v) => setAnamnese({ problemaAnestesia: v })} />
              <SimNaoToggle label="As gengivas sangram com facilidade?" value={a.gengivasSangram} onChange={(v) => setAnamnese({ gengivasSangram: v })} />
              <SimNaoToggle label="Está grávida?" value={a.gravida} onChange={(v) => setAnamnese({ gravida: v })} />
            </div>
            <CheckboxGroup label="Enfermidades" options={ENFERMIDADES} values={a.enfermidades} onChange={(v) => setAnamnese({ enfermidades: v })} />
            <CheckboxGroup label="Uso de anestésicos / drogas" options={ANESTESICOS} values={a.anestesicos} onChange={(v) => setAnamnese({ anestesicos: v })} />
            <CheckboxGroup label="Alergias conhecidas" options={ALERGIAS} values={a.alergias} onChange={(v) => setAnamnese({ alergias: v })} />
            <TextArea label="Observações médicas relevantes" rows={4} value={a.observacoes} onChange={(v) => setAnamnese({ observacoes: v })} />
          </Card>
        )}

        {/* Exame Intra-oral */}
        {tab === 'exame' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Condições Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              <SelectField label="Higiene" value={e.higiene} onChange={(v) => setExame({ higiene: v })} options={['Ótima', 'Boa', 'Regular', 'Precária']} />
              <SelectField label="Halitose" value={e.halitose} onChange={(v) => setExame({ halitose: v })} options={['Ausente', 'Moderada', 'Forte']} />
              <SelectField label="Tártaro" value={e.tartaro} onChange={(v) => setExame({ tartaro: v })} options={['Ausente', 'Pouco', 'Muito']} />
              <SelectField label="Gengiva" value={e.gengiva} onChange={(v) => setExame({ gengiva: v })} options={['Normal', 'Gengivite', 'Periodontite']} />
              <SelectField label="Mucosa" value={e.mucosa} onChange={(v) => setExame({ mucosa: v })} options={['Normal', 'Alterada']} />
              <TextField label="Língua" value={e.lingua} onChange={(v) => setExame({ lingua: v })} />
              <TextField label="Palato" value={e.palato} onChange={(v) => setExame({ palato: v })} />
              <TextField label="Assoalho bucal" value={e.assoalho} onChange={(v) => setExame({ assoalho: v })} />
            </div>
            <TextArea label="Tecidos moles (gengivas, língua, bochechas…)" rows={4} value={e.tecidosMoles} onChange={(v) => setExame({ tecidosMoles: v })} />
          </Card>
        )}

        {/* Plano de Tratamento */}
        {tab === 'plano' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Plano de Tratamento</h2>
            <TextArea label="Descrição do plano" rows={3} value={draft.plano?.descricao} onChange={(v) => set({ plano: { ...draft.plano, descricao: v } })} />
            <TextField label="Data do plano" type="date" value={draft.plano?.data} onChange={(v) => set({ plano: { ...draft.plano, data: v } })} />
            <div className="border-t border-outline-variant pt-stack-md">
              <TreatmentsSection patient={draft} onChange={(t) => set({ tratamentos: t })} />
            </div>
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button
                onClick={() => exportPatientDocx(draft).then(() => toast.show('Ficha DOCX gerada!'))}
                className="flex-1 bg-surface-variant text-on-surface-variant h-14 rounded-lg font-label-lg border border-outline hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"
              >
                <Icon name="description" /> Gerar Ficha (DOCX)
              </button>
            </div>
          </Card>
        )}
      </div>

      <SaveBar nome={draft.nome} onCancel={() => navigate('/pacientes')} onSave={salvar} />
    </Layout>
  );
}
