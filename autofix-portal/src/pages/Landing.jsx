import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  Check,
  Package,
  Receipt,
  Wrench,
} from 'lucide-react';
import { listarPlanes } from '../services/authService';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const caracteristicas = [
  {
    icono: Calendar,
    titulo: 'Citas y agenda',
    texto: 'Agenda a tus clientes y distribuye el trabajo del taller sin dobles cupos.',
  },
  {
    icono: Wrench,
    titulo: 'Órdenes de trabajo',
    texto: 'Del diagnóstico a la entrega, con estados claros y seguimiento por mecánico.',
  },
  {
    icono: Receipt,
    titulo: 'Facturación y pagos',
    texto: 'Comprobantes por orden, abonos parciales y control de saldos al día.',
  },
  {
    icono: Package,
    titulo: 'Inventario',
    texto: 'Repuestos con stock, alertas de mínimo y ajustes con historial.',
  },
  {
    icono: BarChart3,
    titulo: 'Reportes',
    texto: 'Productividad de mecánicos e indicadores del negocio en tiempo real.',
  },
  {
    icono: Building2,
    titulo: 'Multi-sucursal',
    texto: 'Varias sucursales y roles por empleado, con datos siempre aislados.',
  },
];

const pasos = [
  {
    n: '01',
    titulo: 'Elige tu plan',
    texto: 'Compara los planes y completa el registro de tu taller en minutos.',
  },
  {
    n: '02',
    titulo: 'Recibe tu página privada',
    texto: 'Tu empresa obtiene una URL única y exclusiva para tu equipo.',
  },
  {
    n: '03',
    titulo: 'Entra tu equipo',
    texto: 'Cada empleado inicia sesión desde la página de tu taller con su rol.',
  },
];

const formatearCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

export default function Landing() {
  const [planes, setPlanes] = useState([]);

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch(() => setPlanes([]));
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-workshop">
        <div
          className="absolute -top-40 -right-40 w-[32rem] h-[32rem] rounded-full bg-accent opacity-15 blur-3xl"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-20 sm:py-28 relative">
          <span className="badge bg-accent/10 text-accent mb-6 animate-fade-in">
            Plataforma SaaS para talleres
          </span>
          <h1 className="titulo-hero max-w-3xl animate-slide-up">
            Tu taller,
            <br />
            <span className="text-accent">bajo control</span>
          </h1>
          <p className="mt-6 max-w-xl text-text-secondary text-lg animate-slide-up">
            Citas, órdenes de trabajo, inventario y facturación en un solo lugar.
            Cada taller recibe su propia página privada y segura para todo el equipo.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-slide-up">
            <Link to="/comprar/basico" className="btn btn-primary btn-lg">
              Comenzar ahora <ArrowRight size={17} />
            </Link>
            <a href="#planes" className="btn btn-ghost btn-lg">
              Ver planes
            </a>
          </div>
          <p className="mt-4 text-xs text-text-secondary">
            Registro en minutos · Suscripción de 12 meses · Modo demostración sin cobro real
          </p>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="mx-auto max-w-6xl px-4 py-20 w-full">
        <p className="badge bg-info/10 text-info mb-4">Todo el taller</p>
        <h2 className="titulo-seccion">Lo que necesitas, en un solo sistema</h2>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {caracteristicas.map(({ icono: Icono, titulo, texto }) => (
            <div
              key={titulo}
              className="card p-6 hover:-translate-y-1 hover:border-accent/40 transition-all duration-200"
            >
              <span className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center mb-4">
                <Icono size={20} />
              </span>
              <h3 className="font-display text-xl font-bold uppercase tracking-wide">{titulo}</h3>
              <p className="mt-2 text-sm text-text-secondary leading-relaxed">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="border-y border-border bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <p className="badge bg-success/10 text-success mb-4">Así de simple</p>
          <h2 className="titulo-seccion">De la compra a la primera orden</h2>
          <div className="mt-10 grid md:grid-cols-3 gap-6">
            {pasos.map((paso) => (
              <div key={paso.n} className="relative">
                <span className="font-mono text-5xl font-bold text-accent/25">{paso.n}</span>
                <h3 className="font-display text-2xl font-bold uppercase mt-2">{paso.titulo}</h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">{paso.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="mx-auto max-w-6xl px-4 py-20 w-full">
        <p className="badge bg-accent/10 text-accent mb-4">Planes</p>
        <h2 className="titulo-seccion">Elige el plan de tu taller</h2>
        <p className="mt-3 text-text-secondary">
          Precios en COP · Facturación anual · Actives tu página de acceso al registrarte.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6 items-stretch">
          {planes.map((plan) => (
            <div
              key={plan.id}
              className={`card p-6 flex flex-col relative ${
                plan.destacado ? 'border-accent shadow-[0_0_40px_var(--color-accent-glow)]' : ''
              }`}
            >
              {plan.destacado && (
                <span className="badge bg-accent text-base-bg absolute -top-3 left-6">
                  Más elegido
                </span>
              )}
              <h3 className="font-display text-3xl font-bold uppercase">{plan.nombre}</h3>
              <div className="mt-4 flex items-end gap-1">
                <span className="font-display text-4xl font-extrabold text-accent">
                  {formatearCOP(plan.precioMensual)}
                </span>
                <span className="text-sm text-text-secondary mb-1">/mes</span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {formatearCOP(plan.precioAnual)} al año
              </p>

              <ul className="mt-6 space-y-2.5 text-sm flex-1">
                {plan.caracteristicas.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check size={15} className="text-success mt-0.5 shrink-0" />
                    <span className="text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>

              <Link
                to={`/comprar/${plan.id.toLowerCase()}`}
                className={`btn btn-lg mt-6 w-full ${
                  plan.destacado ? 'btn-primary' : 'btn-ghost'
                }`}
              >
                Elegir {plan.nombre}
              </Link>
            </div>
          ))}
        </div>

        {planes.length === 0 && (
          <div className="card p-8 text-center text-sm text-text-secondary animate-pulse-subtle">
            Cargando planes…
          </div>
        )}
      </section>

      {/* Cierre */}
      <section className="mx-auto max-w-6xl px-4 pb-20 w-full">
        <div className="card p-8 sm:p-12 text-center relative overflow-hidden bg-workshop">
          <h2 className="titulo-seccion">¿Listo para ordenar tu taller?</h2>
          <p className="mt-3 text-text-secondary max-w-md mx-auto">
            Crea tu empresa, recibe tu página privada y empieza a trabajar hoy mismo.
          </p>
          <Link to="/comprar/basico" className="btn btn-primary btn-lg mt-6">
            Crear mi cuenta de taller <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
