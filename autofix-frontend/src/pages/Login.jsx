import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import {
  Wrench,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Car,
  Package,
  Calendar,
  Receipt,
  AlertCircle,
  ShieldCheck,
  Users,
  Clock,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

const estadisticas = [
  { icon: Car, etiqueta: 'Vehículos gestionados', valor: '1.200+' },
  { icon: Users, etiqueta: 'Clientes registrados', valor: '850+' },
  { icon: Clock, etiqueta: 'Órdenes por mes', valor: '320' },
  { icon: CheckCircle2, etiqueta: 'Satisfacción', valor: '98%' },
];

const funcionalidades = [
  { icon: Car, texto: 'Vehículos y clientes' },
  { icon: Calendar, texto: 'Citas agendadas' },
  { icon: Wrench, texto: 'Órdenes de trabajo' },
  { icon: Receipt, texto: 'Facturas con IVA 19%' },
];

export default function Login() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const [recordarme, setRecordarme] = useState(true);
  const { usuario, login } = useAuth();
  const navigate = useNavigate();

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  const manejarError = (err) => {
    if (!err?.response) {
      setError(
        'No se pudo conectar con el servidor. ' +
          'Confirma que el backend esté ejecutándose.'
      );
      return;
    }

    const detalle = err.response.data?.detail;
    if (detalle && typeof detalle === 'string') {
      if (detalle.includes('No se pudo conectar') || detalle.includes('backend')) {
        setError(detalle);
        return;
      }
      setError(`${detalle} Inténtalo con: admin@autofix.com / Admin123!`);
    } else {
      setError('Correo o contraseña incorrectos. Inténtalo con: admin@autofix.com / Admin123!');
    }
  };

  const rellenarCredenciales = () => {
    setCorreo('admin@autofix.com');
    setContrasena('Admin123!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!correo.trim() || !contrasena.trim()) {
      setError('Ingresa tu correo y tu contraseña para continuar.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setError('El correo electrónico no tiene un formato válido.');
      return;
    }

    setCargando(true);
    try {
      await login(correo.trim(), contrasena);
      navigate('/dashboard');
    } catch (err) {
      manejarError(err);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-base-bg">
      {/* Panel de marca */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden border-r border-border bg-workshop">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-25 blur-3xl bg-accent"
          aria-hidden
        />
        <div
          className="absolute -bottom-40 -left-24 w-96 h-96 rounded-full opacity-15 blur-3xl bg-steel"
          aria-hidden
        />
        <div
          className="absolute top-1/4 -left-16 w-64 h-64 rounded-full opacity-10 blur-3xl bg-danger"
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-base-bg shadow-lg shadow-accent-glow">
              <Wrench size={22} />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold tracking-wide text-text-primary">
                AUTO<span className="text-accent">FIX</span>
              </h1>
              <p className="text-xs text-text-secondary">Sistema de gestión de taller</p>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/25 text-xs font-semibold text-success animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse-subtle" />
            Sistema operativo
          </span>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="font-display text-5xl font-extrabold leading-tight text-text-primary">
            Tu taller mecánico,
            <br />
            <span className="text-accent">bajo control total.</span>
          </h2>
          <p className="mt-5 text-text-secondary leading-relaxed">
            Gestiona clientes, vehículos, citas, órdenes de trabajo, repuestos y
            facturación desde un solo panel, con trazabilidad completa y stock en
            tiempo real.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {funcionalidades.map(({ icon: Icon, texto }) => (
              <div
                key={texto}
                className="flex items-center gap-2.5 py-2.5 px-3 rounded-lg bg-surface/70 border border-border/70 backdrop-blur-sm"
              >
                <span className="w-7 h-7 rounded-md bg-accent-glow flex items-center justify-center text-accent shrink-0">
                  <Icon size={14} />
                </span>
                <span className="text-sm text-text-primary">{texto}</span>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-4 gap-3">
            {estadisticas.map(({ icon: Icon, etiqueta, valor }) => (
              <div key={etiqueta} className="text-center">
                <div className="mx-auto w-9 h-9 rounded-lg bg-steel/15 border border-steel/20 flex items-center justify-center text-steel">
                  <Icon size={16} />
                </div>
                <p className="font-display text-2xl font-bold text-text-primary mt-2">{valor}</p>
                <p className="text-[11px] text-text-secondary leading-tight">{etiqueta}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-text-secondary">
          © {new Date().getFullYear()} AutoFix · Panel administrativo del taller
        </p>
      </div>

      {/* Panel de formulario */}
      <div className="flex items-center justify-center p-6 bg-base-bg">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-base-bg">
              <Wrench size={20} />
            </div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
              AUTO<span className="text-accent">FIX</span>
            </h1>
          </div>

          <div className="card p-8 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-2 mb-1 text-accent">
              <ShieldCheck size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Acceso restringido</span>
            </div>
            <h2 className="font-display text-2xl font-bold text-text-primary">Iniciar sesión</h2>
            <p className="text-sm text-text-secondary mt-1 mb-6">
              Ingresa tus credenciales para acceder al panel del taller.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                    onChange={(e) => { setCorreo(e.target.value); if (error) setError(''); }}
                    autoComplete="email"
                    aria-invalid={!!error}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="label" htmlFor="contrasena">Contraseña</label>
                  <button
                    type="button"
                    className="text-xs text-steel hover:text-accent transition-colors"
                    onClick={() =>
                      setError('Recuerda que tu contraseña por defecto es: Admin123!')
                    }
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
                  <input
                    id="contrasena"
                    type={verContrasena ? 'text' : 'password'}
                    className="input pl-9 pr-10"
                    placeholder="••••••••"
                    value={contrasena}
                    onChange={(e) => { setContrasena(e.target.value); if (error) setError(''); }}
                    autoComplete="current-password"
                    aria-invalid={!!error}
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
                <div
                  role="alert"
                  className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in"
                >
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <label className="flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(e) => setRecordarme(e.target.checked)}
                  className="w-4 h-4 rounded border-border bg-base-bg accent-accent cursor-pointer"
                />
                <span className="text-sm text-text-secondary">Recordarme en este equipo</span>
              </label>

              <button
                type="button"
                onClick={rellenarCredenciales}
                className="btn btn-ghost w-full py-2"
              >
                <KeyRound size={16} /> Rellenar credenciales de prueba
              </button>

              <button type="submit" className="btn btn-primary w-full py-2.5" disabled={cargando}>
                {cargando ? (
                  <>
                    <Spinner size={16} /> Verificando credenciales...
                  </>
                ) : (
                  <>
                    Entrar al panel <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 card p-4 flex items-start gap-3 animate-fade-in shadow-xl shadow-black/20">
            <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center text-success shrink-0 mt-0.5">
              <Package size={15} />
            </div>
            <div className="text-xs text-text-secondary">
              <p className="font-semibold text-text-primary mb-1">Credenciales de acceso por defecto</p>
              <p className="font-mono">Correo: <span className="text-accent">admin@autofix.com</span></p>
              <p className="font-mono">Contraseña: <span className="text-accent">Admin123!</span></p>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-text-secondary">
            ¿Tienes un taller?{' '}
            <Link to="/registro-empresa" className="font-semibold text-accent hover:text-accent-hover transition-colors">
              Registra tu empresa gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}