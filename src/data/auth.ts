import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────
// Segurança MOCK (PLANEJAMENTO.md §3). Em produção, a senha e a
// chave de recuperação "embrulham" a chave-mestra do SQLCipher no
// Rust. Aqui apenas simulamos o fluxo de UX: primeiro uso, criação
// de senha, geração e exibição obrigatória da chave de recuperação.
// A senha guardada aqui é apenas ilustrativa — não é criptografia real.
// ─────────────────────────────────────────────────────────────

function gerarChaveRecuperacao(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem caracteres ambíguos
  const grupo = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return Array.from({ length: 5 }, grupo).join('-');
}

interface AuthState {
  senha: string | null;
  chaveRecuperacao: string | null;
  desbloqueado: boolean;
  definirSenha: (senha: string) => string; // retorna a chave de recuperação gerada
  entrar: (senha: string) => boolean;
  recuperarComChave: (chave: string, novaSenha: string) => boolean;
  bloquear: () => void;
  resetarTudo: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      senha: null,
      chaveRecuperacao: null,
      desbloqueado: false,
      definirSenha: (senha) => {
        const chave = gerarChaveRecuperacao();
        set({ senha, chaveRecuperacao: chave, desbloqueado: true });
        return chave;
      },
      entrar: (senha) => {
        if (get().senha === senha) {
          set({ desbloqueado: true });
          return true;
        }
        return false;
      },
      recuperarComChave: (chave, novaSenha) => {
        const norm = (s: string) => s.trim().toUpperCase().replace(/\s+/g, '');
        if (get().chaveRecuperacao && norm(chave) === norm(get().chaveRecuperacao!)) {
          set({ senha: novaSenha, desbloqueado: true });
          return true;
        }
        return false;
      },
      bloquear: () => set({ desbloqueado: false }),
      resetarTudo: () => set({ senha: null, chaveRecuperacao: null, desbloqueado: false }),
    }),
    {
      name: 'odontoapp-auth',
      // `desbloqueado` não é persistido: o app sempre reabre pedindo a senha.
      partialize: (s) => ({ senha: s.senha, chaveRecuperacao: s.chaveRecuperacao }),
    },
  ),
);
