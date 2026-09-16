import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

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

  return children;
}