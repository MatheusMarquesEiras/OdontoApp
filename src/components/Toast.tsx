import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Icon } from './Icon';

// Banner de confirmação visível (design system: "Visual Confirmations").
// Feedback grande e claro após salvar / exportar / fazer backup.

type ToastKind = 'success' | 'info' | 'error';
interface ToastItem {
  id: number;
  message: string;
  kind: ToastKind;
}

interface ToastCtx {
  show: (message: string, kind?: ToastKind) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>');
  return ctx;
}

const styles: Record<ToastKind, { bg: string; icon: string }> = {
  success: { bg: 'bg-secondary-container text-on-secondary-container border-primary', icon: 'check_circle' },
  info: { bg: 'bg-surface-container-highest text-primary border-primary', icon: 'info' },
  error: { bg: 'bg-error-container text-on-error-container border-error', icon: 'error' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, message, kind }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={{ show }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-3 pointer-events-none">
        {items.map((t) => {
          const s = styles[t.kind];
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl shadow-xl border-2 animate-zoom-in ${s.bg}`}
            >
              <Icon name={s.icon} className="text-3xl" />
              <span className="font-headline-md text-headline-md">{t.message}</span>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}
