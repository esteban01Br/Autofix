import { useEffect, useState } from 'react';
import { BarChart3, LayoutDashboard, Calendar, Clock, Shield, TrendingUp, Download } from 'lucide-react';
import { productividadResumenPeriodo, productividadPeriodoPDF } from '../services/reporteService';
import { extraerMensajeError } from '../lib/utils';
import { useToast } from '../context/ToastContext';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function ResumenPeriodo() {
  const [periodo, setPeriodo] = useState('diario');
  const [fecha, setFecha] = useState<Date | null>(null);
  const [resumen, setResumen] = useState(null);
  const [serie, setSerie] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pdfGenerando, setPdfGenerando] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    setFecha(new Date());
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await productividadResumenPeriodo(periodo, fecha);
      setResumen(data.resumen);
      setSerie(data.serie);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los resúmenes'), 'error');
    } finally {
      setCargando(false);
    }
  };

  const descargarPDF = async () => {
    if (!resumen) return;
    setPdfGenerando(true);
    try {
      const blob = await productividadPeriodoPDF(periodo, fecha);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resumen-productividad-${periodo}-${fecha?.toISOString().split('T')[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast('PDF de resumen descargado correctamente', 'success');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo generar el PDF'), 'error');
    } finally {
      setPdfGenerando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [periodo, fecha]);

  // Compute variacion options outside JSX to avoid nesting issues
  const variacionOptions = resumen?.variacionPct
    ? Object.entries(resumen.variacionPct).map(([clave, varPct]) => ({
        clave,
        varPct,
        signo: varPct >= 0 ? '↑' : '↓',
        absPct: Math.abs(varPct),
      }))
    : [];

  const rolesData = resumen?.roles?.map((rol) => ({
    rol: rol.rol,
    accionesPorEmpleado: rol.accionesPorEmpleado,
  })) || [];

  const serieData = serie.map((d, i) => ({
    id: i,
    fecha: d.fecha,
    ordenesCreadas: d.ordenesCreadas,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Resumen de Productividad"
        subtitulo="Reporte diario, semanal, quincenal o mensual"
      />

      {/* Selector de periodo */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setPeriodo('diario')}
          className={periodo === 'diario'
            ? 'border-b-2 border-accent text-accent'
            : 'border-b text-text-secondary'}
        >
          Diario
        </button>
        <button
          onClick={() => setPeriodo('semanal')}
          className={periodo === 'semanal'
            ? 'border-b-2 border-accent text-accent'
            : 'border-b text-text-secondary'}
        >
          Semanal
        </button>
        <button
          onClick={() => setPeriodo('quincenal')}
          className={periodo === 'quincenal'
            ? 'border-b-2 border-accent text-accent'
            : 'border-b text-text-secondary'}
        >
          Quincenal
        </button>
        <button
          onClick={() => setPeriodo('mensual')}
          className={periodo === 'mensual'
            ? 'border-b-2 border-accent text-accent'
            : 'border-b text-text-secondary'}
        >
          Mensual
        </button>
      </div>

      {/* Botón descargar PDF */}
      {resumen && !pdfGenerando ? (
        <button
          onClick={descargarPDF}
          className="mt-3 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-accent bg-accent-glow hover:bg-opacity-80 transition-colors"
          title="Descargar resumen como PDF"
        >
          <Download className="h-4 w-4" />
          Descargar PDF
        </button>
      ) : pdfGenerando && (
        <div className="mt-3 flex items-center gap-2 text-accent">
          <Spinner size={14} className="me-1" /> Generando PDF...
        </div>
      )}

      {/* Selector de fecha */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-text-primary mb-1">
          Fecha del periodo
        </label>
        <input
          type="date"
          value={fecha?.toISOString().split('T')[0] || ''}
          onChange={e => setFecha(new Date(e.target.value))}
          className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-secondary placeholder:text-text-secondary/5 focus:outline-none focus:border-accent"
        />
      </div>

      {cargando ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size={22} className="text-accent" /> Cargando resumen...
        </div>
      ) : resumen ? (
        <div className="animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-accent">{resumen.empresa.actual.ordenesCreadas}</p>
              <p className="text-xs text-text-secondary">Órdenes creadas</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-accent">{resumen.empresa.actual.ordenesEntregadas}</p>
              <p className="text-xs text-text-secondary">Órdenes entregadas</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-accent">{resumen.empresa.actual.totalFacturado}</p>
              <p className="text-xs text-text-secondary">Total facturado</p>
            </div>
            <div className="card p-4 text-center">
              <p className="font-display text-2xl font-bold text-accent">{resumen.empresa.actual.totalCobrado}</p>
              <p className="text-xs text-text-secondary">Total cobrado</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
              <Clock size={18} className="text-accent" />
              <h3 className="font-display text-lg font-semibold text-text-primary">
                Comparación con periodo anterior
              </h3>
            </div>
            {variacionOptions.length > 0 ? (
              <div className="p-4">
                {variacionOptions.map((v) => (
                  <div key={v.clave} className="flex items-center justify-between mb-2">
                    <span className="text-sm text-text-secondary">{v.clave}</span>
                    <span
                      className={v.signo === '↑' ? 'text-accent' : 'text-danger'}
                      fontWeight={600}
                    >
                      {v.signo} {v.absPct}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="p-4 text-text-secondary">No hay datos de variación</p>
            )}

            <div className="p-4">
              <h4 className="font-medium text-text-primary mb-3">Por rol</h4>
              <div className="space-y-2">
                {rolesData.map((r) => (
                  <div key={r.rol} className="flex items-center justify-between py-1">
                    <span className="text-sm text-text-primary">{r.rol}</span>
                    <span className="text-xs text-text-secondary">
                      {r.accionesPorEmpleado} acciones/empleado
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-medium text-text-primary mb-3">Serie diaria</h4>
            {serieData.length === 0 ? (
              <EmptyState
                icono={BarChart3}
                mensaje="Aún no hay datos de serie para el periodo seleccionado."
              />
            ) : (
              <div className="space-y-2">
                {serieData.map((d) => (
                  <div key={d.id} className="flex items-center justify-between py-1">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-accent font-bold text-sm">
                      {d.id + 1}
                    </span>
                    <span className="text-sm text-text-primary">{d.fecha}</span>
                    <span className="text-accent font-medium">
                      {d.ordenesCreadas} órdens
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          icono={LayoutDashboard}
          mensaje="No hay datos de productividad para el periodo y fecha seleccionados."
        />
      )}
    </div>
  );
}