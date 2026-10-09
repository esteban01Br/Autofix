import { useEffect, useState } from 'react';
import { Wrench, ChevronRight, Car } from 'lucide-react';
import { obtenerMisOrdenes, cambiarEstadoOrden } from '../services/ordenService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const ESTADOS_SIGUIENTES = {
  RECIBIDO: 'DIAGNOSTICO',
  DIAGNOSTICO: 'EN_REPARACION',
  EN_REPARACION: 'ESPERANDO_REPUESTOS',
  ESPERANDO_REPUESTOS: 'LISTO',
  LISTO: 'ENTREGADO',
};

const ETIQUETAS = {
  RECIBIDO: 'Recibido',
  DIAGNOSTICO: 'En diagnóstico',
  EN_REPARACION: 'En reparación',
  ESPERANDO_REPUESTOS: 'Esperando repuestos',
  LISTO: 'Listo para entregar',
  ENTREGADO: 'Entregado',
};

export default function MisOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await obtenerMisOrdenes();
      setOrdenes(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar tus órdenes'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const avanzarEstado = async (orden) => {
    const siguiente = ESTADOS_SIGUIENTES[orden.estado];
    if (!siguiente) return;
    try {
      const actualizada = await cambiarEstadoOrden(orden.id, siguiente);
      setOrdenes((prev) => prev.map((o) => (o.id === orden.id ? actualizada : o)));
      pushToast(`Orden #${orden.id} → ${ETIQUETAS[siguiente]}`);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cambiar el estado'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mis órdenes"
        subtitulo={`${ordenes.length} órdenes asignadas`}
      />

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : ordenes.length === 0 ? (
          <EmptyState
            icono={Wrench}
            mensaje="No tienes órdenes asignadas por ahora."
          />
        ) : (
          <div className="divide-y divide-border">
            {ordenes.map((o) => (
              <div key={o.id} className="p-4 sm:p-5 hover:bg-surface-hover/30 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center text-accent shrink-0">
                      <Car size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-text-primary truncate">
                        {o.vehiculoPlaca ?? 'Vehículo'}
                      </p>
                      <p className="text-xs text-text-secondary truncate">
                        #{o.id} · {o.diagnostico ?? 'Sin diagnóstico'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge valor={o.estado} />
                    {ESTADOS_SIGUIENTES[o.estado] && (
                      <button
                        onClick={() => avanzarEstado(o)}
                        className="btn btn-ghost btn-sm"
                        title={`Avanzar a: ${ETIQUETAS[ESTADOS_SIGUIENTES[o.estado]]}`}
                      >
                        Avanzar <ChevronRight size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
