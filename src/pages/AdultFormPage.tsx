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
import { cpfHint, emailHint } from '../lib/validation';
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
              <TextField label="CPF" value={draft.cpf} onChange={(v) => set({ cpf: v })} placeholder="000.000.000-00" hint={cpfHint(draft.cpf)} />
              <TextField label="RG" value={draft.rg} onChange={(v) => set({ rg: v })} />
              <TextField label="Data de Nascimento" type="date" value={draft.dataNascimento} onChange={(v) => set({ dataNascimento: v })} />
              <TextField label="Local de Nascimento" value={draft.localNascimento} onChange={(v) => set({ localNascimento: v })} />
              <SelectField label="Sexo" value={draft.sexo} onChange={(v) => set({ sexo: v })} options={['Feminino', 'Masculino', 'Outro']} />
              <SelectField label="Estado Civil" value={draft.estadoCivil} onChange={(v) => set({ estadoCivil: v })} options={['Solteiro(a)', 'Casado(a)', 'Divorciado(a)', 'Viúvo(a)']} />
              <TextField label="Profissão" value={draft.profissao} onChange={(v) => set({ profissao: v })} />
              <TextField label="Nº (prontuário)" value={draft.prontuario} onChange={(v) => set({ prontuario: v })} />
              <TextField label="Telefone / WhatsApp" type="tel" value={draft.telefone} onChange={(v) => set({ telefone: v })} placeholder="(11) 99999-9999" />
              <TextField label="Celular" type="tel" value={draft.celular} onChange={(v) => set({ celular: v })} />
              <TextField label="Telefone Comercial" type="tel" value={draft.telefoneComercial} onChange={(v) => set({ telefoneComercial: v })} />
              <TextField label="E-mail" type="email" value={draft.email} onChange={(v) => set({ email: v })} placeholder="paciente@email.com" hint={emailHint(draft.email)} />
              <TextField label="Cidade" value={draft.cidade} onChange={(v) => set({ cidade: v })} />
              <TextField label="UF" value={draft.uf} onChange={(v) => set({ uf: v })} />
              <TextField label="CEP" value={draft.cep} onChange={(v) => set({ cep: v })} />
              <TextField label="Início do Tratamento" type="date" value={draft.inicioTratamento} onChange={(v) => set({ inicioTratamento: v })} />
              <TextField label="Indicado por" value={draft.indicadoPor} onChange={(v) => set({ indicadoPor: v })} />
            </div>
            <TextArea label="Endereço Residencial" value={draft.endereco} onChange={(v) => set({ endereco: v })} placeholder="Rua, número, complemento, bairro, cidade, CEP" />
            <TextArea label="Endereço Comercial" value={draft.enderecoComercial} onChange={(v) => set({ enderecoComercial: v })} />
          </Card>
        )}

        {/* Anamnese */}
        {tab === 'anamnese' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Questionário de Saúde</h2>

            {/* Tratamento médico geral */}
            <div className="flex flex-col">
              <SimNaoToggle label="Está sob tratamento médico atualmente?" value={a.sobTratamentoMedico} onChange={(v) => setAnamnese({ sobTratamentoMedico: v })} />
              <SimNaoToggle label="É hipertenso ou diabético?" value={a.hipertensoDiabetico} onChange={(v) => setAnamnese({ hipertensoDiabetico: v })} />
              <SimNaoToggle label="Já teve problemas com anestesia local?" value={a.problemaAnestesia} onChange={(v) => setAnamnese({ problemaAnestesia: v })} />
              <SimNaoToggle label="As gengivas sangram com facilidade?" value={a.gengivasSangram} onChange={(v) => setAnamnese({ gengivasSangram: v })} />
              <SimNaoToggle label="Há retenção de alimentos entre os dentes?" value={a.retencaoAlimentos} onChange={(v) => setAnamnese({ retencaoAlimentos: v })} />
              <SimNaoToggle label="Está grávida?" value={a.gravida} onChange={(v) => setAnamnese({ gravida: v })} />
              {a.gravida === 'sim' && (
                <div className="py-2 pl-4">
                  <TextField label="De quantos meses?" value={a.gravidaMes} onChange={(v) => setAnamnese({ gravidaMes: v })} />
                </div>
              )}
            </div>

            {/* item 4 — Enfermidades com toggle + campo livre */}
            <div className="flex flex-col border-t border-outline-variant pt-stack-sm">
              <SimNaoToggle
                label="Possui alguma enfermidade?"
                value={a.temEnfermidades}
                onChange={(v) => setAnamnese({ temEnfermidades: v, enfermidades: v === 'nao' ? [] : a.enfermidades })}
              />
              {a.temEnfermidades === 'sim' && (
                <div className="flex flex-col gap-3 mt-3 pl-4">
                  <CheckboxGroup label="Enfermidades" options={ENFERMIDADES} values={a.enfermidades} onChange={(v) => setAnamnese({ enfermidades: v })} />
                  <TextField label="Outra enfermidade" value={a.outraEnfermidade} onChange={(v) => setAnamnese({ outraEnfermidade: v })} />
                </div>
              )}
            </div>

            {/* Alergias a medicamento / alimento */}
            <div className="flex flex-col border-t border-outline-variant pt-stack-sm">
              <SimNaoToggle label="Possui alergia a algum medicamento?" value={a.alergiaMedicamento} onChange={(v) => setAnamnese({ alergiaMedicamento: v })} />
              {a.alergiaMedicamento === 'sim' && (
                <div className="py-2 pl-4">
                  <TextField label="Qual medicamento?" value={a.alergiaMedicamentoQual} onChange={(v) => setAnamnese({ alergiaMedicamentoQual: v })} />
                </div>
              )}
              <SimNaoToggle label="Possui alergia a algum alimento?" value={a.alergiaAlimento} onChange={(v) => setAnamnese({ alergiaAlimento: v })} />
              {a.alergiaAlimento === 'sim' && (
                <div className="py-2 pl-4">
                  <TextField label="Qual alimento?" value={a.alergiaAlimentoQual} onChange={(v) => setAnamnese({ alergiaAlimentoQual: v })} />
                </div>
              )}

              {/* item 2 — Alergias conhecidas com toggle */}
              <SimNaoToggle
                label="Possui alergias conhecidas (Aspirina, Penicilina…)?"
                value={a.temAlergias}
                onChange={(v) => setAnamnese({ temAlergias: v, alergias: v === 'nao' ? [] : a.alergias })}
              />
              {a.temAlergias === 'sim' && (
                <div className="mt-3 pl-4">
                  <CheckboxGroup label="Marque as alergias" options={ALERGIAS} values={a.alergias} onChange={(v) => setAnamnese({ alergias: v })} />
                </div>
              )}
            </div>

            {/* item 3 — Hábitos e vícios agrupados */}
            <div className="flex flex-col border-t border-outline-variant pt-stack-sm">
              <p className="font-label-lg text-label-lg text-secondary mb-1">Hábitos e vícios</p>
              <SimNaoToggle label="Morde lápis / caneta?" value={a.mordeLapis} onChange={(v) => setAnamnese({ mordeLapis: v })} />
              <SimNaoToggle label="Rói as unhas?" value={a.roiUnhas} onChange={(v) => setAnamnese({ roiUnhas: v })} />
              <div className="py-3">
                <TextField label="Outros vícios" value={a.outrosVicios} onChange={(v) => setAnamnese({ outrosVicios: v })} placeholder="Ex: bruxismo, apertar os dentes…" />
              </div>
            </div>

            {/* item 1 — Dentes sensíveis com duas opções */}
            <div className="flex flex-col border-t border-outline-variant pt-stack-sm">
              <CheckboxGroup
                label="Dentes sensíveis"
                options={['Ao frio', 'A doces']}
                values={a.dentesSensiveisOpcoes}
                onChange={(v) => setAnamnese({ dentesSensiveisOpcoes: v })}
              />
            </div>

            {/* Uso de anestésicos / drogas */}
            <div className="border-t border-outline-variant pt-stack-sm">
              <CheckboxGroup label="Uso de anestésicos / drogas" options={ANESTESICOS} values={a.anestesicos} onChange={(v) => setAnamnese({ anestesicos: v })} />
            </div>

            <TextArea label="Observações médicas relevantes" rows={4} value={a.observacoes} onChange={(v) => setAnamnese({ observacoes: v })} />
          </Card>
        )}

        {/* Exame Intra-oral */}
        {tab === 'exame' && (
          <Card className="flex flex-col gap-stack-md">
            <h2 className="font-headline-md text-headline-md text-secondary">Odontograma</h2>
            <Odontograma tipo="adulto" value={draft.odontograma} onChange={(o) => set({ odontograma: o })} />
            <h2 className="font-headline-md text-headline-md text-secondary border-t border-outline-variant pt-stack-md">Condições Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {/* item 5 — opções de higiene atualizadas */}
              <SelectField label="Higiene" value={e.higiene} onChange={(v) => setExame({ higiene: v })} options={['Normal', 'Regular', 'Deficiente']} />
              <SelectField label="Halitose" value={e.halitose} onChange={(v) => setExame({ halitose: v })} options={['Ausente', 'Moderada', 'Forte']} />
              <SelectField label="Tártaro" value={e.tartaro} onChange={(v) => setExame({ tartaro: v })} options={['Ausente', 'Pouco', 'Muito']} />
              <SelectField label="Gengiva" value={e.gengiva} onChange={(v) => setExame({ gengiva: v })} options={['Normal', 'Gengivite', 'Periodontite']} />
              <SelectField label="Mucosa" value={e.mucosa} onChange={(v) => setExame({ mucosa: v })} options={['Normal', 'Alterada']} />
              <TextField label="Língua" value={e.lingua} onChange={(v) => setExame({ lingua: v })} />
              <TextField label="Palato" value={e.palato} onChange={(v) => setExame({ palato: v })} />
              <TextField label="Assoalho bucal" value={e.assoalho} onChange={(v) => setExame({ assoalho: v })} />
              {/* item 6 — Lábios no lugar de Tecidos moles */}
              <TextField label="Lábios" value={e.labios} onChange={(v) => setExame({ labios: v })} />
            </div>
            {/* item 6 — campo separado para outras observações */}
            <TextArea label="Outras observações" rows={4} value={e.outrasObservacoes} onChange={(v) => setExame({ outrasObservacoes: v })} placeholder="Bochechas, freios, glândulas salivares, lesões…" />
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
