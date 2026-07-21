import { useProfile } from '../data/profile';

// Marca do app: mostra a foto/logotipo enviado no Perfil ou, na ausência dele,
// o dente padrão. Usado no menu lateral, na barra superior e no login.
export function Logo({ className = '' }: { className?: string }) {
  const photo = useProfile((s) => s.photo);
  if (photo) {
    return (
      <img
        src={photo}
        alt="Logotipo da clínica"
        className={`object-cover rounded-2xl ${className}`}
      />
    );
  }
  return <img src="/tooth.svg" alt="OdontoApp" className={className} />;
}
