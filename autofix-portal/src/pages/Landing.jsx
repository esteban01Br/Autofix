import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  Check,
  Cloud,
  Lock,
  Package,
  Plus,
  Receipt,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import { listarPlanes } from '../services/authService';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import Reveal from '../components/Reveal';

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

const beneficios = [
  {
    icono: ShieldCheck,
    titulo: 'Acceso confidencial',
    detalle: 'URL privada por empresa',
  },
  { icono: Building2, titulo: 'Multiempresa', detalle: 'Datos aislados por taller' },
  { icono: Users, titulo: 'Roles por empleado', detalle: 'Permisos según el cargo' },
  { icono: Cloud, titulo: 'En la nube', detalle: 'Sin instalar nada' },
];

const preguntas = [
  {
    p: '¿Cómo entra mi equipo?',
    r: 'Al registrarte, tu empresa recibe una página de acceso privada (por ejemplo, autofix.co/acceso/tu-taller). Tu equipo entra desde esa dirección con el correo y la contraseña que les asignes, sin compartir el enlace con otros talleres.',
  },
  {
    p: '¿Cuánto dura la suscripción?',
    r: 'La compra contrata 12 meses de servicio. Puedes renovar cuando quieras: el tiempo nuevo se suma al que te queda, sin perder días.',
  },
  {
    p: '¿Los datos de mi taller se mezclan con otros?',
    r: 'No. Cada empresa tiene su propio espacio aislado. Clientes, vehículos, órdenes, facturas e inventario solo son visibles para su equipo.',
  },
  {
    p: '¿Hay cobro real en este momento?',
    r: 'La compra está en modo demostración: no se procesa ningún pago real. Al registrarte se activa tu acceso por 12 meses para que pruebes la plataforma completa.',
  },
  {
    p: '¿La factura sirve para la DIAN?',
    r: 'AutoFix emite un comprobante interno de trabajo. No es una factura electrónica válida ante la DIAN.',
  },
];

const acentosIcono = [
  'bg-accent/10 text-accent',
  'bg-info/10 text-info',
  'bg-success/10 text-success',
];

const formatearCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

/** Vista previa del panel, construida solo con HTML y CSS. */
function PanelMockup() {
  const filas = [
    { id: '#1042', auto: 'Toyota Corolla', estado: 'En reparación', color: 'text-accent bg-accent/10' },
    { id: '#1041', auto: 'Mazda 3', estado: 'Listo', color: 'text-success bg-success/10' },
    { id: '#1040', auto: 'Renault Logan', estado: 'Diagnóstico', color: 'text-info bg-info/10' },
  ];
  const barras = [38, 58, 44, 74, 60, 88, 68];

  return (
    <div className="relative">
      <div
        className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="animate-float relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50 ring-1 ring-white/5 hover:[animation-play-state:paused]">
        <div className="flex items-center gap-1.5 border-b border-border bg-base-bg/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 flex-1 truncate rounded-md bg-surface-hover px-2 py-1 font-mono text-[10px] text-text-secondary">
            app.autofix.co/dashboard
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">
                Panel de control
              </p>
              <p className="font-display text-lg font-bold leading-tight">
                Buenos días, Taller El Rayo
              </p>
              <p className="text-[10px] text-text-secondary">12 órdenes abiertas · 4 citas hoy</p>
            </div>
            <span className="badge bg-success/10 text-success">Al día</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { etiqueta: 'Vehículos', valor: '128' },
              { etiqueta: 'Órdenes', valor: '36' },
              { etiqueta: 'Ingresos', valor: '$8,4M' },
            ].map((dato) => (
              <div key={dato.etiqueta} className="rounded-xl border border-border bg-base-bg/40 p-2.5">
                <p className="text-[9px] uppercase tracking-wide text-text-secondary">
                  {dato.etiqueta}
                </p>
                <p className="font-display text-lg font-bold text-text-primary">{dato.valor}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-base-bg/40 p-3">
            <div className="mb-2.5 flex items-center justify-between text-[9px] text-text-secondary">
              <span>Órdenes de la semana</span>
              <span>Últimos 7 días</span>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {barras.map((alto, indice) => (
                <div
                  key={indice}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-accent/25 to-accent transition-all duration-500"
                  style={{ height: `${alto}%` }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {filas.map((fila) => (
              <div
                key={fila.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-base-bg/30 px-2.5 py-1.5"
              >
                <span className="font-mono text-[10px] text-text-secondary">{fila.id}</span>
                <span className="flex-1 truncate text-[11px] text-text-primary">{fila.auto}</span>
                <span className={`badge ${fila.color}`}>{fila.estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Vista previa de la página privada de acceso de una empresa. */
function AccesoMockup() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="absolute -inset-5 rounded-[2rem] bg-steel/15 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl shadow-black/50 ring-1 ring-white/5">
        <div className="flex items-center gap-2 border-b border-border bg-base-bg/60 px-4 py-2.5">
          <Lock size={12} className="text-success" />
          <span className="truncate font-mono text-[10px] text-text-secondary">
            autofix.co/acceso/taller-el-rayo
          </span>
        </div>

        <div className="p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-hover via-accent to-[#d98200] font-display text-xl font-bold text-base-bg shadow-lg">
            R
          </div>
          <p className="mt-3 text-center font-display text-xl font-bold">Taller El Rayo</p>
          <p className="text-center text-[11px] text-text-secondary">
            Acceso privado del equipo
          </p>

          <div className="mt-5 space-y-2.5">
            <div className="input text-[11px] text-text-secondary">mecanico@elrayo.com</div>
            <div className="input text-[11px] tracking-widest text-text-secondary">••••••••</div>
            <div className="btn btn-primary w-full">Entrar al taller</div>
          </div>

          <p className="mt-4 text-center text-[10px] text-text-secondary">
            Conexión segura · Solo personal autorizado
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const [planes, setPlanes] = useState([]);
  const [ciclo, setCiclo] = useState('anual');
  const [preguntaAbierta, setPreguntaAbierta] = useState(0);

  useEffect(() => {
    listarPlanes()
      .then(setPlanes)
      .catch(() => setPlanes([]));
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-workshop">
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-accent/15 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-48 bottom-0 h-[26rem] w-[26rem] rounded-full bg-steel/15 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 py-16 sm:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="badge bg-accent/10 text-accent animate-fade-in">
              <Sparkles size={11} /> Plataforma SaaS para talleres
            </span>
            <h1 className="titulo-hero mt-6 animate-slide-up">
              Tu taller,
              <br />
              <span className="texto-degradado-hero">bajo control</span>
            </h1>
            <p className="mt-6 max-w-xl animate-slide-up text-lg text-text-secondary">
              Citas, órdenes de trabajo, inventario y facturación en un solo lugar. Cada
              taller recibe su propia página privada y segura para todo el equipo.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 animate-slide-up">
              <Link to="/comprar/basico" className="btn btn-primary btn-lg group">
                Comenzar ahora
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <a href="#planes" className="btn btn-ghost btn-lg">
                Ver planes
              </a>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-text-secondary">
              {['Sin cobro real en modo demo', '12 meses de acceso', 'Página privada incluida'].map(
                (texto) => (
                  <span key={texto} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="text-success" />
                    {texto}
                  </span>
                ),
              )}
            </div>
          </div>

          <div className="animate-fade-in">
            <PanelMockup />
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(({ icono: Icono, titulo, detalle }) => (
            <div key={titulo} className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icono size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">{titulo}</p>
                <p className="text-[11px] text-text-secondary">{detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal>
          <p className="badge mb-4 bg-info/10 text-info">Todo el taller</p>
          <h2 className="titulo-seccion">Lo que necesitas, en un solo sistema</h2>
          <p className="mt-3 max-w-2xl text-text-secondary">
            Diseñado para el día a día del taller: menos planillas, menos llamadas y toda la
            operación visible desde el primer minuto.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {caracteristicas.map(({ icono: Icono, titulo, texto }, indice) => (
            <Reveal key={titulo} delay={indice * 80}>
              <div className="card card-hover group h-full p-6">
                <span
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105 ${
                    acentosIcono[indice % acentosIcono.length]
                  }`}
                >
                  <Icono size={20} />
                </span>
                <h3 className="font-display text-xl font-bold uppercase tracking-wide">
                  {titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Página privada de la empresa */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-2">
          <Reveal>
            <p className="badge mb-4 bg-accent/10 text-accent">Confidencialidad</p>
            <h2 className="titulo-seccion">Tu propia página de acceso</h2>
            <p className="mt-4 text-text-secondary">
              No compartes un login genérico con el resto de talleres. Tu empresa tiene una
              dirección única y exclusiva, con su nombre y su equipo.
            </p>

            <ul className="mt-7 space-y-4">
              {[
                {
                  icono: Lock,
                  titulo: 'URL privada por empresa',
                  texto: 'Solo quien tenga el enlace de tu taller llega a tu acceso.',
                },
                {
                  icono: Users,
                  titulo: 'Roles y permisos',
                  texto: 'Admin, gerente, mecánico, bodeguero o cajero: cada quien ve lo suyo.',
                },
                {
                  icono: ShieldCheck,
                  titulo: 'Suscripción controlada',
                  texto: 'Si la suscripción vence, el acceso se bloquea de forma automática.',
                },
              ].map(({ icono: Icono, titulo, texto }) => (
                <li key={titulo} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icono size={16} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{titulo}</p>
                    <p className="text-sm text-text-secondary">{texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <AccesoMockup />
          </Reveal>
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" className="mx-auto w-full max-w-6xl px-4 py-20">
        <Reveal>
          <p className="badge mb-4 bg-success/10 text-success">Así de simple</p>
          <h2 className="titulo-seccion">De la compra a la primera orden</h2>
        </Reveal>

        <div className="relative mt-12 grid gap-8 md:grid-cols-3">
          <div
            className="linea-tiempo absolute left-0 right-0 top-6 hidden h-px md:block"
            aria-hidden="true"
          />
          {pasos.map((paso, indice) => (
            <Reveal key={paso.n} delay={indice * 120} className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/40 bg-surface font-mono text-sm font-bold text-accent shadow-[0_0_30px_-10px_var(--color-accent-glow)]">
                {paso.n}
              </div>
              <h3 className="mt-5 font-display text-2xl font-bold uppercase">{paso.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">{paso.texto}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="border-t border-border bg-surface/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <Reveal>
            <p className="badge mb-4 bg-accent/10 text-accent">Planes</p>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="titulo-seccion">Elige el plan de tu taller</h2>
                <p className="mt-3 text-text-secondary">
                  Precios en COP · Pago anual · Tu página de acceso se activa al registrarte.
                </p>
              </div>

              <div className="inline-flex w-fit items-center rounded-full border border-border bg-surface p-1">
                {[
                  { id: 'mensual', label: 'Mensual' },
                  { id: 'anual', label: 'Anual', ahorro: '−20%' },
                ].map((opcion) => (
                  <button
                    key={opcion.id}
                    onClick={() => setCiclo(opcion.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                      ciclo === opcion.id
                        ? 'bg-accent text-base-bg shadow-md'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {opcion.label}
                    {opcion.ahorro && (
                      <span
                        className={`text-[10px] ${
                          ciclo === opcion.id ? 'text-base-bg/80' : 'text-success'
                        }`}
                      >
                        {opcion.ahorro}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          <div className="mt-10 grid items-stretch gap-6 md:grid-cols-3">
            {planes.map((plan, indice) => {
              const ahorro = Math.round(
                (1 - plan.precioAnual / (plan.precioMensual * 12)) * 100,
              );
              return (
                <Reveal key={plan.id} delay={indice * 100} className="h-full">
                  <div
                    className={`card card-hover relative flex h-full flex-col p-6 ${
                      plan.destacado
                        ? 'border-accent/60 shadow-[0_0_50px_-14px_var(--color-accent-glow)]'
                        : ''
                    }`}
                  >
                    {plan.destacado && (
                      <span className="badge absolute -top-3 left-6 bg-accent text-base-bg">
                        Más elegido
                      </span>
                    )}

                    <h3 className="font-display text-3xl font-bold uppercase">{plan.nombre}</h3>

                    {ciclo === 'anual' ? (
                      <>
                        <div className="mt-4 flex items-end gap-1">
                          <span className="font-display text-4xl font-extrabold text-accent">
                            {formatearCOP(plan.precioAnual)}
                          </span>
                          <span className="mb-1 text-sm text-text-secondary">/año</span>
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          Equivale a {formatearCOP(Math.round(plan.precioAnual / 12))} al mes
                        </p>
                        {ahorro > 0 && (
                          <span className="badge mt-2 w-fit bg-success/10 text-success">
                            Ahorras {ahorro}%
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="mt-4 flex items-end gap-1">
                          <span className="font-display text-4xl font-extrabold text-accent">
                            {formatearCOP(plan.precioMensual)}
                          </span>
                          <span className="mb-1 text-sm text-text-secondary">/mes</span>
                        </div>
                        <p className="mt-1 text-xs text-text-secondary">
                          {formatearCOP(plan.precioMensual * 12)} al año
                        </p>
                      </>
                    )}

                    <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                      {plan.caracteristicas.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check size={15} className="mt-0.5 shrink-0 text-success" />
                          <span className="text-text-secondary">{item}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      to={`/comprar/${plan.id.toLowerCase()}`}
                      className={`btn btn-lg mt-6 w-full ${
                        plan.destacado ? 'btn-primary' : 'btn-ghost hover:border-accent/40'
                      }`}
                    >
                      Elegir {plan.nombre}
                    </Link>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {planes.length === 0 && (
            <div className="card mt-10 animate-pulse-subtle p-8 text-center text-sm text-text-secondary">
              Cargando planes…
            </div>
          )}
        </div>
      </section>

      {/* Preguntas frecuentes */}
      <section className="mx-auto w-full max-w-4xl px-4 py-20">
        <Reveal>
          <p className="badge mb-4 bg-info/10 text-info">Dudas frecuentes</p>
          <h2 className="titulo-seccion">Antes de empezar</h2>
        </Reveal>

        <div className="mt-8 space-y-3">
          {preguntas.map((item, indice) => (
            <Reveal key={item.p} delay={indice * 60}>
              <div
                className={`card overflow-hidden transition-colors ${
                  preguntaAbierta === indice ? 'border-accent/40' : ''
                }`}
              >
                <button
                  onClick={() =>
                    setPreguntaAbierta(preguntaAbierta === indice ? -1 : indice)
                  }
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  aria-expanded={preguntaAbierta === indice}
                >
                  <span className="text-sm font-medium text-text-primary">{item.p}</span>
                  <Plus
                    size={17}
                    className={`shrink-0 transition-transform duration-300 ${
                      preguntaAbierta === indice
                        ? 'rotate-45 text-accent'
                        : 'text-text-secondary'
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    preguntaAbierta === indice
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">
                      {item.r}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-20">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-workshop p-8 text-center sm:p-14">
            <div
              className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-steel/10"
              aria-hidden="true"
            />
            <div
              className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="titulo-seccion">¿Listo para ordenar tu taller?</h2>
              <p className="mx-auto mt-3 max-w-md text-text-secondary">
                Crea tu empresa, recibe tu página privada y empieza a trabajar hoy mismo.
              </p>
              <Link to="/comprar/basico" className="btn btn-primary btn-lg group mt-7">
                Crear mi cuenta de taller
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
