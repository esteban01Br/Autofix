import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CreditCard, Loader2, ShieldCheck } from 'lucide-react';
import { listarPlanes, registrarEmpresa } from '../services/authService';
import { mensajeError } from '../lib/app';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const estadoInicial = {
  nombre_empresa: '',
  nit: '',
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
};

const formatearCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

/** Checkout (compra simulada): registra la empresa con el plan elegido. */
export default function Comprar() {
  const { planId } = useParams();
  const navegar = useNavigate();
  const [planes, setPlanes] = useState([]);
  const [cargandoPlanes, setCargandoPlanes] = useState(true);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const plan =
    planes.find((p) => p.id.toLowerCase() === (planId || '').toLowerCase()) || null;

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch(() => setError('No se pudieron cargar los planes. Recarga la página.'))
      .finally(() => setCargandoPlanes(false));
  }, []);

  const cambiar = (e) =>
    setFormulario((f) => ({ ...f, [e.target.name]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    setError('');
    if (formulario.nombre_empresa.trim().length < 2) {
      setError('Ingresa el nombre de tu taller.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo.trim())) {
      setError('El correo electrónico no tiene un formato válido.');
      return;
    }
    if (formulario.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (!/[A-ZÑa-zñ]/.test(formulario.contrasena) && !/\d/.test(formulario.contrasena)) {
      setError('La contraseña debe contener al menos una mayúscula o un número.');
      return;
    }

    setEnviando(true);
    try {
      const datos = await registrarEmpresa({
        nombre_empresa: formulario.nombre_empresa.trim(),
        nit: formulario.nit.trim() || null,
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
        plan: plan.id, // BASICO | PRO | PREMIUM
      });
      // La pantalla de éxito muestra su URL de acceso y lo deja entrar.
      navegar('/exito', { state: { ...datos, planNombre: plan.nombre } });
    } catch (err) {
      setError(mensajeError(err, 'No se pudo completar el registro. Revisa los datos.'));
      setEnviando(false);
    }
  };

  if (cargandoPlanes) {
    return (
      <div className="min-h-screen flex flex-col bg-workshop">
        <Nav compacto />
        <main className="flex-1 flex items-center justify-center gap-3 text-text-secondary text-sm">
          <Loader2 size={20} className="animate-spin text-accent" /> Cargando planes…
        </main>
        <Footer />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen flex flex-col bg-workshop">
        <Nav compacto />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="card max-w-md w-full p-8 text-center">
            <h1 className="font-display text-2xl font-bold uppercase">Plan no encontrado</h1>
            <p className="text-sm text-text-secondary mt-3">
              El plan que intentas contratar no existe.
            </p>
            <Link to="/" className="btn btn-primary mt-6">
              Volver a los planes
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/#planes"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent transition-colors mb-6"
          >
            <ArrowLeft size={15} /> Cambiar de plan
          </Link>

          <ol className="mb-6 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
            {['Plan', 'Tu taller', 'Acceso'].map((paso, indice) => (
              <li key={paso} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                    indice === 0
                      ? 'bg-success/15 text-success'
                      : indice === 1
                        ? 'bg-accent text-base-bg'
                        : 'bg-surface-hover text-text-secondary'
                  }`}
                >
                  {indice === 0 ? <Check size={12} /> : indice + 1}
                </span>
                <span className={indice === 1 ? 'font-medium text-text-primary' : ''}>
                  {paso}
                </span>
                {indice < 2 && <span className="mx-1 h-px w-6 bg-border" aria-hidden="true" />}
              </li>
            ))}
          </ol>

          <div className="grid lg:grid-cols-5 gap-6">
            {/* Resumen del plan */}
            <aside className="lg:col-span-2">
              <div className="card p-6 sticky top-24 shadow-2xl shadow-black/30">
                <span className="badge bg-accent/10 text-accent">Plan elegido</span>
                <h2 className="font-display text-3xl font-bold uppercase mt-3">
                  {plan.nombre}
                </h2>
                <div className="mt-3 flex items-end gap-1">
                  <span className="font-display text-4xl font-extrabold text-accent">
                    {formatearCOP(plan.precioMensual)}
                  </span>
                  <span className="text-sm text-text-secondary mb-1">/mes</span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  {formatearCOP(plan.precioAnual)} al año · suscripción de 12 meses
                </p>

                <ul className="mt-5 space-y-2 text-sm">
                  {plan.caracteristicas.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check size={15} className="text-success mt-0.5 shrink-0" />
                      <span className="text-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 p-3 rounded-lg bg-info/10 border border-info/30 text-xs text-info flex gap-2">
                  <CreditCard size={15} className="shrink-0 mt-0.5" />
                  <span>
                    <strong>Compra simulada (demo):</strong> no se realiza ningún
                    cobro real. Al finalizar, tu suscripción queda activa 12 meses.
                  </span>
                </div>
              </div>
            </aside>

            {/* Registro */}
            <div className="lg:col-span-3">
              <div className="card p-6 sm:p-8 animate-slide-up">
                <h1 className="font-display text-3xl font-bold uppercase">
                  Crea tu taller
                </h1>
                <p className="text-sm text-text-secondary mt-1">
                  Estos datos crean tu empresa, tu página de acceso privada y tu
                  usuario administrador.
                </p>

                <form onSubmit={enviar} className="mt-6 space-y-4">
                  <div>
                    <label className="label" htmlFor="nombre_empresa">
                      Nombre del taller *
                    </label>
                    <input
                      id="nombre_empresa"
                      name="nombre_empresa"
                      className="input"
                      placeholder="Ej: Taller El Miguel"
                      value={formulario.nombre_empresa}
                      onChange={cambiar}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="nit">
                        NIT (opcional)
                      </label>
                      <input
                        id="nit"
                        name="nit"
                        className="input"
                        placeholder="900.123.456-7"
                        value={formulario.nit}
                        onChange={cambiar}
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="correo">
                        Correo del administrador *
                      </label>
                      <input
                        id="correo"
                        name="correo"
                        type="email"
                        className="input"
                        placeholder="dueno@taller.com"
                        value={formulario.correo}
                        onChange={cambiar}
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label" htmlFor="nombre">
                        Tu nombre *
                      </label>
                      <input
                        id="nombre"
                        name="nombre"
                        className="input"
                        placeholder="Miguel"
                        value={formulario.nombre}
                        onChange={cambiar}
                        autoComplete="given-name"
                        required
                      />
                    </div>
                    <div>
                      <label className="label" htmlFor="apellido">
                        Tu apellido *
                      </label>
                      <input
                        id="apellido"
                        name="apellido"
                        className="input"
                        placeholder="Ramírez"
                        value={formulario.apellido}
                        onChange={cambiar}
                        autoComplete="family-name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label" htmlFor="contrasena">
                      Contraseña *
                    </label>
                    <input
                      id="contrasena"
                      name="contrasena"
                      type="password"
                      className="input"
                      placeholder="Mínimo 8 caracteres"
                      value={formulario.contrasena}
                      onChange={cambiar}
                      autoComplete="new-password"
                      minLength={8}
                      required
                    />
                    <p className="text-xs text-text-secondary mt-1">
                      Debe incluir al menos una mayúscula o un número.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in"
                    >
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-full"
                    disabled={enviando}
                  >
                    {enviando ? 'Creando tu taller…' : `Contratar plan ${plan.nombre}`}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-text-secondary">
                    <ShieldCheck size={13} /> Tus datos se guardan cifrados y aislados
                    por empresa.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
