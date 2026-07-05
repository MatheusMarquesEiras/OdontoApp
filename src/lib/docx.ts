import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
} from 'docx';
import type { Patient, Treatment } from '../data/types';
import { formatDate, formatMoney, computeBalances, patientLabel } from './format';

// Exportação DOCX (PLANEJAMENTO.md §9.5 / Etapas 7 e 9).
// Gera uma "ficha" em layout parecido com o papel. A tia pode abrir no
// Word e salvar/imprimir como PDF se quiser.

const PURPLE = '70008B';

function heading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, color: PURPLE })],
  });
}

function field(label: string, value?: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    children: [
      new TextRun({ text: `${label}: `, bold: true, size: 22 }),
      new TextRun({ text: value && value.trim() ? value : '—', size: 22 }),
    ],
  });
}

function treatmentsTable(tratamentos: Treatment[]): Table {
  const balances = computeBalances(tratamentos);
  const header = ['Data', 'Dente', 'Tratamento', 'Débito', 'Crédito', 'Saldo'];

  const headerRow = new TableRow({
    tableHeader: true,
    children: header.map(
      (h) =>
        new TableCell({
          shading: { fill: 'F2E4F4' },
          children: [
            new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: PURPLE })] }),
          ],
        }),
    ),
  });

  const bodyRows = tratamentos.length
    ? tratamentos.map(
        (t, i) =>
          new TableRow({
            children: [
              formatDate(t.data),
              t.dente ?? '—',
              t.descricao ?? '—',
              formatMoney(t.debito),
              formatMoney(t.credito),
              formatMoney(balances[i]),
            ].map(
              (c) =>
                new TableCell({
                  children: [new Paragraph({ children: [new TextRun({ text: String(c), size: 20 })] })],
                }),
            ),
          }),
      )
    : [
        new TableRow({
          children: [
            new TableCell({
              columnSpan: 6,
              children: [new Paragraph({ children: [new TextRun({ text: 'Nenhum tratamento lançado.', italics: true, size: 20 })] })],
            }),
          ],
        }),
      ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'D3C1D2' },
    },
    rows: [headerRow, ...bodyRows],
  });
}

function buildAdult(p: Patient): Paragraph[] {
  const a = p.anamnese ?? {};
  const e = p.exame ?? {};
  const sn = (v?: string) => (v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : '—');
  return [
    heading('Dados Pessoais'),
    field('Nome', p.nome),
    field('Nascimento', p.dataNascimento ? formatDate(p.dataNascimento) : ''),
    field('CPF', p.cpf),
    field('RG', p.rg),
    field('Profissão', p.profissao),
    field('Telefone', p.telefone ?? p.celular),
    field('E-mail', p.email),
    field('Endereço', p.endereco),
    field('Cidade/UF', [p.cidade, p.uf].filter(Boolean).join(' / ')),
    heading('Anamnese'),
    field('Sob tratamento médico', sn(a.sobTratamentoMedico)),
    field('Hipertenso / Diabético', sn(a.hipertensoDiabetico)),
    field('Problema com anestesia', sn(a.problemaAnestesia)),
    field('Alergia a medicamento', a.alergiaMedicamento === 'sim' ? `Sim — ${a.alergiaMedicamentoQual ?? ''}` : sn(a.alergiaMedicamento)),
    field('Enfermidades', (a.enfermidades ?? []).join(', ')),
    field('Alergias', (a.alergias ?? []).join(', ')),
    field('Observações', a.observacoes),
    heading('Exame Intra-oral'),
    field('Higiene', e.higiene),
    field('Halitose', e.halitose),
    field('Tártaro', e.tartaro),
    field('Gengiva', e.gengiva),
    field('Tecidos moles', e.tecidosMoles ?? e.mucosa),
  ];
}

function buildChild(p: Patient): Paragraph[] {
  const f = p.ficha ?? {};
  const sn = (v?: string) => (v === 'sim' ? 'Sim' : v === 'nao' ? 'Não' : '—');
  return [
    heading('Identificação da Criança'),
    field('Nome', p.nome),
    field('Nascimento', p.dataNascimento ? formatDate(p.dataNascimento) : ''),
    field('Escola / Série', [f.escola, f.serie].filter(Boolean).join(' — ')),
    field('Nome do Pai', f.nomePai),
    field('Nome da Mãe', f.nomeMae),
    field('Telefone', p.telefone),
    field('Motivo da consulta', (f.motivos ?? []).join(', ')),
    heading('Saúde e Hábitos'),
    field('Alergias', f.alergiasCrianca),
    field('Medicamentos contínuos', f.medicamentosContinuos),
    field('Usa mamadeira', sn(f.usaMamadeira)),
    field('Usa chupeta', sn(f.usaChupeta)),
    field('Rói unhas', sn(f.roiUnhas)),
    field('Respira pela boca', sn(f.respiraBoca)),
    heading('Higiene e Dieta'),
    field('Escovações por dia', f.escovacoesDia),
    field('Creme dental (flúor)', f.cremeFluor ?? f.marcaCreme),
    field('Quem escova', (f.quemEscova ?? []).join(', ')),
    field('Consumo de açúcar', f.consumoAcucar),
    heading('Histórico Odontológico'),
    field('Já consultou dentista', f.jaConsultouDentista),
    field('Experiência traumática', sn(f.experienciaTraumatica)),
    field('Traumatismo dental', f.traumatismoDental),
    field('Autoriza foto (rede social)', sn(f.autorizaFoto)),
    heading('Termo de Responsável'),
    field('Responsável', f.nomeResponsavel),
    field('RG / CPF', [f.rgResponsavel, f.cpfResponsavel].filter(Boolean).join(' / ')),
    field('Outras informações', f.outrasInformacoes),
  ];
}

/** Monta o documento DOCX e dispara o download no navegador/webview. */
export async function exportPatientDocx(p: Patient): Promise<void> {
  const titulo = new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'OdontoApp — Ficha do Paciente', bold: true, size: 36, color: PURPLE })],
  });
  const subtitulo = new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 240 },
    children: [
      new TextRun({ text: `${p.nome ?? 'Sem nome'} · ${patientLabel(p.tipo)}`, size: 24, color: '504251' }),
    ],
  });

  const corpo = p.tipo === 'adulto' ? buildAdult(p) : buildChild(p);

  const doc = new Document({
    creator: 'OdontoApp',
    title: `Ficha - ${p.nome ?? p.id}`,
    sections: [
      {
        children: [
          titulo,
          subtitulo,
          ...corpo,
          heading('Plano de Tratamento'),
          field('Descrição', p.plano?.descricao),
          field('Data', p.plano?.data ? formatDate(p.plano.data) : ''),
          heading('Tratamentos Realizados / Financeiro'),
          treatmentsTable(p.tratamentos ?? []),
          new Paragraph({
            spacing: { before: 480 },
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `Documento gerado pelo OdontoApp em ${new Date().toLocaleDateString('pt-BR')}.`,
                italics: true,
                size: 18,
                color: '827282',
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safe = (p.nome ?? 'paciente').normalize('NFD').replace(/[^\w]+/g, '_');
  a.download = `ficha_${safe}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
