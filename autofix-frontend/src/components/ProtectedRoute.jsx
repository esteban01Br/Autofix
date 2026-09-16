import { Navigate, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children, roles }) {
  const { usuario, cargando } = useAuth();
  const navigate = useNavigate();

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-base-bg">
        <div className="text-accent">
          <Spinner size={36} />
        </div>
        <p className="text-sm text-text-secondary">Verificando sesión...</p>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-8 text-center animate-scale-in">
          <div className="w-14 h-14 mx-auto rounded-full bg-danger-glow flex items-center justify-center text-danger mb-4">
            <ShieldAlert size={26} />
          </div>
          <h2 className="font-display text-xl font-bold text-text-primary mb-2">
            Sin permisos
          </h2>
          <p className="text-sm text-text-secondary mb-2">
            Tu rol actual (<span className="font-mono text-accent">{usuario.rol}</span>) no
            permite acceder a este módulo.
          </p>
          <p className="text-xs text-text-secondary mb-6">
            Contacta al administrador si crees que necesitas este acceso.
          </p>
          <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
            <ArrowLeft size={16} /> Volver al panel
          </button>
        </div>
      </div>
    );
  }

  return children;
}