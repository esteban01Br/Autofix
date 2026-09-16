import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, Car, Package, Calendar, Receipt } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(correo, contrasena);
      navigate('/dashboard');
    } catch (err) {
      const detalle = err?.response?.data?.detail;
      setError(detalle || 'Correo o contraseña incorrectos');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-bg">
      {/* Panel de marca */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border bg-gradient-to-br from-surface via-base-bg to-base-bg">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20 blur-3xl bg-accent"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full opacity-10 blur-3xl bg-steel"
          aria-hidden
        />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-base-bg">
              <Wrench size={22} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-wide text-text-primary">
                AUTO<span className="text-accent">FIX</span>
              </h1>
              <p className="text-xs text-text-secondary">Sistema de gestión de taller</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="font-display text-5xl font-extrabold leading-tight text-text-primary">
            Taller mecánico
            <br />
            <span className="text-accent">bajo control total.</span>
          </h2>
          <p className="mt-4 text-text-secondary max-w-md">
            Gestiona clientes, vehículos, citas, órdenes de trabajo, repuestos y facturación
            desde un solo panel, con trazabilidad y stock en tiempo real.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: Car, texto: 'Vehículos y clientes' },
              { icon: Calendar, texto: 'Citas agendadas' },
              { icon: Wrench, texto: 'Órdenes de trabajo' },
              { icon: Receipt, texto: 'Facturas con IVA 19%' },
            ].map(({ icon: Icon, texto }) => (
              <div
                key={texto}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-surface/60 border border-border/60"
              >
                <Icon size={16} className="text-steel shrink-0" />
                <span className="text-sm text-text-primary">{texto}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-text-secondary">
          © {new Date().getFullYear()} AutoFix · Panel administrativo
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-base-bg">
              <Wrench size={20} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
              AUTO<span className="text-accent">FIX</span>
            </h1>
          </div>

          <div className="card p-8">
            <h2 className="font-display text-2xl font-bold text-text-primary">Iniciar sesión</h2>
            <p className="text-sm text-text-secondary mt-1 mb-6">
              Ingresa tus credenciales para acceder al panel.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label" htmlFor="correo">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  <input
                    id="correo"
                    type="email"
                    className="input pl-9"
                    placeholder="admin@autofix.com"
                    value={correo}
                    onChange={(e) => setCorreo(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="contrasena">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  <input
                    id="contrasena"
                    type={verContrasena ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(e) => setContrasena(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setVerContrasena((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                    aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {verContrasena ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary w-full py-2.5" disabled={cargando}>
                {cargando ? (
                  <>
                    <Spinner size={16} /> Ingresando...
                  </>
                ) : (
                  <>
                    Entrar <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 card p-4 flex items-start gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center text-success shrink-0 mt-0.5">
              <Package size={15} />
            </div>
            <div className="text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">Credenciales de acceso por defecto</p>
              <p className="font-mono">Correo: <span className="text-accent">admin@autofix.com</span></p>
              <p className="font-mono">Contraseña: <span className="text-accent">Admin123!</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}