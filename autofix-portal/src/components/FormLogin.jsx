import { useState } from 'react';
import { ArrowRight, Loader2, Lock, Mail } from 'lucide-react';
import { login } from '../services/authService';
import { entrarALaApp, mensajeError } from '../lib/app';

/**
 * Formulario de login compartido por /login (genérico) y
 * /acceso/{slug} (página privada de una empresa, con `slug`).
 */
export default function FormLogin({ slug }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !contrasena) {
      setError('Ingresa tu correo y tu contraseña para continuar.');
      return;
    }
    setCargando(true);
    try {
      const datos = await login(correo.trim(), contrasena, slug);
      // La app recibe la sesión vía /?token= y aterriza en su panel.
      entrarALaApp(datos.token, datos.debeCambiarContrasena ? '/cambiar-contrasena' : '/dashboard');
    } catch (err) {
      setError(mensajeError(err, 'No se pudo iniciar sesión. Verifica tus datos.'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={enviar} className="space-y-4 animate-fade-in">
      <div>
        <label className="label" htmlFor="correo">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            id="correo"
            type="email"
            className="input pl-9"
            placeholder="tucorreo@taller.com"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="contrasena">
          Contraseña
        </label>
        <div className="relative">
          <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            id="contrasena"
            type="password"
            className="input pl-9"
            placeholder="••••••••"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-md bg-danger-glow border border-danger/30 text-sm text-danger animate-fade-in"
        >
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary w-full btn-lg" disabled={cargando}>
        {cargando ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Verificando...
          </>
        ) : (
          <>
            Iniciar sesión <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-xs text-text-secondary text-center">
        ¿Olvidaste tu contraseña? Contacta al administrador de tu taller.
      </p>
    </form>
  );
}
