import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass } from 'lucide-react';

export default function NoEncontrada() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-workshop px-4 text-center">
      <div className="relative mb-6">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-2xl bg-accent/25 blur-2xl"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-glow text-accent ring-1 ring-accent/30">
          <Compass size={32} />
        </div>
      </div>
      <p className="texto-degradado font-display text-7xl font-extrabold">404</p>
      <p className="mt-3 text-text-secondary">
        La página que buscas no existe o fue movida.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Volver al panel
        </button>
        <button onClick={() => navigate(-1)} className="btn btn-ghost">
          <ArrowLeft size={15} /> Volver atrás
        </button>
      </div>
    </div>
  );
}
