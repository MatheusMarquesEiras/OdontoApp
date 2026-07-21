// Motor de temas (Perfil → Cores da interface).
//
// A paleta do design system é escrita no tailwind.config.js já apontando para
// variáveis CSS (var(--c-…, <valor padrão>)). Enquanto o usuário não personaliza
// nada, as variáveis não existem e o Tailwind usa os valores padrão — a aparência
// original (roxo) fica idêntica. Ao escolher uma cor, este módulo calcula toda a
// paleta a partir de um matiz (hue) + saturação + brilho e grava as variáveis no
// <html>, recolorindo o app inteiro sem recompilar.

export interface ThemeParams {
  /** Matiz na roleta de cores (0–360). */
  hue: number;
  /** Multiplicador de saturação em % (100 = base do design system). */
  saturation: number;
  /** Deslocamento de luminosidade nas cores de destaque (-12 … +15). */
  brightness: number;
}

export const DEFAULT_THEME: ThemeParams = { hue: 289, saturation: 100, brightness: 0 };

// Cada token do design system: [saturação base %, luminosidade base %, recebeBrilho].
// As cores de destaque (botões, títulos, selos) recebem o ajuste de brilho; as
// superfícies claras e as cores de texto ("on-*") mantêm a luminosidade fixa para
// preservar o contraste e a legibilidade em qualquer cor escolhida.
const TOKENS: Record<string, [number, number, boolean]> = {
  '--c-primary': [100, 27, true],
  '--c-primary-container': [64, 40, true],
  '--c-on-primary-container': [100, 87, false],
  '--c-secondary': [30, 42, true],
  '--c-secondary-container': [96, 85, false],
  '--c-on-secondary-container': [32, 38, false],
  '--c-surface-tint': [60, 43, true],
  '--c-inverse-primary': [100, 84, false],
  '--c-tertiary-container': [15, 38, true],
  '--c-on-tertiary-container': [45, 85, false],
  '--c-background': [100, 98.5, false],
  '--c-surface': [100, 98.5, false],
  '--c-surface-container-low': [100, 97, false],
  '--c-surface-container': [60, 95, false],
  '--c-surface-container-high': [55, 93, false],
  '--c-surface-container-highest': [40, 90, false],
  '--c-surface-variant': [40, 90, false],
};

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Calcula o mapa de variáveis CSS (nome → valor hsl) para os parâmetros dados. */
export function computeVars({ hue, saturation, brightness }: ThemeParams): Record<string, string> {
  const h = ((hue % 360) + 360) % 360;
  const out: Record<string, string> = {};
  for (const [name, [baseS, baseL, recebeBrilho]] of Object.entries(TOKENS)) {
    const s = clamp((baseS * saturation) / 100, 0, 100);
    const l = clamp(baseL + (recebeBrilho ? brightness : 0), 0, 100);
    out[name] = `hsl(${h.toFixed(0)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
  }
  return out;
}

/** Aplica um tema calculado às variáveis CSS do documento. */
export function applyTheme(params: ThemeParams): void {
  const root = document.documentElement;
  const vars = computeVars(params);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
}

/** Remove todas as variáveis de tema, voltando à paleta padrão do design system. */
export function clearTheme(): void {
  const root = document.documentElement;
  for (const k of Object.keys(TOKENS)) root.style.removeProperty(k);
}

// ── Conversões de cor (para a roleta nativa <input type="color">) ────────────
export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const m = hex.replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const mm = ln - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (v: number) =>
    Math.round((v + mm) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

/** Cor representativa do tema (para amostras/pré-visualização). */
export function themeSwatch({ hue, saturation, brightness }: ThemeParams): string {
  const s = clamp((100 * saturation) / 100, 0, 100);
  const l = clamp(27 + brightness, 0, 100);
  return hslToHex(((hue % 360) + 360) % 360, s, l);
}
