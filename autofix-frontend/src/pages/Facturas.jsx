import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, Receipt, Wallet, Download } from 'lucide-react';
import { listarFacturas, crearFactura, eliminarFactura, obtenerFactura, listarPagos, registrarPago, descargarFacturaPDF } from '../services/facturaService';
import { listarOrdenes } from '../services/ordenService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearFechaHora, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

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
  // Registro de pagos/abonos
  const [pagoAbierto, setPagoAbierto] = useState(false);
  const [facturaPago, setFacturaPago] = useState(null);
  const [pagoMonto, setPagoMonto] = useState('');
  const [pagoMetodo, setPagoMetodo] = useState('EFECTIVO');
  const [pagoHistorial, setPagoHistorial] = useState([]);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [pagoGuardando, setPagoGuardando] = useState(false);
  const [pagoError, setPagoError] = useState('');
  const [descargandoId, setDescargandoId] = useState(null);
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
      pushToast(`Factura ${creada.numero} generada por ${formatearMoneda(creada.total)}.`);
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

  const descargarPDF = async (f) => {
    setDescargandoId(f.id);
    try {
      await descargarFacturaPDF(f.id, f.numero);
      pushToast(`Descargando ${f.numero}.pdf.`);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo generar el PDF'), 'error');
    } finally {
      setDescargandoId(null);
    }
  };

  const abrirPago = async (f) => {
    setFacturaPago(f);
    setPagoMonto('');
    setPagoMetodo('EFECTIVO');
    setPagoError('');
    setPagoHistorial([]);
    setPagoAbierto(true);
    setCargandoPagos(true);
    try {
      const hist = await listarPagos(f.id);
      setPagoHistorial(hist);
    } catch {
      setPagoHistorial([]);
    } finally {
      setCargandoPagos(false);
    }
  };

  const guardarPago = async (e) => {
    e.preventDefault();
    if (!facturaPago) return;
    setPagoGuardando(true);
    setPagoError('');
    try {
      const pago = await registrarPago(facturaPago.id, {
        monto: pagoMonto,
        metodo: pagoMetodo,
      });
      const actualizada = await obtenerFactura(facturaPago.id);
      setFacturas((prev) => prev.map((f) => (f.id === actualizada.id ? actualizada : f)));
      setPagoHistorial((prev) => [pago, ...prev]);
      setPagoAbierto(false);
      pushToast(
        `Pago de ${formatearMoneda(pago.monto)} registrado. Factura ${actualizada.numero}: ${actualizada.estadoPago}.`
      );
    } catch (err) {
      setPagoError(extraerMensajeError(err, 'No se pudo registrar el pago'));
    } finally {
      setPagoGuardando(false);
    }
  };

  const filtradas = facturas.filter((f) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (f.numero ?? '').toLowerCase().includes(texto) ||
      (f.vehiculoPlaca ?? '').toLowerCase().includes(texto) ||
      (f.clienteNombre ?? '').toLowerCase().includes(texto)
    );
  });

  const totalIngresos = facturas.reduce((acc, f) => acc + Number(f.total), 0);
  const totalCobrado = facturas.reduce((acc, f) => acc + Number(f.montoPagado ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Facturas"
        subtitulo={`${facturas.length} facturas · ${formatearMoneda(totalCobrado)} cobrados de ${formatearMoneda(totalIngresos)}`}
      >
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
                  <th className="py-3 px-4 font-medium">Estado de pago</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtradas.map((f) => (
                  <tr key={f.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-accent font-semibold">{f.numero}</td>
                    <td className="py-3 px-4 text-text-secondary">{formatearFechaHora(f.fecha)}</td>
                    <td className="py-3 px-4 font-mono">#{f.ordenTrabajoId}</td>
                    <td className="py-3 px-4 font-mono text-accent">{f.vehiculoPlaca ?? '—'}</td>
                    <td className="py-3 px-4">{f.clienteNombre ?? '—'}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatearMoneda(f.subtotal)}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatearMoneda(f.iva)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-text-primary">{formatearMoneda(f.total)}</td>
                    <td className="py-3 px-4">
                      <Badge valor={f.estadoPago} />
                      {Number(f.saldo) > 0 && (
                        <p className="text-xs text-text-secondary mt-1">
                          Saldo: <span className="font-mono text-warning">{formatearMoneda(f.saldo)}</span>
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => descargarPDF(f)}
                        disabled={descargandoId === f.id}
                        className="p-1.5 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
                        title="Descargar PDF"
                      >
                        <Download size={16} className={descargandoId === f.id ? 'animate-pulse' : ''} />
                      </button>
                      {Number(f.saldo) > 0 && (
                        <button onClick={() => abrirPago(f)} className="p-1.5 text-text-secondary hover:text-success transition-colors ml-1" title="Registrar pago">
                          <Wallet size={16} />
                        </button>
                      )}
                      <button onClick={() => setEliminarId(f.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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

      <Modal
        abierto={pagoAbierto}
        onCerrar={() => setPagoAbierto(false)}
        titulo={`Registrar pago — ${facturaPago?.numero ?? ''}`}
        tamanio="max-w-md"
      >
        {facturaPago && (
          <form onSubmit={guardarPago} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-surface-hover/40">
                <p className="text-xs text-text-secondary">Total</p>
                <p className="font-mono font-bold text-text-primary">{formatearMoneda(facturaPago.total)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover/40">
                <p className="text-xs text-text-secondary">Pagado</p>
                <p className="font-mono font-bold text-success">{formatearMoneda(facturaPago.montoPagado)}</p>
              </div>
              <div className="p-3 rounded-lg bg-surface-hover/40">
                <p className="text-xs text-text-secondary">Saldo</p>
                <p className="font-mono font-bold text-warning">{formatearMoneda(facturaPago.saldo)}</p>
              </div>
            </div>

            <div>
              <label className="label">Monto a pagar *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={facturaPago.saldo}
                value={pagoMonto}
                onChange={(e) => setPagoMonto(e.target.value)}
                className="input"
                required
                placeholder={`Máximo ${formatearMoneda(facturaPago.saldo)}`}
              />
            </div>
            <div>
              <label className="label">Método de pago *</label>
              <select value={pagoMetodo} onChange={(e) => setPagoMetodo(e.target.value)} className="input">
                <option value="EFECTIVO">Efectivo</option>
                <option value="TARJETA">Tarjeta</option>
                <option value="TRANSFERENCIA">Transferencia</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            {cargandoPagos ? (
              <div className="flex items-center justify-center gap-2 py-3 text-text-secondary text-sm">
                <Spinner size={16} /> Cargando historial...
              </div>
            ) : pagoHistorial.length > 0 ? (
              <div>
                <p className="label">Historial de pagos</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pagoHistorial.map((p) => (
                    <div key={p.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border last:border-0">
                      <span className="text-text-secondary">
                        {formatearFechaHora(p.fecha)} · {p.metodo} · {p.usuarioNombre ?? '—'}
                      </span>
                      <span className="font-mono text-text-primary font-semibold">{formatearMoneda(p.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {pagoError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{pagoError}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPagoAbierto(false)} className="btn btn-ghost">Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={pagoGuardando}>
                {pagoGuardando ? 'Registrando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        )}
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