import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Receipt } from 'lucide-react';
import { listarFacturas, crearFactura, eliminarFactura } from '../services/facturaService';
import { listarOrdenes } from '../services/ordenService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearFechaHora, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function Facturas() {
  const [facturas, setFacturas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [cargandoOrdenes, setCargandoOrdenes] = useState(false);
  const [ordenTrabajoId, setOrdenTrabajoId] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [eliminarId, setEliminarId] = useState(null);
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarFacturas();
      setFacturas(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las facturas'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = async () => {
    setModalAbierto(true);
    setOrdenTrabajoId('');
    setErrorForm('');
    setCargandoOrdenes(true);
    try {
      const datos = await listarOrdenes();
      setOrdenes(datos.filter((o) => !o.tieneFactura));
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las órdenes'), 'error');
    } finally {
      setCargandoOrdenes(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!ordenTrabajoId) return;
    setGuardando(true);
    setErrorForm('');
    try {
      const creada = await crearFactura({ ordenTrabajoId: Number(ordenTrabajoId) });
      setModalAbierto(false);
      setFacturas((prev) => [creada, ...prev]);
      pushToast(`Factura #${creada.id} generada por ${formatearMoneda(creada.total)}.`);
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo generar la factura'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarFactura(eliminarId);
      setFacturas((prev) => prev.filter((f) => f.id !== eliminarId));
      pushToast('Factura eliminada.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar la factura'), 'error');
    }
  };

  const filtradas = facturas.filter((f) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      String(f.id).includes(texto) ||
      (f.vehiculoPlaca ?? '').toLowerCase().includes(texto) ||
      (f.clienteNombre ?? '').toLowerCase().includes(texto)
    );
  });

  const totalIngresos = facturas.reduce((acc, f) => acc + Number(f.total), 0);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Facturas" subtitulo={`${facturas.length} facturas · ${formatearMoneda(totalIngresos)} en total`}>
        <button onClick={abrirModal} className="btn btn-primary">
          <Plus size={16} /> Generar factura
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por número, placa o cliente..."
          className="input pl-9 max-w-md"
        />
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icono={Receipt}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay facturas emitidas todavía.'}
            accionLabel="Generar factura"
            accionClick={abrirModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">No.</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Orden</th>
                  <th className="py-3 px-4 font-medium">Vehículo</th>
                  <th className="py-3 px-4 font-medium">Cliente</th>
                  <th className="py-3 px-4 font-medium text-right">Subtotal</th>
                  <th className="py-3 px-4 font-medium text-right">IVA</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtradas.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-secondary">#{f.id}</td>
                    <td className="py-3 px-4 text-text-secondary">{formatearFechaHora(f.fecha)}</td>
                    <td className="py-3 px-4 font-mono">#{f.ordenTrabajoId}</td>
                    <td className="py-3 px-4 font-mono text-accent">{f.vehiculoPlaca ?? '—'}</td>
                    <td className="py-3 px-4">{f.clienteNombre ?? '—'}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatearMoneda(f.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatearMoneda(f.iva)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">{formatearMoneda(f.total)}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setEliminarId(f.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors" title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Generar factura"
        tamanio="max-w-sm"
      >
        <form onSubmit={guardar} className="space-y-4">
          {cargandoOrdenes ? (
            <div className="flex items-center justify-center gap-3 py-10 text-text-secondary">
              <Spinner size={22} className="text-accent" /> Cargando...
            </div>
          ) : ordenes.length === 0 ? (
            <div className="p-4 rounded-lg bg-surface-hover/40 text-sm text-text-secondary text-center animate-fade-in">
              No hay órdenes pendientes de facturar (todas las órdenes ya tienen factura).
            </div>
          ) : (
            <>
              <div>
                <label className="label">Orden de trabajo *</label>
                <select value={ordenTrabajoId} onChange={(e) => setOrdenTrabajoId(e.target.value)} className="input" required>
                  <option value="">Seleccionar orden...</option>
                  {ordenes.map((o) => (
                    <option key={o.id} value={o.id}>
                      #{o.id} · {o.vehiculoPlaca} · {o.estado}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-text-secondary">
                El sistema calcula automáticamente el subtotal, el IVA (19%) y el total a partir de los repuestos de la orden.
              </p>
              {errorForm && (
                <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={guardando}>
                  {guardando ? 'Generando...' : 'Generar factura'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar factura"
        mensaje="Se eliminará la factura y la orden quedará nuevamente disponible para facturar."
      />
    </div>
  );
}