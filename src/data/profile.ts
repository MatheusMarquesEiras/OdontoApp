import { create } from 'zustand';
import { DEFAULT_THEME, applyTheme, clearTheme, type ThemeParams } from '../lib/theme';

// ─────────────────────────────────────────────────────────────
// Preferências do Perfil (Etapa final): logotipo da clínica, cores da
// interface e a espera de 5 s antes de excluir. São preferências de exibição,
// não dados clínicos — ficam no localStorage (persiste tanto no navegador
// quanto no webview do Tauri). Nada aqui é sensível/criptografado.
// ─────────────────────────────────────────────────────────────

const KEY = 'odontoapp-profile';

interface Persisted extends ThemeParams {
  photo: string | null; // data URL que substitui o dente no canto superior esquerdo
  themeCustom: boolean; // true = usuário escolheu cores próprias
  deleteDelay: boolean; // espera de 5 s antes de excluir um paciente
}

const DEFAULTS: Persisted = {
  photo: null,
  themeCustom: false,
  deleteDelay: true,
  ...DEFAULT_THEME,
};

function readStored(): Persisted {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Persisted>) };
  } catch {
    /* localStorage indisponível ou corrompido → usa padrões */
  }
  return { ...DEFAULTS };
}

function writeStored(s: Persisted) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sem persistência: segue só em memória */
  }
}

/** Reaplica (ou limpa) as variáveis CSS de tema conforme o estado. */
function syncTheme(s: Persisted) {
  if (s.themeCustom) applyTheme({ hue: s.hue, saturation: s.saturation, brightness: s.brightness });
  else clearTheme();
}

interface ProfileState extends Persisted {
  setPhoto: (dataUrl: string | null) => void;
  setTheme: (patch: Partial<ThemeParams>) => void;
  resetTheme: () => void;
  setDeleteDelay: (on: boolean) => void;
}

export const useProfile = create<ProfileState>()((set, get) => {
  const pick = (): Persisted => {
    const { photo, themeCustom, deleteDelay, hue, saturation, brightness } = get();
    return { photo, themeCustom, deleteDelay, hue, saturation, brightness };
  };
  const commit = () => {
    const s = pick();
    writeStored(s);
    syncTheme(s);
  };

  return {
    ...readStored(),
    setPhoto: (photo) => {
      set({ photo });
      commit();
    },
    setTheme: (patch) => {
      set({ ...patch, themeCustom: true });
      commit();
    },
    resetTheme: () => {
      set({ ...DEFAULT_THEME, themeCustom: false });
      commit();
    },
    setDeleteDelay: (deleteDelay) => {
      set({ deleteDelay });
      commit();
    },
  };
});

/** Aplica o tema salvo no arranque, antes da 1ª renderização (evita "flash"). */
export function initProfileTheme() {
  syncTheme(readStored());
}
