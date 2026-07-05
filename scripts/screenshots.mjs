// Gera as imagens da interface (README) dirigindo o app real no Chrome.
// Uso: node scripts/screenshots.mjs   (com o dev server rodando em :1420)
import puppeteer from 'puppeteer-core';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'docs', 'images');
mkdirSync(OUT, { recursive: true });

const CHROME =
  process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe';
const BASE = 'http://localhost:1420';
const W = 1280;
const H = 832;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  args: [`--window-size=${W},${H}`, '--hide-scrollbars', '--force-color-profile=srgb'],
});

const page = await browser.newPage();

async function shot(name) {
  await sleep(650); // deixa fontes/animações assentarem
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('✓', name);
}

async function gotoHash(hash) {
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
  await sleep(500);
}

// Estado limpo → fluxo de primeiro acesso
await page.goto(BASE, { waitUntil: 'networkidle0' });
await page.evaluate(() => localStorage.clear());
await page.goto(BASE, { waitUntil: 'networkidle0' });
await sleep(800);

// 01 — Primeiro acesso (criar senha)
await shot('01-primeiro-acesso');

// cria a senha (senha + confirmação) → tela da chave de recuperação
const pwFields = await page.$$('input[type="password"]');
for (const field of pwFields) await field.type('1234');
await page.click('button[type="submit"]');
await sleep(900);
await shot('02-chave-recuperacao');

// vai para a lista de pacientes (dados mock)
await gotoHash('#/pacientes');
await shot('03-lista-pacientes');

// seleção de tipo de novo paciente
await gotoHash('#/novo');
await shot('04-novo-paciente-tipo');

// ficha do adulto — aba Dados
await gotoHash('#/paciente/p-001');
await sleep(400);
await shot('05-ficha-adulto-dados');

// ficha do adulto — aba Anamnese
const clickTabByText = async (txt) => {
  await page.evaluate((t) => {
    const el = [...document.querySelectorAll('button')].find((b) =>
      b.textContent.trim().includes(t),
    );
    el?.click();
  }, txt);
  await sleep(500);
};
await clickTabByText('Anamnese');
await shot('06-ficha-adulto-anamnese');

// ficha do adulto — aba Exame Intra-oral (odontograma)
await clickTabByText('Exame Intra-oral');
await page.evaluate(() => window.scrollTo({ top: 0 }));
await shot('12-odontograma');

// ficha do adulto — aba Plano de Tratamento (tabela financeira)
await clickTabByText('Plano de Tratamento');
await page.evaluate(() => window.scrollTo({ top: 520 }));
await shot('07-ficha-adulto-plano');
await page.evaluate(() => window.scrollTo({ top: 0 }));

// ficha da criança (odontopediatria)
await gotoHash('#/paciente/p-002');
await sleep(400);
await shot('08-ficha-crianca');

// confirmação de exclusão (contagem de 5s)
await gotoHash('#/excluir/p-003');
await sleep(300);
await shot('09-excluir-confirmacao');

// backup e segurança
await gotoHash('#/configuracoes');
await shot('10-configuracoes');

// 11 — Tela de login (modo entrar), recarregando com a senha já definida
await page.goto(BASE, { waitUntil: 'networkidle0' });
await sleep(800);
await shot('11-login');

await browser.close();
console.log('Imagens geradas em', OUT);
