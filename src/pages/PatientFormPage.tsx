import { Navigate, useParams } from 'react-router-dom';
import { usePatients } from '../data/store';
import { AdultFormPage } from './AdultFormPage';
import { ChildFormPage } from './ChildFormPage';

// Decide qual ficha exibir a partir do tipo do paciente no "banco".
// Reativo: trocar o tipo (savePatient) faz este wrapper alternar a ficha.
export function PatientFormPage() {
  const { id } = useParams();
  const tipo = usePatients((s) => (id ? s.getPatient(id)?.tipo : undefined));

  if (!tipo) return <Navigate to="/pacientes" replace />;
  return tipo === 'crianca' ? <ChildFormPage /> : <AdultFormPage />;
}
