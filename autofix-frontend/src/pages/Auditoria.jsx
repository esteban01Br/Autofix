import { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import { listarAuditoria } from '../services/auditoriaService';
import { extraerMensajeError, formatearFecha } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const ACCIONES_COLORES = {
  CREAR_CLIENTE: 'bg-success/10 text-success',
  CREAR_REPUESTO: 'bg-success/10 text-success',
  CREAR_USUARIO: 'bg-success/10 text-success',
  INVITAR_EMPLEADO: 'bg-accent/10 text-accent',
  CREAR_ORDEN: 'bg-steel/10 text-steel',
  FACTURAR: 'bg-success/10 text-success',
  ELIMINAR: 'bg-danger/10 text-danger',
  CAMBIO_ESTADO: 'bg-warning/10 text-warning',
};

export default function Auditoria() {
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarAuditoria({ limit: 100 });
      setRegistros(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cargar la auditoría'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = registros.filter((r) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (r.accion ?? '').toLowerCase().includes(texto) ||
      (r.entidad ?? '').toLowerCase().includes(texto) ||
      (r.detalle ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Auditoría"
        subtitulo="Registro de acciones relevantes"
      />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por acción, entidad o detalle..."
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icono={ShieldCheck}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'Aún no hay registros de auditoría.'}
          />
        ) : (
          <div className="divide-y divide-border">
            {filtrados.map((r) => (
              <div key={r.id} className="p-4 hover:bg-surface-hover/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${ACCIONES_COLORES[r.accion] ?? 'bg-surface-hover text-text-secondary'}`}>
                        {r.accion.replace(/_/g, ' ')}
                      </span>
                      {r.entidad && (
                        <span className="text-xs text-text-secondary">
                          {r.entidad}{r.entidadId ? ` #${r.entidadId}` : ''}
                        </span>
                      )}
                    </div>
                    {r.detalle && (
                      <p className="text-sm text-text-primary">{r.detalle}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-secondary whitespace-nowrap">
                    {formatearFecha(r.fecha)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
