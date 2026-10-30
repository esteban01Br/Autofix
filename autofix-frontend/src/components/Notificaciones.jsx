import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CalendarClock,
  CheckCheck,
  CircleAlert,
  Package,
  Receipt,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { todosLosModulos } from '../lib/modulos';
import {
  obtenerCitas,
  obtenerFacturas,
  obtenerOrdenes,
  obtenerRepuestos,
} from '../services/dashboardService';

const CLAVE_LEIDAS = 'autofix_notificaciones_leidas';

const leerLeidas = () => {
  try {
    const datos = JSON.parse(window.localStorage.getItem(CLAVE_LEIDAS) || '[]');
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
};

const guardarLeidas = (ids) => {
  window.localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(ids.slice(-300)));
};

const fechaCita = (cita) => new Date(`${cita.fecha}T${cita.hora || '00:00:00'}`);

const formatoMoneda = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export default function Notificaciones() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [leidas, setLeidas] = useState(leerLeidas);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(true);
  const contenedorRef = useRef(null);

  const puedeVer = useCallback(
    (ruta) => todosLosModulos(usuario?.rol).some((modulo) => modulo.to === ruta),
    [usuario?.rol],
  );

  const cargar = useCallback(async () => {
    const [citas, ordenes, repuestos, facturas] = await Promise.allSettled([
      puedeVer('/citas') ? obtenerCitas() : Promise.resolve([]),
      puedeVer('/ordenes') ? obtenerOrdenes() : Promise.resolve([]),
      puedeVer('/repuestos') ? obtenerRepuestos() : Promise.resolve([]),
      puedeVer('/facturas') ? obtenerFacturas() : Promise.resolve([]),
    ]);
    const valor = (resultado) => (resultado.status === 'fulfilled' ? resultado.value : []);
    const lista = [];

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);

    valor(citas).forEach((cita) => {
      if (!['PENDIENTE', 'CONFIRMADA'].includes(cita.estado)) return;
      const fecha = fechaCita(cita);
      if (fecha < hoy || fecha >= manana) return;
      lista.push({
        id: `cita-${cita.id}`,
        tipo: 'info',
        titulo: 'Cita para hoy',
        detalle: `${cita.clienteNombre ?? 'Cliente'} · ${cita.hora?.slice(0, 5)} · ${cita.vehiculoPlaca ?? 'sin vehículo'}`,
        to: '/citas',
        icono: CalendarClock,
      });
    });

    valor(ordenes).forEach((orden) => {
      if (orden.estado !== 'ESPERANDO_REPUESTOS') return;
      lista.push({
        id: `orden-${orden.id}`,
        tipo: 'warning',
        titulo: `Orden #${orden.id} esperando repuestos`,
        detalle: `${orden.vehiculoPlaca ?? 'Vehículo'} · ${orden.mecanico?.nombreCompleto ?? 'Sin mecánico asignado'}`,
        to: '/ordenes',
        icono: Wrench,
      });
    });

    valor(repuestos)
      .filter((repuesto) => {
        const minimo = repuesto.stockMinimo > 0 ? repuesto.stockMinimo : 9;
        return repuesto.stock === 0 || (repuesto.stock > 0 && repuesto.stock <= minimo);
      })
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 6)
      .forEach((repuesto) => {
        lista.push({
          id: `stock-${repuesto.id}`,
          tipo: repuesto.stock === 0 ? 'danger' : 'warning',
          titulo: `Stock crítico: ${repuesto.nombre}`,
          detalle:
            repuesto.stock === 0
              ? 'Sin unidades disponibles'
              : `Quedan ${repuesto.stock} unidades (mínimo ${repuesto.stockMinimo})`,
          to: '/repuestos',
          icono: Package,
        });
      });

    valor(facturas)
      .filter((factura) => factura.estadoPago !== 'PAGADA')
      .slice(0, 6)
      .forEach((factura) => {
        lista.push({
          id: `factura-${factura.id}`,
          tipo: 'info',
          titulo: `Factura ${factura.numero} por cobrar`,
          detalle: `Saldo ${formatoMoneda.format(Number(factura.saldo || 0))} · ${factura.clienteNombre ?? 'Cliente'}`,
          to: '/facturas',
          icono: Receipt,
        });
      });

    setItems(lista);
    setCargando(false);
  }, [puedeVer]);

  useEffect(() => {
    cargar();
    const intervalo = setInterval(cargar, 90_000);
    return () => clearInterval(intervalo);
  }, [cargar]);

  useEffect(() => {
    if (!abierto) return undefined;
    cargar();
    const alClicFuera = (evento) => {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    };
    const alEscape = (evento) => {
      if (evento.key === 'Escape') setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    document.addEventListener('keydown', alEscape);
    return () => {
      document.removeEventListener('mousedown', alClicFuera);
      document.removeEventListener('keydown', alEscape);
    };
  }, [abierto, cargar]);

  const noLeidas = useMemo(
    () => items.filter((item) => !leidas.includes(item.id)),
    [items, leidas],
  );

  const marcarTodas = () => {
    const nuevas = Array.from(new Set([...leidas, ...items.map((item) => item.id)]));
    setLeidas(nuevas);
    guardarLeidas(nuevas);
  };

  const abrirNotificacion = (item) => {
    if (!leidas.includes(item.id)) {
      const nuevas = [...leidas, item.id];
      setLeidas(nuevas);
      guardarLeidas(nuevas);
    }
    setAbierto(false);
    navigate(item.to);
  };

  const colorIcono = {
    danger: 'border-danger/40 bg-danger/10 text-danger',
    warning: 'border-warning/40 bg-warning/10 text-warning',
    info: 'border-border bg-surface text-text-secondary',
  };

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-label={`Notificaciones${noLeidas.length ? `: ${noLeidas.length} sin leer` : ''}`}
        aria-expanded={abierto}
        className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
          abierto
            ? 'border-accent/50 bg-accent-glow text-accent'
            : 'border-border bg-surface text-text-secondary hover:text-text-primary'
        }`}
      >
        <Bell size={16} className={noLeidas.length ? 'animate-pulse-subtle' : ''} />
        {noLeidas.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#171717] ring-2 ring-surface">
            {noLeidas.length > 9 ? '9+' : noLeidas.length}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-2 top-16 z-[55] overflow-hidden rounded-[10px] border border-border bg-surface/95 shadow-2xl shadow-black/30 backdrop-blur-xl animate-slide-down sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+8px)] sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <p className="text-sm font-medium text-text-primary">Notificaciones</p>
              <p className="text-[11px] text-muted">
                {noLeidas.length > 0
                  ? `${noLeidas.length} novedad${noLeidas.length === 1 ? '' : 'es'} sin leer`
                  : 'Todo al día'}
              </p>
            </div>
            {noLeidas.length > 0 && (
              <button
                type="button"
                onClick={marcarTodas}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted transition-colors hover:text-accent"
              >
                <CheckCheck size={13} /> Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-[62vh] overflow-y-auto">
            {cargando ? (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((indice) => (
                  <div key={indice} className="skeleton h-14 w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-10 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-muted">
                  <BellOff size={20} />
                </span>
                <p className="text-sm font-medium text-text-primary">Sin novedades</p>
                <p className="mt-1 text-xs text-muted">
                  Aquí verás alertas de stock, citas, órdenes y cobros.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => {
                  const Icono = item.icono;
                  const sinLeer = !leidas.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => abrirNotificacion(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover ${
                          sinLeer ? 'bg-accent-glow' : ''
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${colorIcono[item.tipo] || colorIcono.info}`}
                        >
                          <Icono size={15} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-medium text-text-primary">
                              {item.titulo}
                            </span>
                            {sinLeer && (
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            )}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-muted">
                            {item.detalle}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-muted">
                <CircleAlert size={11} /> Actualizado ahora
              </span>
              <button
                type="button"
                onClick={() => {
                  setAbierto(false);
                  navigate('/dashboard');
                }}
                className="text-[11px] font-medium text-muted transition-colors hover:text-accent"
              >
                Ir al panel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
