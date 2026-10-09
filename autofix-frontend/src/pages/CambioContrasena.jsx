import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { KeyRound, AlertCircle, ArrowRight } from 'lucide-react';
import { cambiarContrasena } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { extraerMensajeError } from '../lib/utils';
import Spinner from '../components/Spinner';

export default function CambioContrasena() {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { usuario, cargando: cargandoAuth } = useAuth();
  const navigate = useNavigate();

  if (cargandoAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-bg text-text-secondary text-sm">
        Verificando sesión...
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Si no debe cambiar contraseña, redirigir al dashboard
  if (!usuario.debeCambiarContrasena) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (nueva !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      await cambiarContrasena({ contrasenaActual: actual, contrasenaNueva: nueva });
      navigate('/dashboard', { replace: true });
      window.location.reload();
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo cambiar la contraseña'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-base-bg shadow-lg shadow-accent-glow">
            <KeyRound size={22} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
              Cambio de contraseña
            </h1>
            <p className="text-xs text-text-secondary">Por seguridad, debes cambiar tu contraseña temporal</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 shadow-2xl shadow-black/30 space-y-4">
          <div>
            <label className="label">Contraseña actual (temporal)</label>
            <input
              type="password"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              className="input"
              required
              placeholder="La contraseña que recibiste"
            />
          </div>
          <div>
            <label className="label">Nueva contraseña</label>
            <input
              type="password"
              value={nueva}
              onChange={(e) => setNueva(e.target.value)}
              className="input"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label className="label">Confirmar nueva contraseña</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="input"
              required
              minLength={8}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full py-2.5" disabled={cargando}>
            {cargando ? (
              <>
                <Spinner size={16} /> Cambiando...
              </>
            ) : (
              <>
                Cambiar contraseña <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
