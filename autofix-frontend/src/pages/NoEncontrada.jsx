import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NoEncontrada() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-bg px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-accent/15 flex items-center justify-center text-accent mb-6">
        <Compass size={32} />
      </div>
      <h1 className="font-display text-6xl font-extrabold text-text-primary">404</h1>
      <p className="mt-2 text-text-secondary">La página que buscas no existe o fue movida.</p>
      <button onClick={() => navigate('/dashboard')} className="btn btn-primary mt-6">
        Volver al panel
      </button>
    </div>
  );
}