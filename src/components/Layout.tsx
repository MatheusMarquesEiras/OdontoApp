import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useAuth } from '../data/auth';

// Shell das telas internas: barra lateral fixa (sem menu escondido, §DESIGN)
// + barra superior. Rótulos sempre visíveis e botões grandes.

const navItems = [
  { to: '/pacientes', label: 'Pacientes', icon: 'groups' },
  { to: '/configuracoes', label: 'Backup e Segurança', icon: 'settings' },
];

function Sidebar() {
  const navigate = useNavigate();
  const bloquear = useAuth((s) => s.bloquear);

  return (
    <aside className="hidden md:flex h-screen w-80 sticky left-0 top-0 flex-col p-stack-sm gap-stack-xs bg-surface-container-low border-r border-outline-variant">
      <div className="flex items-center gap-3 px-4 py-8">
        <img src="/tooth.svg" alt="OdontoApp" className="w-12 h-12" />
        <div>
          <span className="text-headline-md font-headline-md font-bold text-primary block leading-tight">
            OdontoApp
          </span>
          <span className="text-sm text-on-surface-variant">Painel Clínico</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2 mt-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-4 p-4 rounded-xl font-label-lg text-label-lg transition-all ${
                isActive
                  ? 'bg-secondary-container text-on-secondary-container font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-highest'
              }`
            }
          >
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 p-2">
        <button
          onClick={() => navigate('/novo')}
          className="w-full flex items-center justify-center gap-2 bg-primary text-on-primary py-4 rounded-xl font-button-text text-button-text hover:opacity-90 transition-all active:scale-95"
        >
          <Icon name="person_add" />
          Novo Paciente
        </button>
        <button
          onClick={() => {
            bloquear();
            navigate('/');
          }}
          className="w-full flex items-center justify-center gap-2 text-on-surface-variant py-3 rounded-xl font-label-lg hover:bg-surface-container-highest transition-all"
        >
          <Icon name="lock" />
          Bloquear
        </button>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="md:hidden flex justify-between items-center w-full h-20 px-margin-safe bg-surface border-b border-outline-variant">
      <span className="text-headline-md font-headline-md font-bold text-primary">OdontoApp</span>
      <Icon name="account_circle" className="text-primary text-3xl" filled />
    </header>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 w-full max-w-max-width mx-auto px-margin-safe py-10">{children}</main>
      </div>
    </div>
  );
}
