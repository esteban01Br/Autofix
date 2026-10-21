import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Calendar,
  Car,
  ChevronRight,
  Package,
  Receipt,
  Sparkles,
  Wrench,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import {
  obtenerVehiculos,
  obtenerCitas,
  obtenerOrdenes,
  obtenerRepuestos,
  obtenerFacturas,
} from '../services/dashboardService';

const SEGMENTOS_ESTADO = [
  { estado: 'RECIBIDO', color: '#6E9EFF' },
  { estado: 'DIAGNOSTICO', color: '#C084FC' },
  { estado: 'EN_REPARACION', color: '#F5A623' },
  { estado: 'ESPERANDO_REPUESTOS', color: '#E5484D' },
  { estado: 'LISTO', color: '#3DD68C' },
  { estado: 'ENTREGADO', color: '#8B9099' },
];

const ACCIONES = [
  {
    label: 'Nueva cita',
    to: '/citas',
    icon: Calendar,
    roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'],
  },
  {
    label: 'Nueva orden',
    to: '/ordenes',
    icon: Wrench,
    roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO'],
  },
  {
    label: 'Nuevo vehículo',
    to: '/vehiculos',
    icon: Car,
    roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'],
  },
  {
    label: 'Nuevo repuesto',
    to: '/repuestos',
    icon: Package,
    roles: ['ADMIN', 'GERENTE', 'BODEGUERO'],
  },
];

const moneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const etiquetaEstado = (estado) =>
  estado
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (letra) => letra.toUpperCase());

const fechaHoraCita = (cita) => new Date(`${cita.fecha}T${cita.hora || '00:00:00'}`);

/** Dona de órdenes por estado, dibujada con SVG puro (sin librerías). */
function DonaEstados({ segmentos, total }) {
  const largo = 2 * Math.PI * 42;
  let acumulado = 0;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--color-surface-hover)"
            strokeWidth="11"
          />
          {segmentos.map(({ estado, color, cantidad }) => {
            const porcion = cantidad / total;
            const trazo = Math.max(porcion * largo - 2.5, 0.8);
            const desplazamiento = -acumulado * largo;
            acumulado += porcion;
            return (
              <circle
                key={estado}
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke={color}
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={`${trazo} ${largo}`}
                strokeDashoffset={desplazamiento}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-text-primary">{total}</span>
          <span className="text-[10px] uppercase tracking-[0.14em] text-text-secondary">
            Órdenes
          </span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-1.5">
        {segmentos.map(({ estado, color, cantidad }) => (
          <li key={estado} className="flex items-center gap-2 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: color }}
            />
            <span className="flex-1 truncate text-text-secondary">
              {etiquetaEstado(estado)}
            </span>
            <span className="font-mono font-semibold text-text-primary">{cantidad}</span>
            <span className="w-9 text-right text-text-secondary">
              {Math.round((cantidad / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TituloPanel({ titulo, subtitulo, to, navigate }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold tracking-wide text-text-primary">
          {titulo}
        </h3>
        {subtitulo && <p className="mt-0.5 text-xs text-text-secondary">{subtitulo}</p>}
      </div>
      {to && (
        <button
          onClick={() => navigate(to)}
          className="group inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-text-secondary transition-colors hover:text-accent"
        >
          Ver todo
          <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [datos, setDatos] = useState({
    vehiculos: [],
    citas: [],
    ordenes: [],
    repuestos: [],
    facturas: null,
  });
  const [estado, setEstado] = useState({ cargando: true, error: '' });
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      // allSettled: si un rol no tiene acceso a un módulo, el resto del
      // panel sigue funcionando en lugar de romperse completo.
      const [vehiculos, citas, ordenes, repuestos, facturas] = await Promise.allSettled([
        obtenerVehiculos(),
        obtenerCitas(),
        obtenerOrdenes(),
        obtenerRepuestos(),
        obtenerFacturas(),
      ]);
      if (!activo) return;

      const valor = (resultado) =>
        resultado.status === 'fulfilled' ? resultado.value : [];
      const fallaronTodos = [vehiculos, citas, ordenes, repuestos].every(
        (resultado) => resultado.status === 'rejected',
      );

      setDatos({
        vehiculos: valor(vehiculos),
        citas: valor(citas),
        ordenes: valor(ordenes),
        repuestos: valor(repuestos),
        facturas: facturas.status === 'fulfilled' ? facturas.value : null,
      });
      setEstado({
        cargando: false,
        error: fallaronTodos ? 'No se pudieron cargar los datos del panel.' : '',
      });
    };

    cargar();
    return () => {
      activo = false;
    };
  }, []);

  const ordenesAbiertas = useMemo(
    () => datos.ordenes.filter((orden) => orden.estado !== 'ENTREGADO'),
    [datos.ordenes],
  );

  const segmentos = useMemo(() => {
    const conteo = {};
    datos.ordenes.forEach((orden) => {
      conteo[orden.estado] = (conteo[orden.estado] || 0) + 1;
    });
    return SEGMENTOS_ESTADO.map((segmento) => ({
      ...segmento,
      cantidad: conteo[segmento.estado] || 0,
    })).filter((segmento) => segmento.cantidad > 0);
  }, [datos.ordenes]);

  const citasProximas = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return datos.citas
      .filter((cita) => ['PENDIENTE', 'CONFIRMADA'].includes(cita.estado))
      .filter((cita) => fechaHoraCita(cita) >= hoy)
      .sort((a, b) => fechaHoraCita(a) - fechaHoraCita(b))
      .slice(0, 4);
  }, [datos.citas]);

  const serieOrdenes = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, indice) => {
      const dia = new Date(hoy);
      dia.setDate(hoy.getDate() - (6 - indice));
      const inicio = dia.getTime();
      const fin = inicio + 24 * 60 * 60 * 1000;
      return datos.ordenes.filter((orden) => {
        const marca = new Date(orden.fechaIngreso).getTime();
        return marca >= inicio && marca < fin;
      }).length;
    });
  }, [datos.ordenes]);

  const alertasStock = useMemo(
    () =>
      datos.repuestos
        .filter((repuesto) => {
          const minimo = repuesto.stockMinimo > 0 ? repuesto.stockMinimo : 9;
          return repuesto.stock === 0 || (repuesto.stock > 0 && repuesto.stock <= minimo);
        })
        .sort((a, b) => a.stock - b.stock),
    [datos.repuestos],
  );

  const facturacion = useMemo(() => {
    if (!datos.facturas) return null;
    const ahora = new Date();
    const delMes = datos.facturas.filter((factura) => {
      const fecha = new Date(factura.fecha);
      return (
        fecha.getMonth() === ahora.getMonth() &&
        fecha.getFullYear() === ahora.getFullYear()
      );
    });
    const totalMes = delMes.reduce((suma, factura) => suma + Number(factura.total || 0), 0);
    const recaudado = datos.facturas.reduce(
      (suma, factura) => suma + Number(factura.montoPagado || 0),
      0,
    );
    const cartera = datos.facturas.reduce(
      (suma, factura) => suma + Number(factura.saldo || 0),
      0,
    );
    const pendientes = datos.facturas.filter(
      (factura) => factura.estadoPago !== 'PAGADA',
    ).length;
    const base = recaudado + cartera;
    return {
      totalMes,
      recaudado,
      cartera,
      pendientes,
      cantidadMes: delMes.length,
      porcentaje: base > 0 ? Math.round((recaudado / base) * 100) : 0,
    };
  }, [datos.facturas]);

  if (estado.cargando) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((indice) => (
            <div key={indice} className="card p-5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
              <Skeleton className="mt-3 h-3 w-full" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((indice) => (
            <div key={indice} className="card p-5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-4 h-36 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (estado.error) {
    return (
      <div className="card flex items-center gap-3 border-danger/30 bg-danger/5 p-8 text-danger">
        <AlertTriangle size={18} />
        {estado.error}
      </div>
    );
  }

  const ahora = new Date();
  const saludo =
    ahora.getHours() < 12 ? 'Buenos días' : ahora.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
  const nombreCorto = usuario?.sub?.split('@')[0] ?? '';
  const fechaLarga = ahora.toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const accionesVisibles = ACCIONES.filter((accion) =>
    accion.roles.includes(usuario?.rol),
  );
  const resumenRapido = [
    { label: 'Vehículos registrados', valor: datos.vehiculos.length, to: '/vehiculos', roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'] },
    { label: 'Órdenes abiertas', valor: ordenesAbiertas.length, to: '/ordenes', roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO'] },
    { label: 'Citas próximas', valor: citasProximas.length, to: '/citas', roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'] },
    { label: 'Repuestos con alerta', valor: alertasStock.length, to: '/repuestos', roles: ['ADMIN', 'GERENTE', 'BODEGUERO', 'MECANICO'] },
  ].filter((fila) => fila.roles.includes(usuario?.rol));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">
            <Sparkles size={12} /> Panel de control
          </p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-wide text-text-primary">
            {saludo},{' '}
            <span className="texto-degradado">{nombreCorto || 'equipo'}</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary first-letter:uppercase">
            {fechaLarga} · {ordenesAbiertas.length} órdenes abiertas ·{' '}
            {citasProximas.length} citas próximas
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {accionesVisibles.map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="btn btn-ghost btn-sm group hover:border-accent/40 hover:text-accent"
            >
              <Icon size={15} className="transition-transform group-hover:scale-110" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          titulo="Vehículos"
          valor={datos.vehiculos.length}
          icon={Car}
          acento
          detalle="Registrados en el taller"
          onClick={() => navigate('/vehiculos')}
        />
        <MetricCard
          titulo="Órdenes abiertas"
          valor={ordenesAbiertas.length}
          icon={Wrench}
          detalle={`${datos.ordenes.length} en el historial`}
          serie={serieOrdenes}
          onClick={() => navigate('/ordenes')}
        />
        <MetricCard
          titulo="Citas próximas"
          valor={citasProximas.length}
          icon={Calendar}
          acento
          detalle="Pendientes o confirmadas"
          onClick={() => navigate('/citas')}
        />
        <MetricCard
          titulo="Stock crítico"
          valor={alertasStock.length}
          icon={Package}
          detalle="Repuestos por reponer"
          onClick={() => navigate('/repuestos')}
        />
      </div>

      {/* Segunda fila */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card card-hover p-5">
          <TituloPanel
            titulo="Flujo de órdenes"
            subtitulo="Distribución por estado"
            to="/ordenes"
            navigate={navigate}
          />
          {datos.ordenes.length === 0 ? (
            <EmptyState
              icono={Wrench}
              mensaje="Sin órdenes registradas"
              sugerencia="Crea la primera orden para ver el flujo del taller."
              accionLabel="Ir a órdenes"
              accionClick={() => navigate('/ordenes')}
            />
          ) : (
            <DonaEstados segmentos={segmentos} total={datos.ordenes.length} />
          )}
        </div>

        <div className="card card-hover p-5">
          <TituloPanel
            titulo="Próximas citas"
            subtitulo="Agenda del taller"
            to="/citas"
            navigate={navigate}
          />
          {citasProximas.length === 0 ? (
            <EmptyState
              icono={Calendar}
              mensaje="No hay citas próximas"
              sugerencia="Agenda una cita para organizar la carga de trabajo."
              accionLabel="Agendar cita"
              accionClick={() => navigate('/citas')}
            />
          ) : (
            <ul className="space-y-2">
              {citasProximas.map((cita) => {
                const fecha = new Date(`${cita.fecha}T00:00:00`);
                return (
                  <li
                    key={cita.id}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-base-bg/40 px-3 py-2.5 transition-colors hover:border-accent/30 hover:bg-surface-hover"
                  >
                    <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-surface-hover">
                      <span className="font-display text-sm font-bold leading-none text-text-primary">
                        {fecha.getDate()}
                      </span>
                      <span className="text-[9px] uppercase tracking-wide text-text-secondary">
                        {fecha.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">
                        {cita.clienteNombre ?? 'Cliente'}
                      </p>
                      <p className="truncate text-xs text-text-secondary">
                        {cita.vehiculoPlaca ?? 'Sin vehículo'} · {cita.hora?.slice(0, 5)}
                      </p>
                    </div>
                    <Badge valor={cita.estado} />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card card-hover p-5">
          <TituloPanel
            titulo="Alertas de inventario"
            subtitulo="Repuestos en el mínimo"
            to="/repuestos"
            navigate={navigate}
          />
          {alertasStock.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success-glow text-success">
                <Package size={22} />
              </div>
              <p className="text-sm font-medium text-text-primary">Inventario al día</p>
              <p className="mt-1 text-xs text-text-secondary">
                Ningún repuesto está por debajo del mínimo.
              </p>
            </div>
          ) : (
            <>
              <ul className="space-y-2">
                {alertasStock.slice(0, 4).map((repuesto) => (
                  <li
                    key={repuesto.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-base-bg/40 px-3 py-2.5"
                  >
                    <AlertTriangle
                      size={15}
                      className={`shrink-0 ${
                        repuesto.stock === 0 ? 'text-danger' : 'text-warning'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-text-primary">{repuesto.nombre}</p>
                      <p className="text-xs text-text-secondary">
                        Stock actual: {repuesto.stock}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        repuesto.stock === 0
                          ? 'bg-danger-glow text-danger'
                          : 'bg-warning-glow text-warning'
                      }`}
                    >
                      {repuesto.stock === 0 ? 'Agotado' : 'Bajo'}
                    </span>
                  </li>
                ))}
              </ul>
              {alertasStock.length > 4 && (
                <p className="mt-3 text-center text-xs text-text-secondary">
                  y {alertasStock.length - 4} repuestos más por reponer
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tercera fila */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <TituloPanel
            titulo="Órdenes recientes"
            subtitulo="Últimos ingresos al taller"
            to="/ordenes"
            navigate={navigate}
          />

          {datos.ordenes.length === 0 ? (
            <EmptyState
              icono={Wrench}
              mensaje="Aún no hay órdenes de trabajo"
              sugerencia="Crea una orden para empezar a medir el trabajo del taller."
              accionLabel="Crear orden"
              accionClick={() => navigate('/ordenes')}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-text-secondary">
                    <th className="pb-2 font-medium">ID</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Vehículo</th>
                    <th className="pb-2 font-medium">Ingreso</th>
                    <th className="pb-2 text-right font-medium">Acción</th>
                  </tr>
                </thead>
                <tbody className="text-text-primary">
                  {datos.ordenes
                    .slice(-5)
                    .reverse()
                    .map((orden) => (
                      <tr
                        key={orden.id}
                        className="border-b border-border last:border-0 hover:bg-surface-hover"
                      >
                        <td className="py-2.5 font-mono text-text-secondary">#{orden.id}</td>
                        <td className="py-2.5">
                          <Badge valor={orden.estado} />
                        </td>
                        <td className="py-2.5 font-mono text-accent">
                          {orden.vehiculoPlaca ?? '—'}
                        </td>
                        <td className="py-2.5 text-text-secondary">
                          {orden.fechaIngreso
                            ? new Date(orden.fechaIngreso).toLocaleDateString('es-CO')
                            : '—'}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => navigate('/ordenes')}
                            className="inline-flex items-center gap-1 text-sm text-steel transition-colors hover:text-accent"
                          >
                            Detalle
                            <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {facturacion && (
            <div className="card overflow-hidden">
              <div className="border-b border-border bg-gradient-to-br from-accent-glow to-transparent p-5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary">
                  <Receipt size={12} /> Facturación del mes
                </p>
                <p className="mt-1.5 font-display text-3xl font-bold text-text-primary">
                  {moneda.format(facturacion.totalMes)}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  {facturacion.cantidadMes} facturas emitidas · {facturacion.pendientes} por cobrar
                </p>
              </div>
              <div className="space-y-3 p-5">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-text-secondary">Recaudado</span>
                    <span className="font-semibold text-text-primary">
                      {facturacion.porcentaje}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-success/70 to-success transition-all duration-700"
                      style={{ width: `${facturacion.porcentaje}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-surface-hover/60 px-3 py-2">
                  <span className="text-xs text-text-secondary">Cartera pendiente</span>
                  <span className="font-mono text-sm font-semibold text-warning">
                    {moneda.format(facturacion.cartera)}
                  </span>
                </div>
                <button
                  onClick={() => navigate('/facturas')}
                  className="btn btn-ghost btn-sm w-full"
                >
                  Ver facturación
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h3 className="mb-3 font-display text-lg font-semibold tracking-wide text-text-primary">
              Resumen rápido
            </h3>
            <ul className="divide-y divide-border">
              {resumenRapido.map((fila) => (
                <li key={fila.label}>
                  <button
                    onClick={() => navigate(fila.to)}
                    className="group flex w-full items-center justify-between gap-3 py-2.5 text-left"
                  >
                    <span className="text-sm text-text-secondary transition-colors group-hover:text-text-primary">
                      {fila.label}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-display text-lg font-bold text-text-primary">
                        {fila.valor}
                      </span>
                      <ChevronRight
                        size={14}
                        className="text-text-secondary transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
