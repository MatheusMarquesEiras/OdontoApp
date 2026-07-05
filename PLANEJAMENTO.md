# Sistema de Registro de Pacientes — Clínica Odontológica

**Documento de Planejamento — v3 (Adultos + Crianças)**

> Este documento agora cobre as **duas** fichas: pacientes adultos (clínico geral) e pacientes infantis (odontopediatria). Um único sistema, com um seletor de **tipo de paciente** que mostra os campos certos para cada caso.

**Decisões confirmadas:**
1. ✅ Camada em Rust para criptografia forte.
2. ✅ Solução elegante: ORM (Drizzle) modela/migra, Rust executa.
3. ✅ Senha ao abrir (**pode ser simples**) + **chave de recuperação** como plano B.
4. ✅ **Todos os campos são opcionais** (revisto em versão futura).
5. ✅ Alvo **Windows 10 e 11**, arquitetura **64 bits** confirmada.
6. ✅ **Dois tipos de paciente: Adulto e Criança**, selecionáveis no cadastro.
7. ✅ **Backup automático (ao fechar) + botão manual** de backup.
8. ✅ Exportação: **apenas DOCX** por enquanto (ela converte para PDF se quiser).
9. ✅ Tratamentos: **adicionar e editar** linhas.
10. ✅ Excluir paciente: **contagem de 5 segundos + tela de confirmação**.
11. ✅ Nome do app: **OdontoApp** (genérico, serve de portfólio).

---

## 1. Visão geral do projeto

Um sistema desktop **pequeno, local e offline** para a tia registrar pacientes da clínica odontológica, substituindo as fichas de papel. Atende **adultos** (ficha de clínico geral) e **crianças** (ficha de odontopediatria).

**Princípios que guiam o projeto:**

- **Simplicidade acima de tudo** — usuária de idade relativa; interface intuitiva, botões grandes, textos legíveis, fluxo óbvio.
- **Local e privado** — dados no computador dela (SQLite), sem nuvem.
- **Seguro** — banco criptografado (dados de saúde sensíveis).
- **Sem obrigatoriedade** — nenhum campo é obrigatório.
- **Adulto ou criança** — ao cadastrar, ela escolhe o tipo e o sistema mostra os campos adequados.
- **Exportável** — gera DOCX ou PDF por paciente.
- **Pesquisável** — filtra/localiza pacientes.

---

## 2. Stack tecnológica

| Camada | Tecnologia | Motivo |
|---|---|---|
| Shell desktop | **Tauri** | Instalador leve, seguro, multiplataforma |
| Frontend | **React + Vite** | UI reativa, build rápido |
| Linguagem | **JavaScript/TypeScript** | Lógica de negócio e UI |
| Camada segura | **Rust** (fina) | Abre o banco criptografado, expõe comandos ao JS |
| Banco de dados | **SQLite** (local) | Simples, um arquivo, sem servidor |
| Criptografia | **SQLCipher** via `rusqlite` (`bundled-sqlcipher`) | Criptografa o arquivo inteiro |
| ORM | **Drizzle ORM** | Modela o schema e gera migrations (SQL) |
| Documento | **docx** (DOCX) → imprimir/salvar como PDF | Exporta ficha do paciente |
| Versão | **Git** | Uma tag/commit por etapa |

### Arquitetura

```
┌─────────────────────────────────────────────┐
│  React + Vite  (UI, formulários, busca)     │
│        ↕  Tauri commands (invoke)           │
│  Rust (fina camada)                         │
│    • abre o SQLite com SQLCipher (senha)    │
│    • executa as queries                     │
│    • roda as migrations geradas pelo Drizzle│
│        ↕                                     │
│  SQLite criptografado (arquivo .db)         │
└─────────────────────────────────────────────┘
```

**Papel do Drizzle:** define o schema em TypeScript e **gera as migrations em SQL puro**, embutidas no app e **executadas pela camada Rust** sobre o banco criptografado. Schema type-safe no JS/TS, execução segura no Rust.

---

## 3. Segurança: senha + chave de recuperação

O banco inteiro é cifrado; a **senha é a chave**. Por isso o plano B é uma **chave de recuperação** (não uma "pergunta secreta" fraca).

**Senha:** pode ser **simples** — ela que escolhe. Não forçamos regras complexas (maiúscula, símbolo etc.), porque frustram e são difíceis de lembrar. A chave de recuperação impressa/salva é a rede de segurança real.

**Fluxo da tela da chave de recuperação (primeiro uso):**

1. Ela cria a senha (simples ou não).
2. O app **gera uma chave de recuperação** longa e aleatória (ex.: `A1B2-C3D4-E5F6-G7H8-J9K0`).
3. Abre uma **tela dedicada** que mostra a chave em fonte grande, com um botão **"Copiar chave"**.
4. Ao **copiar**, aparece um **aviso** explicando que ela deve colar num arquivo `.txt` e guardar em lugar seguro (pendrive, HD externo, ou onde preferir — o sistema não decide por ela). Também há um botão **"Salvar em arquivo .txt"** para facilitar.
5. Esse aviso tem um **"OK"** que a pessoa clica para confirmar que leu — **mas isso não fecha a tela**. Ela continua vendo a chave.
6. A tela **só fecha quando ela clicar no "X"** dela, garantindo que a chave não desapareça antes de ela guardar com calma.

> Objetivo do fluxo: impossível "passar batido" pela chave. Ela vê, copia, é avisada, confirma que leu, e ainda assim a chave continua visível até ela decidir sair.

**Como os dois caminhos abrem o banco:** o banco é cifrado com uma chave-mestra aleatória, guardada "embrulhada" duas vezes — uma pela senha, outra pela chave de recuperação. Trocar a senha só re-embrulha a cópia da senha; não recriptografa o banco. Ambos são fortes.

**Aviso honesto (na interface):** perder senha **e** chave de recuperação = dados irrecuperáveis, por design.

---

## 4. Campos opcionais

**Todos os campos são opcionais.** Sem `NOT NULL` (exceto o `id` técnico interno), sem bloqueio no "Salvar", sem erro de "campo obrigatório". Validação apenas **suave e não bloqueante** (aviso discreto para CPF/e-mail estranhos, mas deixa salvar). Revisável no futuro.

---

## 5. Compatibilidade Windows 10 e 11

Compilar no 11 e rodar no 10 é tranquilo. Cuidados:

- Tauri v2 suporta Windows 10 e 11 oficialmente.
- **WebView2:** pode faltar no Win 10 → usar `webviewInstallMode` que baixa/embute automaticamente.
- Build em `x86_64-pc-windows-msvc` (64 bits). Confirmar que o PC dela é 64 bits.
- Instalador `.msi` ou `.exe` (NSIS).
- Testar em Windows 10 limpo na Etapa 9.

---

## 6. Tipo de paciente: Adulto ou Criança (item 6)

O sistema tem **um campo "Tipo de paciente"** escolhido logo no início do cadastro:

- **Adulto** → mostra a ficha de clínico geral (seção 7).
- **Criança** → mostra a ficha de odontopediatria (seção 8).

**Como isso funciona no banco:** a tabela `pacientes` guarda dados comuns aos dois (nome, nascimento, contato, endereço) + uma coluna `tipo` ('adulto' ou 'crianca'). Os campos específicos ficam em tabelas separadas ligadas ao paciente:

- Adulto: `anamnese_adulto`, `exame_intraoral`.
- Criança: `anamnese_infantil`, `historico_gestacional`, `habitos_infantis`, `higiene_bucal`, `responsavel`.
- Comuns aos dois: `plano_tratamento`, `tratamentos`, `odontograma`.

Assim a interface mostra só o que interessa, e o banco fica organizado sem campos "sobrando".

---

## 7. Modelo de dados — ADULTO (ficha de clínico geral)

### 7.1. Dados pessoais (`pacientes`, tipo = adulto)

Nome, Data de nascimento, Local de nascimento, Sexo, Estado civil, Profissão, Nº (prontuário), Indicado por, Endereço residencial, Endereço comercial, Cidade, UF, CEP, Telefone, Celular, Telefone comercial, E-mail, Início do tratamento, RG, CPF.

### 7.2. Anamnese adulto (`anamnese_adulto`)

Gengivas sangram?; Retenção de alimentos?; Reação alérgica a medicamento (qual); Reação alérgica a alimento (qual); Morde lápis/caneta?; Rói unhas?; Está grávida? (mês); Dentes sensíveis (frio/doces); Outros vícios.
**Enfermidades:** Diabetes, Tuberculose, Artrite, Problemas cardíacos, Asma, Hipertensão, Problemas renais, Problemas hepáticos.
**Anestésicos/drogas:** Sedativos, Barbitúricos, Outra droga.
**Alergias:** Aspirina, Penicilina, Sulfas, Iodo.

### 7.3. Exame intra-oral (`exame_intraoral`)

Higiene (Normal/Regular/Deficiente); Halitose (Ausente/Moderada/Forte); Tártaro (Ausente/Pouco/Muito); Gengiva (Normal/Gengivite/Periodontite); Mucosa (Normal/Alterada); Língua; Palato; Assoalho bucal; Lábios.

---

## 8. Modelo de dados — CRIANÇA (odontopediatria)

### 8.1. Dados pessoais / cabeçalho (`pacientes`, tipo = crianca)

Data (do cadastro), Nome, Data de nascimento, RG, Endereço, Bairro, Telefone, Cidade, Nome do pai, Nome da mãe, E-mail, Indicação, Escola do paciente, Série.

### 8.2. Motivo da consulta (`anamnese_infantil` — motivo)

Marcáveis: 1ª vez, Rotina, Dor, Cárie, Encaminhamento Médico/Fono, Trauma (Queda/pancada), Mordida incorreta.

### 8.3. Histórico gestacional e parto (`historico_gestacional`)

- Gestação e parto: Normal / Cesárea / Fórceps.
- Teve: Diabetes gestacional / Hipertensão.
- Foi: Gravidez de risco / Parto prematuro / Baixo peso.
- Aleitamento: Materno / Artificial + até que idade.

### 8.4. Hábitos infantis (`habitos_infantis`)

Mamadeira (até que idade); Chupeta (até que idade); Dedos; Roer unhas (onicofagia); Ronco; Ranger/apertar dentes (bruxismo); Outros.

### 8.5. Higiene bucal (`higiene_bucal`)

Quantas escovações por dia; Tipo de escova (Macia/Dura, Grande-adulto/Pequena); Marca; Pasta com flúor? (Sim/Não + marca); Fio dental? (Sim/Não); Quem escova; Escova antes de dormir? (Sim/Não/Às vezes).

### 8.6. Saúde geral (`anamnese_infantil` — saúde)

Está sob cuidados médicos? (qual tratamento); Toma algum medicamento? (quais); Faz tratamento com fonoaudiólogo?; Precisou tomar antibiótico antes de 1 ano?; Já teve reação a medicamentos (antibiótico/outros)? (qual); Tem problema alérgico? (qual).

### 8.7. Histórico odontológico (`anamnese_infantil` — odonto)

Já caiu e bateu a boca? (há quanto tempo / como foi); Já fez tratamento odontológico?; Já tomou anestesia odontológica?; Tipos de tratamento feitos (Canal/Extração/Clareamento/Aparelho); Houve problema em tratamentos anteriores? (quais).

### 8.8. Alimentação (`anamnese_infantil` — alimentação)

Ingere muitos doces? + Frequência; Entrega do diário alimentar (sim/não).

### 8.9. Informações gerais (`anamnese_infantil` — gerais)

Programa/desenho/música/filme de preferência; Permite tirar foto para rede social da clínica (Instagram/Facebook)? (Sim/Não).

### 8.10. Termo de responsabilidade (`responsavel`)

Outras informações importantes (texto livre); Nome do responsável; RG; CPF; Declaração de veracidade; Cidade (Cambuí) + data; Assinatura do responsável (registrar como "assinado sim/não" + data).

### 8.11. Odontograma infantil

Arcada **decídua** (dentição de leite, numeração FDI 51–55, 61–65, 71–75, 81–85), além dos permanentes que já nasceram. O odontograma será um componente que mostra a dentição conforme o tipo de paciente.

---

## 9. Campos comuns aos dois tipos

### 9.1. Plano de tratamento (`plano_tratamento`)
Descrição (texto livre); Data; Autorização (sim/não + data).

### 9.2. Tratamentos realizados / financeiro (`tratamentos`)
Por linha: Data; Dente; Tratamento realizado; Débito; Crédito; Saldo (calculado). Ela pode **adicionar novas linhas e editar linhas existentes** (corrigir valores/descrições já lançados).

---

## 9.5. Comportamentos do sistema

**Backup (opção C — automático + manual):**
- **Automático:** ao **fechar** o app, ele copia o arquivo `.db` criptografado para uma pasta de backup (com data no nome, mantendo as últimas cópias para não encher o disco).
- **Manual:** um botão **"Fazer backup agora"** para quando ela quiser gerar uma cópia na hora (ex.: antes de levar num pendrive).
- Os backups continuam criptografados; sem senha/chave não abrem, o que é seguro.

**Excluir paciente:**
- Botão de excluir → abre uma **tela de confirmação** separada, com o nome do paciente bem visível.
- Nessa tela, o botão de confirmar fica **bloqueado por uma contagem de 5 segundos** (mostrando "Aguarde 5… 4… 3…"), evitando exclusão por impulso ou clique acidental.
- Só depois dos 5 segundos o botão "Excluir definitivamente" habilita.
- (Opcional futuro: em vez de apagar de vez, mover para uma "lixeira" recuperável. Fica anotado para depois.)

**Exportação (apenas DOCX):**
- Botão "Gerar Ficha" produz um arquivo **DOCX** com os dados do paciente, em layout parecido com a ficha de papel.
- Se ela quiser PDF, abre o DOCX no Word e salva/imprime como PDF (um clique). PDF nativo fica para uma versão futura, se ela pedir.

**Nome e identidade do app:**
- Nome: **OdontoApp** (genérico de propósito, para servir de portfólio).
- Ícone simples de dente/clínica na Etapa 11.

---

## 10. Etapas de implementação (com versionamento)

Cada etapa termina com commit + **tag Git**. A parte infantil entra depois da adulta estar sólida, reaproveitando a base.

### Etapa 0 — Fundação → `v0.1`
Tauri v2 + React + Vite; Git; alvo Windows + WebView2 embutido. **Entrega:** janela vazia abre.

### Etapa 1 — Camada segura + banco → `v0.2`
Rust + `rusqlite`/`bundled-sqlcipher`; schema Drizzle (todas as tabelas, tudo opcional) com coluna `tipo`; migrations executadas pelo Rust. **Entrega:** banco cifrado com CRUD básico.

### Etapa 2 — Senha + chave de recuperação → `v0.3`
Primeiro uso, abertura, redefinição via recovery key; chave-mestra embrulhada duas vezes. **Entrega:** acesso seguro completo.

### Etapa 3 — Seletor de tipo + dados pessoais → `v0.4`
Tela inicial de cadastro com escolha **Adulto/Criança**; campos comuns (nome, nascimento, contato, endereço), todos opcionais. **Entrega:** cadastrar paciente de qualquer tipo.

### Etapa 4 — Ficha ADULTO → `v0.5`
Anamnese adulto (7.2) + Exame intra-oral (7.3). **Entrega:** ficha adulta completa.

### Etapa 5 — Plano + tratamentos/financeiro → `v0.6`
Plano (9.1) e tabela de tratamentos com saldo automático (9.2) — servem aos dois tipos. **Adicionar e editar** linhas. **Entrega:** histórico e saldo funcionando, com edição.

### Etapa 6 — Busca, filtros e exclusão → `v0.7`
Lista + busca por nome, CPF/RG, telefone, cidade; filtro por tipo (adulto/criança). Exclusão de paciente com **tela de confirmação + contagem de 5 segundos**. **Entrega:** localizar e excluir pacientes com segurança.

### Etapa 7 — Exportação DOCX (adulto) → `v0.8`
Ficha adulta exportável em **DOCX**, layout parecido com o papel. **Entrega:** exportar ficha adulta.

### Etapa 8 — Ficha CRIANÇA → `v0.9`
Motivo da consulta (8.2); histórico gestacional (8.3); hábitos (8.4); higiene bucal (8.5); saúde (8.6); histórico odontológico (8.7); alimentação (8.8); informações gerais com autorização de foto (8.9); termo de responsável (8.10); odontograma decíduo (8.11). **Entrega:** ficha infantil completa.

### Etapa 9 — Exportação DOCX (criança) → `v0.10`
Ficha infantil exportável em **DOCX**, incluindo termo de responsável. **Entrega:** exportar ficha infantil.

### Etapa 10 — Backup + polimento da interface → `v0.11`
Backup automático ao fechar + botão "Fazer backup agora". Fontes maiores, contraste, botões grandes, confirmações; avisos de segurança; teste de usabilidade com a tia. **Entrega:** backup funcionando e interface aprovada.

### Etapa 11 — Empacotamento e instalação → `v1.0`
Instalador com WebView2 embutido; nome **OdontoApp** e ícone; teste em Windows 10 limpo (64 bits). **Entrega:** sistema instalado e em uso. 🎉

---

## 11. Prompt para a IA gerar a interface (Google Stitch)

> Cole o prompt abaixo. Ele já inclui a seleção Adulto/Criança e ambas as fichas.

```
Crie a interface de um aplicativo desktop chamado "OdontoApp", um sistema
simples de registro de pacientes para uma clínica odontológica que atende
ADULTOS e CRIANÇAS. A usuária principal é uma dentista de idade mais
avançada, então a interface DEVE ser
extremamente intuitiva, limpa e fácil: fontes grandes e legíveis, alto
contraste, botões grandes e bem espaçados, poucos elementos por tela, rótulos
claros em português do Brasil, e confirmações visíveis ao salvar. Evite menus
escondidos, ícones ambíguos e telas cheias.

IMPORTANTE: nenhum campo é obrigatório. O botão "Salvar" sempre funciona,
mesmo com campos vazios. Nunca bloqueie o salvamento nem mostre erro de
"campo obrigatório"; no máximo um aviso discreto e não bloqueante para
formatos estranhos (CPF, e-mail).

Estilo: minimalista, cores suaves (tons de lilás/roxo claro), muito espaço em
branco, cantos arredondados.

Telas necessárias:

1. TELA DE ABERTURA (login): campo grande de senha (a senha pode ser
   simples, não exija regras complexas), botão grande "Entrar", link discreto
   "Esqueci minha senha" (fluxo de chave de recuperação).

   No PRIMEIRO USO: uma tela cria a senha e, em seguida, abre uma TELA
   DEDICADA da CHAVE DE RECUPERAÇÃO com este comportamento específico:
   - Mostra a chave (ex.: A1B2-C3D4-E5F6-G7H8-J9K0) em fonte bem grande.
   - Botão "Copiar chave" e botão "Salvar em arquivo .txt".
   - Ao copiar, aparece um aviso explicando que ela deve colar num arquivo
     .txt e guardar em lugar seguro (pendrive, HD externo etc.).
   - O aviso tem um botão "OK" que ela clica para confirmar que leu, MAS
     clicar em OK NÃO fecha a tela: a chave continua visível.
   - A tela da chave SÓ fecha quando ela clicar no "X" do canto. Assim a
     chave nunca some antes de ela guardar com calma.

2. TELA INICIAL: lista de pacientes com barra de busca grande no topo (nome,
   CPF/RG ou telefone), um filtro simples "Todos / Adultos / Crianças", e
   botão grande "+ Novo Paciente". Cada paciente em um cartão com nome,
   telefone, uma etiqueta indicando "Adulto" ou "Criança", botão "Abrir" e
   um botão discreto "Excluir".

   EXCLUIR PACIENTE: abre uma tela de confirmação separada mostrando o nome
   do paciente em destaque. O botão "Excluir definitivamente" fica
   BLOQUEADO por uma contagem de 5 segundos (mostrando "Aguarde 5... 4...")
   e só habilita depois. Um botão "Cancelar" grande sempre disponível.

3. AO CRIAR NOVO PACIENTE: primeiro uma tela grande e clara perguntando
   "Este paciente é ADULTO ou CRIANÇA?" com dois botões grandes. A escolha
   define quais seções aparecem no formulário. Deixe visível e fácil trocar
   essa opção depois, caso ela erre.

4. FORMULÁRIO DE PACIENTE ADULTO, em abas/seções grandes (todos os campos
   opcionais):
   - Dados Pessoais: Nome, Data de nascimento, Local de nascimento, Sexo,
     Estado civil, Profissão, Nº, Indicado por, Endereço residencial,
     Endereço comercial, Cidade, UF, CEP, Telefone, Celular, Telefone
     comercial, E-mail, Início do tratamento, RG, CPF.
   - Anamnese: perguntas Sim/Não com botões grandes (gengivas sangram,
     retenção de alimentos, alergia a medicamento, alergia a alimento, morde
     lápis/caneta, rói unhas, está grávida com mês, dentes sensíveis ao
     frio/doces, outros vícios); caixas de enfermidades (Diabetes,
     Tuberculose, Artrite, Problemas cardíacos, Asma, Hipertensão, Problemas
     renais, Problemas hepáticos); anestésicos (Sedativos, Barbitúricos,
     Outra droga); alergias (Aspirina, Penicilina, Sulfas, Iodo).
   - Exame Intra-oral: Higiene (Normal/Regular/Deficiente), Halitose
     (Ausente/Moderada/Forte), Tártaro (Ausente/Pouco/Muito), Gengiva
     (Normal/Gengivite/Periodontite), Mucosa (Normal/Alterada), e campos de
     texto para Língua, Palato, Assoalho bucal, Lábios.

5. FORMULÁRIO DE PACIENTE CRIANÇA (ODONTOPEDIATRIA), em abas/seções grandes
   (todos os campos opcionais):
   - Dados: Data, Nome, Data de nascimento, RG, Endereço, Bairro, Telefone,
     Cidade, Nome do pai, Nome da mãe, E-mail, Indicação, Escola, Série.
   - Motivo da consulta (marcáveis): 1ª vez, Rotina, Dor, Cárie,
     Encaminhamento Médico/Fono, Trauma (queda/pancada), Mordida incorreta.
   - Gestação e Parto: tipo de parto (Normal/Cesárea/Fórceps); Diabetes
     gestacional; Hipertensão; Gravidez de risco; Parto prematuro; Baixo
     peso; Aleitamento (Materno/Artificial) e até que idade.
   - Hábitos: Mamadeira (até que idade), Chupeta (até que idade), Dedos,
     Roer unhas, Ronco, Ranger/apertar dentes (bruxismo), Outros.
   - Higiene Bucal: quantas escovações por dia; tipo de escova (Macia/Dura,
     Grande-adulto/Pequena); marca; pasta com flúor (Sim/Não + marca); fio
     dental (Sim/Não); quem escova; escova antes de dormir (Sim/Não/Às vezes).
   - Saúde: está sob cuidados médicos (qual tratamento); toma medicamento
     (quais); tratamento com fonoaudiólogo; antibiótico antes de 1 ano;
     reação a medicamentos (qual); problema alérgico (qual).
   - Histórico Odontológico: já bateu a boca (há quanto tempo/como foi); já
     fez tratamento odontológico; já tomou anestesia; tipos de tratamento
     (Canal/Extração/Clareamento/Aparelho); problemas anteriores (quais).
   - Alimentação: ingere muitos doces + frequência; entrega do diário
     alimentar.
   - Informações Gerais: programa/desenho/música/filme preferido; autoriza
     foto para rede social (Instagram/Facebook) Sim/Não.
   - Termo de Responsável: outras informações; nome do responsável, RG, CPF;
     texto de declaração de veracidade; cidade e data; espaço de assinatura.

6. Em cada tela de paciente (adulto ou criança): seção "Plano de Tratamento"
   (texto grande + data) e "Tratamentos Realizados" (tabela com colunas Data,
   Dente, Tratamento, Débito, Crédito, Saldo, com botão grande "Adicionar
   linha" e possibilidade de EDITAR linhas já lançadas). Botão grande "Gerar
   Ficha (DOCX)" e botão "Salvar" sempre visível e destacado.

Entregue como componentes React limpos. Priorize clareza e facilidade de uso
sobre sofisticação visual.
```

---

## 12. Próximos passos

Todas as decisões de planejamento estão fechadas. Nada mais bloqueia o início.

1. Gerar a interface no Google Stitch com o prompt da seção 11 (opcional, mas ajuda a visualizar).
2. Começar a **Etapa 0** (fundação: Tauri + React + Vite + Git).
3. Seguir etapa por etapa, com commit e tag Git a cada entrega.

> Lembrete para o futuro (fora do escopo desta v1): possível "lixeira" recuperável em vez de exclusão definitiva; exportação em PDF nativo; tornar alguns campos obrigatórios; e política de consentimento/LGPD para os dados de menores (autorização de foto e termo de responsável).
