import { create } from 'zustand';
import { backend } from './backend';
import { usePatients } from './store';

// ─────────────────────────────────────────────────────────────
// Segurança (PLANEJAMENTO.md §3). O fluxo (primeiro uso, login,
// recuperação) é o mesmo nos dois modos; a criptografia real acontece
// no backend Rust (chave-mestra embrulhada pela senha e pela chave de
// recuperação). Nada de senha em texto puro fica neste estado.
//
// `desbloqueado` nunca é persistido: o app sempre reabre pedindo a senha.
// `chaveRecuperacao` só existe em memória logo após criar/recuperar, para
// a tela dedicada exibi-la uma vez.
// ─────────────────────────────────────────────────────────────

interface AuthState {
  initialized: boolean | null; // null = ainda não verificado
  desbloqueado: boolean;
  chaveRecuperacao: string | null;
  refreshInit: () => Promise<void>;
  definirSenha: (senha: string) => Promise<string>;
  entrar: (senha: string) => Promise<boolean>;
  recuperarComChave: (chave: string, novaSenha: string) => Promise<boolean>;
  bloquear: () => void;
}

export const useAuth = create<AuthState>()((set) => ({
  initialized: null,
  desbloqueado: false,
  chaveRecuperacao: null,
  refreshInit: async () => set({ initialized: await backend.isInitialized() }),
  definirSenha: async (senha) => {
    const chave = await backend.setup(senha);
    await usePatients.getState().seedDemo();
    set({ chaveRecuperacao: chave, desbloqueado: true, initialized: true });
    return chave;
  },
  entrar: async (senha) => {
    const ok = await backend.unlock(senha);
    if (ok) {
      await usePatients.getState().load();
      set({ desbloqueado: true });
    }
    return ok;
  },
  recuperarComChave: async (chave, novaSenha) => {
    const ok = await backend.recover(chave, novaSenha);
    if (ok) {
      await usePatients.getState().load();
      set({ desbloqueado: true });
    }
    return ok;
  },
  bloquear: () => {
    void backend.lock();
    usePatients.getState().clear();
    set({ desbloqueado: false, chaveRecuperacao: null });
  },
}));
