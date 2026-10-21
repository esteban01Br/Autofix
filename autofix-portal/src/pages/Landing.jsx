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
  Mail,
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
    texto: 'Agenda a tus clientes y distribuye el trabajo sin dobles cupos.',
  },
  {
    icono: Wrench,
    titulo: 'Órdenes de trabajo',
    texto: 'Del diagnóstico a la entrega, con estados claros por mecánico.',
  },
  {
    icono: Receipt,
    titulo: 'Facturación y pagos',
    texto: 'Comprobantes por orden, abonos parciales y saldos al día.',
  },
  {
    icono: Package,
    titulo: 'Inventario',
    texto: 'Repuestos con stock, alertas de mínimo e historial de ajustes.',
  },
  {
    icono: BarChart3,
    titulo: 'Reportes',
    texto: 'Productividad de mecánicos e indicadores del negocio en vivo.',
  },
  {
    icono: Building2,
    titulo: 'Multi-sucursal',
    texto: 'Varias sedes y roles por empleado, con datos siempre aislados.',
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

const formatearCOP = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(valor);

/** Etiqueta de sección con líneas de luz a los lados. */
function EtiquetaSeccion({ children }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span className="linea-etiqueta max-w-[6rem]" aria-hidden="true" />
      <span className="eyebrow whitespace-nowrap">{children}</span>
      <span className="linea-etiqueta max-w-[6rem]" aria-hidden="true" />
    </div>
  );
}

/** Tarjeta de vidrio decorativa del abanico del hero. */
function TarjetaEquipo() {
  const equipo = [
    { nombre: 'Miguel R.', rol: 'Gerente', color: '#a78bfa' },
    { nombre: 'Ana P.', rol: 'Cajera', color: '#6ea8ff' },
    { nombre: 'Carlos M.', rol: 'Mecánico', color: '#35d39a' },
  ];

  return (
    <div className="vidrio-flotante w-56 p-4">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
        Equipo del taller
      </p>
      <div className="mt-3 space-y-2.5">
        {equipo.map((persona) => (
          <div key={persona.nombre} className="flex items-center gap-2">
            <span
              className="tile-icono h-7 w-7 shrink-0 text-[9px] font-semibold text-frost"
              style={{ boxShadow: `inset 0 0 0 1px ${persona.color}55` }}
            >
              {persona.nombre.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] text-text-primary">{persona.nombre}</p>
              <p className="text-[9px] text-muted">{persona.rol}</p>
            </div>
            <span
              className="h-1 w-1 rounded-full"
              style={{ background: persona.color }}
            />
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-border pt-3">
        <p className="flex items-center gap-1.5 text-[9px] text-muted">
          <Users size={10} /> 12 empleados activos
        </p>
      </div>
    </div>
  );
}

function TarjetaSuscripcion() {
  return (
    <div className="vidrio-flotante w-56 p-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
          Suscripción
        </p>
        <span className="badge bg-success-glow text-success">Activa</span>
      </div>
      <div className="mt-3 flex items-end gap-1.5">
        <span className="font-display text-2xl font-medium text-text-primary">Pro</span>
        <span className="mb-0.5 text-[10px] text-muted">anual</span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(186,214,247,0.08)]">
        <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-accent to-blueprint" />
      </div>
      <p className="mt-2 text-[9px] text-muted">9 de 12 meses restantes</p>
      <div className="mt-4 space-y-1.5 border-t border-border pt-3 text-[10px]">
        <p className="flex justify-between gap-2">
          <span className="text-muted">Renueva</span>
          <span className="font-mono text-text-secondary">12 oct 2027</span>
        </p>
        <p className="flex justify-between gap-2">
          <span className="text-muted">Página</span>
          <span className="truncate font-mono text-blueprint">/acceso/el-rayo</span>
        </p>
      </div>
    </div>
  );
}

function TarjetaAcceso() {
  return (
    <div className="vidrio-flotante w-full overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
          <Lock size={10} className="text-blueprint" /> Acceso privado
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-success shadow-[0_0_8px_rgba(53,211,154,0.8)]" />
      </div>
      <div className="p-6 text-center">
        <div className="marca-violeta mx-auto flex h-12 w-12 items-center justify-center rounded-full font-display text-lg font-medium text-white">
          R
        </div>
        <p className="mt-3 font-display text-lg font-medium text-text-primary">
          Taller El Rayo
        </p>
        <p className="text-[11px] text-muted">Acceso privado del equipo</p>
        <div className="mt-5 space-y-2.5 text-left">
          <div className="flex items-center gap-2 rounded-md border border-[rgba(186,215,247,0.12)] bg-[rgba(199,211,234,0.06)] px-3 py-2 text-[11px] text-muted">
            <Mail size={12} /> mecanico@elrayo.com
          </div>
          <div className="flex items-center gap-2 rounded-md border border-[rgba(186,215,247,0.12)] bg-[rgba(199,211,234,0.06)] px-3 py-2 text-[11px] tracking-widest text-muted">
            <Lock size={12} /> ••••••••
          </div>
          <div className="btn btn-primary w-full">
            Entrar al taller <ArrowRight size={14} />
          </div>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted">
          <ShieldCheck size={11} className="text-blueprint" /> Conexión cifrada · Solo personal
          autorizado
        </p>
      </div>
    </div>
  );
}

/** Abanico de tarjetas de vidrio bajo el wordmark. */
function VitrinaHero() {
  return (
    <div
      className="pointer-events-none relative mx-auto mt-12 flex max-w-3xl select-none items-start justify-center sm:mt-16"
      aria-hidden="true"
    >
      <div
        className="hidden w-56 -rotate-6 md:block"
        style={{ marginTop: '2.5rem', marginRight: '-1rem' }}
      >
        <div className="motion-safe:animate-float" style={{ animationDelay: '0.8s' }}>
          <TarjetaEquipo />
        </div>
      </div>
      <div className="relative z-10 w-[17rem] shrink-0 sm:w-[19rem]">
        <div className="motion-safe:animate-float" style={{ animationDelay: '0.2s' }}>
          <TarjetaAcceso />
        </div>
      </div>
      <div
        className="hidden w-56 rotate-6 md:block"
        style={{ marginTop: '2.5rem', marginLeft: '-1rem' }}
      >
        <div className="motion-safe:animate-float" style={{ animationDelay: '1.4s' }}>
          <TarjetaSuscripcion />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#05060f] to-transparent" />
    </div>
  );
}

/** Vista previa del panel, construida solo con HTML y CSS. */
function PanelMockup() {
  const filas = [
    { id: '#1042', auto: 'Toyota Corolla', estado: 'En reparación', color: 'text-blueprint bg-info/10' },
    { id: '#1041', auto: 'Mazda 3', estado: 'Listo', color: 'text-success bg-success/10' },
    { id: '#1040', auto: 'Renault Logan', estado: 'Diagnóstico', color: 'text-frost bg-[rgba(186,214,247,0.08)]' },
  ];
  const barras = [38, 58, 44, 74, 60, 88, 68];

  return (
    <div className="relative">
      <div
        className="absolute -inset-6 rounded-[2rem] bg-accent/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="vidrio-flotante relative overflow-hidden">
        <div className="flex items-center gap-1.5 border-b border-border bg-[#05060f]/60 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          <span className="ml-3 flex-1 truncate rounded-md bg-[rgba(186,214,247,0.06)] px-2 py-1 font-mono text-[10px] text-muted">
            app.autofix.co/dashboard
          </span>
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-blueprint">
                Panel de control
              </p>
              <p className="font-display text-lg font-medium leading-tight text-text-primary">
                Buenos días, Taller El Rayo
              </p>
              <p className="text-[10px] text-muted">12 órdenes abiertas · 4 citas hoy</p>
            </div>
            <span className="badge bg-success/10 text-success">Al día</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { etiqueta: 'Vehículos', valor: '128' },
              { etiqueta: 'Órdenes', valor: '36' },
              { etiqueta: 'Ingresos', valor: '$8,4M' },
            ].map((dato) => (
              <div
                key={dato.etiqueta}
                className="rounded-xl border border-border bg-[rgba(186,214,247,0.03)] p-2.5"
              >
                <p className="font-mono text-[9px] uppercase tracking-wide text-muted">
                  {dato.etiqueta}
                </p>
                <p className="font-display text-lg font-medium text-text-primary">{dato.valor}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-[rgba(186,214,247,0.03)] p-3">
            <div className="mb-2.5 flex items-center justify-between text-[9px] text-muted">
              <span>Órdenes de la semana</span>
              <span>Últimos 7 días</span>
            </div>
            <div className="flex h-20 items-end gap-1.5">
              {barras.map((alto, indice) => (
                <div
                  key={indice}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-accent/30 to-accent-hover transition-all duration-500"
                  style={{ height: `${alto}%` }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            {filas.map((fila) => (
              <div
                key={fila.id}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-[#05060f]/30 px-2.5 py-1.5"
              >
                <span className="font-mono text-[10px] text-muted">{fila.id}</span>
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
        className="absolute -inset-5 rounded-[2rem] bg-accent/12 blur-3xl"
        aria-hidden="true"
      />
      <div className="vidrio-flotante relative overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border bg-[#05060f]/60 px-4 py-2.5">
          <Lock size={12} className="text-blueprint" />
          <span className="truncate font-mono text-[10px] text-muted">
            autofix.co/acceso/taller-el-rayo
          </span>
        </div>

        <div className="p-6">
          <div className="marca-violeta mx-auto flex h-12 w-12 items-center justify-center rounded-full font-display text-xl font-medium text-white">
            R
          </div>
          <p className="mt-3 text-center font-display text-xl font-medium text-text-primary">
            Taller El Rayo
          </p>
          <p className="text-center text-[11px] text-muted">
            Acceso privado del equipo
          </p>

          <div className="mt-5 space-y-2.5">
            <div className="flex items-center gap-2 rounded-md border border-[rgba(186,215,247,0.12)] bg-[rgba(199,211,234,0.06)] px-3 py-2 text-[11px] text-muted">
              <Mail size={12} /> mecanico@elrayo.com
            </div>
            <div className="flex items-center gap-2 rounded-md border border-[rgba(186,215,247,0.12)] bg-[rgba(199,211,234,0.06)] px-3 py-2 text-[11px] tracking-widest text-muted">
              <Lock size={12} /> ••••••••
            </div>
            <div className="btn btn-primary w-full">Entrar al taller</div>
          </div>

          <p className="mt-4 text-center text-[10px] text-muted">
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

      {/* Hero: wordmark iluminado + abanico de vidrio */}
      <section className="relative overflow-hidden bg-workshop">
        <div
          className="foco-conico pointer-events-none absolute left-1/2 top-[-20rem] h-[44rem] w-[44rem] -translate-x-1/2 opacity-70"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-40 top-24 h-[28rem] w-[28rem] rounded-full bg-accent/12 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -left-48 bottom-0 h-[26rem] w-[26rem] rounded-full bg-steel/12 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:pb-20 sm:pt-24">
          <Reveal>
            <span className="eyebrow inline-flex items-center gap-2 rounded-full border border-[rgba(186,215,247,0.14)] bg-[rgba(186,214,247,0.04)] px-4 py-1.5">
              <Sparkles size={12} className="text-blueprint" />
              Plataforma para talleres mecánicos
            </span>

            <h1 className="titulo-hero mt-7">AutoFix</h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
              Citas, órdenes, inventario y facturación en una sola superficie de cristal.
              Cada taller con su página privada, sus roles y sus datos aislados.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-muted">
              {['Sin cobro real en modo demo', '12 meses de acceso', 'Página privada incluida'].map(
                (texto) => (
                  <span key={texto} className="inline-flex items-center gap-1.5">
                    <Check size={12} className="text-blueprint" />
                    {texto}
                  </span>
                ),
              )}
            </div>
          </Reveal>

          <VitrinaHero />
        </div>
      </section>

      {/* Beneficios */}
      <section className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-7 sm:grid-cols-2 lg:grid-cols-4">
          {beneficios.map(({ icono: Icono, titulo, detalle }) => (
            <div key={titulo} className="flex items-center gap-3">
              <span className="tile-icono h-10 w-10 shrink-0">
                <Icono size={17} />
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">{titulo}</p>
                <p className="text-[11px] text-muted">{detalle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Características: fila de iconos con línea de tiempo */}
      <section id="caracteristicas" className="mx-auto w-full max-w-6xl px-4 py-24">
        <Reveal>
          <div className="text-center">
            <EtiquetaSeccion>Todo el taller</EtiquetaSeccion>
            <h2 className="titulo-seccion mt-5">Un solo sistema, toda la operación</h2>
            <p className="mx-auto mt-4 max-w-2xl text-text-secondary">
              Diseñado para el día a día del taller: menos planillas, menos llamadas y toda
              la operación visible desde el primer minuto.
            </p>
          </div>
        </Reveal>

        <div className="relative mt-16">
          <div
            className="linea-tiempo absolute left-[9%] right-[9%] top-7 hidden h-px xl:block"
            aria-hidden="true"
          />
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {caracteristicas.map(({ icono: Icono, titulo, texto }, indice) => (
              <Reveal key={titulo} delay={indice * 60}>
                <div className="group text-center">
                  <span className="tile-icono relative mx-auto h-14 w-14 transition-all duration-300 group-hover:-translate-y-1 group-hover:bg-accent-glow group-hover:text-white group-hover:shadow-[inset_0_0_0_1px_rgba(102,58,243,0.4)]">
                    <Icono size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-base font-medium text-text-primary">
                    {titulo}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted">{texto}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Producto en vivo */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-10 bg-[rgba(186,215,247,0.22)]" aria-hidden="true" />
              Tu operación
            </p>
            <h2 className="titulo-seccion mt-5">
              Todo el taller, iluminado en una sola pantalla
            </h2>
            <p className="mt-4 text-text-secondary">
              Órdenes abiertas, citas del día, alertas de inventario y facturación del mes.
              El panel se arma alrededor de lo que tu equipo necesita decidir hoy.
            </p>

            <ul className="mt-8 space-y-4">
              {[
                'Indicadores en vivo sin hojas de cálculo.',
                'Alertas antes de que falte un repuesto.',
                'Cada rol ve solo lo que le corresponde.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                  <span className="tile-icono mt-0.5 h-6 w-6 shrink-0 text-blueprint">
                    <Check size={12} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120}>
            <PanelMockup />
          </Reveal>
        </div>
      </section>

      {/* Página privada de la empresa */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow flex items-center gap-3">
              <span className="h-px w-10 bg-[rgba(186,215,247,0.22)]" aria-hidden="true" />
              Confidencialidad
            </p>
            <h2 className="titulo-seccion mt-5">Tu propia puerta de entrada</h2>
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
                  <span className="tile-icono mt-0.5 h-8 w-8 shrink-0">
                    <Icono size={15} />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-text-primary">{titulo}</p>
                    <p className="text-sm text-muted">{texto}</p>
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
      <section id="como-funciona" className="border-y border-border bg-surface/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-24">
          <Reveal>
            <div className="text-center">
              <EtiquetaSeccion>Cómo funciona</EtiquetaSeccion>
              <h2 className="titulo-seccion mt-5">De la compra a la primera orden</h2>
              <p className="mx-auto mt-4 max-w-xl text-text-secondary">
                Tres pasos, sin instalaciones ni configuraciones largas.
              </p>
            </div>
          </Reveal>

          <div className="relative mt-16 grid gap-10 md:grid-cols-3">
            <div
              className="linea-tiempo absolute left-[12%] right-[12%] top-6 hidden h-px md:block"
              aria-hidden="true"
            />
            {pasos.map((paso, indice) => (
              <Reveal key={paso.n} delay={indice * 120} className="relative">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full border border-accent/35 bg-[#0b0e1b] font-mono text-sm font-medium text-frost shadow-[0_0_34px_-10px_var(--color-accent-glow)]">
                  {paso.n}
                </div>
                <h3 className="mt-5 font-display text-xl font-medium text-text-primary">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{paso.texto}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="mx-auto w-full max-w-6xl px-4 py-24">
        <Reveal>
          <div className="text-center">
            <EtiquetaSeccion>Planes</EtiquetaSeccion>
            <h2 className="titulo-seccion mt-5">Elige el plan de tu taller</h2>
            <p className="mx-auto mt-4 max-w-xl text-text-secondary">
              Precios en COP · Tu página de acceso se activa al registrarte.
            </p>
          </div>

          <div className="mx-auto mt-8 inline-flex w-fit items-center rounded-full border border-border bg-[rgba(186,214,247,0.04)] p-1">
            {[
              { id: 'mensual', label: 'Mensual' },
              { id: 'anual', label: 'Anual', ahorro: '−20%' },
            ].map((opcion) => (
              <button
                key={opcion.id}
                onClick={() => setCiclo(opcion.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  ciclo === opcion.id
                    ? 'bg-accent text-white shadow-[inset_0_1px_1px_rgba(216,236,248,0.25)]'
                    : 'text-muted hover:text-text-primary'
                }`}
              >
                {opcion.label}
                {opcion.ahorro && (
                  <span
                    className={`text-[10px] ${
                      ciclo === opcion.id ? 'text-white/80' : 'text-blueprint'
                    }`}
                  >
                    {opcion.ahorro}
                  </span>
                )}
              </button>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid items-stretch gap-6 md:grid-cols-3">
          {planes.map((plan, indice) => {
            const ahorro = Math.round(
              (1 - plan.precioAnual / (plan.precioMensual * 12)) * 100,
            );
            return (
              <Reveal key={plan.id} delay={indice * 100} className="h-full">
                <div
                  className={`card card-hover relative flex h-full flex-col p-6 ${
                    plan.destacado
                      ? 'border-accent/50 bg-accent/[0.06] shadow-[0_0_60px_-18px_var(--color-accent-glow)] md:-translate-y-2'
                      : ''
                  }`}
                >
                  {plan.destacado && (
                    <span className="badge absolute -top-3 left-6 bg-accent text-white">
                      Más elegido
                    </span>
                  )}

                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-display text-2xl font-medium text-text-primary">
                      {plan.nombre}
                    </h3>
                    {plan.destacado && (
                      <Sparkles size={16} className="text-blueprint" aria-hidden="true" />
                    )}
                  </div>

                  {ciclo === 'anual' ? (
                    <>
                      <div className="mt-4 flex items-end gap-1">
                        <span className="texto-degradado font-display text-4xl font-medium tracking-tight">
                          {formatearCOP(plan.precioAnual)}
                        </span>
                        <span className="mb-1 text-sm text-muted">/año</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
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
                        <span className="texto-degradado font-display text-4xl font-medium tracking-tight">
                          {formatearCOP(plan.precioMensual)}
                        </span>
                        <span className="mb-1 text-sm text-muted">/mes</span>
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        {formatearCOP(plan.precioMensual * 12)} al año
                      </p>
                    </>
                  )}

                  <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                    {plan.caracteristicas.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <Check size={15} className="mt-0.5 shrink-0 text-blueprint" />
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
              </Reveal>
            );
          })}
        </div>

        {planes.length === 0 && (
          <div className="card mt-10 animate-pulse-subtle p-8 text-center text-sm text-muted">
            Cargando planes…
          </div>
        )}
      </section>

      {/* Preguntas frecuentes */}
      <section className="border-y border-border bg-surface/30">
        <div className="mx-auto w-full max-w-3xl px-4 py-24">
          <Reveal>
            <div className="text-center">
              <EtiquetaSeccion>Dudas frecuentes</EtiquetaSeccion>
              <h2 className="titulo-seccion mt-5">Antes de empezar</h2>
            </div>
          </Reveal>

          <div className="mt-10 space-y-3">
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
                          ? 'rotate-45 text-blueprint'
                          : 'text-muted'
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
                      <p className="px-5 pb-4 text-sm leading-relaxed text-muted">
                        {item.r}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="mx-auto w-full max-w-6xl px-4 py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-workshop p-8 text-center sm:p-14">
            <div
              className="foco-conico pointer-events-none absolute left-1/2 top-[-12rem] h-[26rem] w-[26rem] -translate-x-1/2 opacity-60"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl"
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
