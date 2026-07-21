import type { ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './data/auth';
import { ToastProvider } from './components/Toast';
import { UpdateChecker } from './components/UpdateChecker';
import { LoginPage } from './pages/LoginPage';
import { RecoveryKeyPage } from './pages/RecoveryKeyPage';
import { PatientsListPage } from './pages/PatientsListPage';
import { NewPatientTypePage } from './pages/NewPatientTypePage';
import { PatientFormPage } from './pages/PatientFormPage';
import { DeleteConfirmPage } from './pages/DeleteConfirmPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

// Rota protegida: exige o app desbloqueado (senha digitada nesta sessão).
function RequireAuth({ children }: { children: ReactNode }) {
  const desbloqueado = useAuth((s) => s.desbloqueado);
  return desbloqueado ? <>{children}</> : <Navigate to="/" replace />;
}

// Raiz: se já desbloqueado, vai direto para a lista.
function Root() {
  const desbloqueado = useAuth((s) => s.desbloqueado);
  return desbloqueado ? <Navigate to="/pacientes" replace /> : <LoginPage />;
}

export default function App() {
  return (
    <ToastProvider>
      {/* Verifica atualização ao abrir (só no app desktop) e pergunta se deseja instalar. */}
      <UpdateChecker />
      {/* HashRouter: funciona bem tanto no navegador quanto no webview do Tauri (file://). */}
      <HashRouter>
        <Routes>
          <Route path="/" element={<Root />} />
          <Route path="/chave-recuperacao" element={<RequireAuth><RecoveryKeyPage /></RequireAuth>} />
          <Route path="/pacientes" element={<RequireAuth><PatientsListPage /></RequireAuth>} />
          <Route path="/novo" element={<RequireAuth><NewPatientTypePage /></RequireAuth>} />
          <Route path="/paciente/:id" element={<RequireAuth><PatientFormPage /></RequireAuth>} />
          <Route path="/excluir/:id" element={<RequireAuth><DeleteConfirmPage /></RequireAuth>} />
          <Route path="/configuracoes" element={<RequireAuth><SettingsPage /></RequireAuth>} />
          <Route path="/perfil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}
