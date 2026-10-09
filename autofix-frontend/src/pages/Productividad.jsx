import { useEffect, useState } from 'react';
import { BarChart3, Wrench, TrendingUp } from 'lucide-react';
import { productividadMecanicos, resumenEmpresa } from '../services/reporteService';
import { extraerMensajeError, formatearMoneda } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function Productividad() {
  const [mecanicos, setMecanicos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const [prod, res] = await Promise.all([
          productividadMecanicos(),
          resumenEmpresa(),
        ]);
        setMecanicos(prod);
        setResumen(res);
      } catch (err) {
        pushToast(extraerMensajeError(err, 'No se pudieron cargar los reportes'), 'error');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-text-secondary">
        <Spinner size={22} className="text-accent" /> Cargando reportes...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Productividad"
        subtitulo="Rendimiento del equipo"
      />

      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in">
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-bold text-accent">{resumen.totalUsuarios}</p>
            <p className="text-xs text-text-secondary">Usuarios</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-bold text-accent">{resumen.totalMecanicos}</p>
            <p className="text-xs text-text-secondary">Mecánicos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-bold text-accent">{resumen.totalOrdenes}</p>
            <p className="text-xs text-text-secondary">Órdenes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="font-display text-2xl font-bold text-accent">{resumen.totalFacturas}</p>
            <p className="text-xs text-text-secondary">Facturas</p>
          </div>
        </div>
      )}

      <div className="card overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Wrench size={18} className="text-accent" />
          <h3 className="font-display text-lg font-semibold text-text-primary">
            Órdenes entregadas por mecánico
          </h3>
        </div>
        {mecanicos.length === 0 ? (
          <EmptyState
            icono={BarChart3}
            mensaje="Aún no hay órdenes entregadas registradas."
          />
        ) : (
          <div className="divide-y divide-border">
            {mecanicos.map((m, i) => (
              <div key={m.mecanicoId} className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-accent-glow flex items-center justify-center text-accent font-bold text-sm">
                      {i + 1}
                    </span>
                    <span className="font-medium text-text-primary">{m.nombre}</span>
                  </div>
                  <span className="font-mono text-accent font-semibold">
                    {m.ordenesEntregadas} órdenes
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-hover overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{
                      width: `${Math.min(100, (m.ordenesEntregadas / Math.max(...mecanicos.map((x) => x.ordenesEntregadas), 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
