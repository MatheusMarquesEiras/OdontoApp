// Modelo de dados do OdontoApp.
// Regra de negócio central (PLANEJAMENTO.md §4): TODOS os campos são opcionais.
// Por isso quase tudo aqui é `?`. O único campo técnico obrigatório é o `id`.

export type PatientType = 'adulto' | 'crianca';

export type SimNao = 'sim' | 'nao' | '';

/** Estados possíveis de um dente no odontograma (§7.3 / §8.11). */
export type ToothStatus = 'higido' | 'carie' | 'restaurado' | 'ausente' | 'coroa' | 'tratamento';

/** Mapa número FDI do dente → estado. Ausência de chave = hígido. */
export type Odontograma = Record<string, ToothStatus>;

/** Uma linha da tabela de tratamentos/financeiro (§9.2). */
export interface Treatment {
  id: string;
  data?: string;
  dente?: string;
  descricao?: string;
  debito?: number;
  credito?: number;
  // saldo é calculado, não armazenado
}

/** Plano de tratamento (§9.1) — comum aos dois tipos. */
export interface TreatmentPlan {
  descricao?: string;
  data?: string;
  autorizado?: SimNao;
  dataAutorizacao?: string;
}

/** Anamnese do adulto (§7.2). */
export interface AdultAnamnese {
  gengivasSangram?: SimNao;
  retencaoAlimentos?: SimNao;
  alergiaMedicamento?: SimNao;
  alergiaMedicamentoQual?: string;
  alergiaAlimento?: SimNao;
  alergiaAlimentoQual?: string;
  mordeLapis?: SimNao;
  roiUnhas?: SimNao;
  outrosVicios?: string;
  gravida?: SimNao;
  gravidaMes?: string;
  dentesSensiveis?: SimNao;           // mantido para compatibilidade com dados antigos
  dentesSensiveisOpcoes?: string[];   // ["Ao frio", "A doces"]
  sobTratamentoMedico?: SimNao;
  hipertensoDiabetico?: SimNao;
  problemaAnestesia?: SimNao;
  // Enfermidades
  temEnfermidades?: SimNao;
  enfermidades?: string[];
  outraEnfermidade?: string;
  // Anestésicos / drogas
  anestesicos?: string[];
  // Alergias conhecidas
  temAlergias?: SimNao;
  alergias?: string[];
  observacoes?: string;
}

/** Exame intra-oral do adulto (§7.3). */
export interface AdultExame {
  higiene?: string;
  halitose?: string;
  tartaro?: string;
  gengiva?: string;
  mucosa?: string;
  lingua?: string;
  palato?: string;
  assoalho?: string;
  labios?: string;
  tecidosMoles?: string;      // mantido para compatibilidade com dados antigos
  outrasObservacoes?: string;
}

/** Ficha infantil (§8) — anamnese, hábitos, higiene, histórico, etc. */
export interface ChildFicha {
  // §8.1 dados específicos
  nomePai?: string;
  nomeMae?: string;
  escola?: string;
  serie?: string;
  bairro?: string;
  indicacao?: string;
  // §8.2 motivo da consulta (checkboxes)
  motivos?: string[];
  // §8.3 gestação e parto
  tipoParto?: string;
  diabetesGestacional?: SimNao;
  hipertensaoGestacional?: SimNao;
  gravidezRisco?: SimNao;
  partoPrematuro?: SimNao;
  baixoPeso?: SimNao;
  aleitamento?: string;
  aleitamentoIdade?: string;
  // §8.4 hábitos
  usaMamadeira?: SimNao;
  mamadeiraIdade?: string;
  usaChupeta?: SimNao;
  chupetaIdade?: string;
  chupaDedos?: SimNao;
  roiUnhas?: SimNao;
  ronco?: SimNao;
  respiraBoca?: SimNao;
  bruxismo?: SimNao;
  outrosHabitos?: string;
  // §8.5 higiene bucal
  escovacoesDia?: string;
  tipoEscova?: string;
  marcaCreme?: string;
  cremeFluor?: string;
  fioDental?: SimNao;
  quemEscova?: string[];
  escovaAntesDormir?: string;
  // §8.6 saúde geral
  alergiasCrianca?: string;
  medicamentosContinuos?: string;
  fonoaudiologo?: SimNao;
  // §8.7 histórico odontológico
  jaConsultouDentista?: string;
  experienciaTraumatica?: SimNao;
  traumatismoDental?: string;
  // §8.8 alimentação
  consumoAcucar?: string;
  // §8.9 informações gerais
  preferencias?: string;
  autorizaFoto?: SimNao;
  // §8.10 termo de responsável
  nomeResponsavel?: string;
  rgResponsavel?: string;
  cpfResponsavel?: string;
  outrasInformacoes?: string;
  formaPagamento?: string;
}

/** Registro de paciente (tabela `pacientes` + relacionadas, achatadas). */
export interface Patient {
  id: string;
  tipo: PatientType;
  // Dados comuns
  nome?: string;
  dataNascimento?: string;
  localNascimento?: string;
  sexo?: string;
  estadoCivil?: string;
  profissao?: string;
  prontuario?: string;
  indicadoPor?: string;
  endereco?: string;
  enderecoComercial?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  celular?: string;
  telefoneComercial?: string;
  email?: string;
  inicioTratamento?: string;
  rg?: string;
  cpf?: string;
  // Fichas específicas
  anamnese?: AdultAnamnese;
  exame?: AdultExame;
  ficha?: ChildFicha;
  // Comuns
  plano?: TreatmentPlan;
  tratamentos?: Treatment[];
  odontograma?: Odontograma;
  // Metadados
  criadoEm: string;
  atualizadoEm: string;
}
