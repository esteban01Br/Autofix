import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Search, FileText, Send, Check, X, RefreshCw } from 'lucide-react';
import {
  listarCotizaciones,
  crearCotizacion,
  cambiarEstadoCotizacion,
  convertirAOrden,
  eliminarCotizacion,
} from '../services/cotizacionService';
import { listarVehiculos } from '../services/vehiculoService';
import { listarRepuestos } from '../services/repuestoService';
import { listarServicios } from '../services/servicioService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearFechaHora, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const IVA_DEFECTO = 0.19;

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const { pushToast } = useToast();

  // Modal de creación
  const [modalAbierto, setModalAbierto] = useState(false);
  const [vehiculos, setVehiculos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [vehiculoId, setVehiculoId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [validezDias, setValidezDias] = useState(15);
  const [lineas, setLineas] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const [detalleCot, setDetalleCot] = useState(null);
  const [eliminarId, setEliminarId] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarCotizaciones();
      setCotizaciones(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las cotizaciones'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirModal = async () => {
    setModalAbierto(true);
    setVehiculoId('');
    setObservaciones('');
    setValidezDias(15);
    setLineas([{ tipo: 'repuesto', fuenteId: '', concepto: '', precio: '', cantidad: 1 }]);
    setErrorForm('');
    setCargandoCatalogos(true);
    try {
      const [v, r, s] = await Promise.all([
        listarVehiculos(),
        listarRepuestos(),
        listarServicios(),
      ]);
      setVehiculos(v);
      setRepuestos(r);
      setServicios(s);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los catálogos'), 'error');
    } finally {
      setCargandoCatalogos(false);
    }
  };

  const actualizarLinea = (indice, cambios) => {
    setLineas((prev) => prev.map((l, i) => (i === indice ? { ...l, ...cambios } : l)));
  };

  const quitarLinea = (indice) => {
    setLineas((prev) => prev.filter((_, i) => i !== indice));
  };

  const agregarLinea = () => {
    setLineas((prev) => [...prev, { tipo: 'repuesto', fuenteId: '', concepto: '', precio: '', cantidad: 1 }]);
  };

  // Precio de la línea según el catálogo seleccionado.
  const precioLinea = (linea) => {
    if (linea.tipo === 'repuesto') {
      const r = repuestos.find((x) => x.id === Number(linea.fuenteId));
      return r ? Number(r.precio) : 0;
    }
    if (linea.tipo === 'servicio') {
      const s = servicios.find((x) => x.id === Number(linea.fuenteId));
      return s ? Number(s.precio) : 0;
    }
    return Number(linea.precio) || 0;
  };

  const subtotalPrevio = useMemo(
    () => lineas.reduce((acc, l) => acc + precioLinea(l) * (Number(l.cantidad) || 0), 0),
    [lineas, repuestos, servicios],
  );

  const totalPrevio = subtotalPrevio * (1 + IVA_DEFECTO);

  const guardar = async (e) => {
    e.preventDefault();
    // Construir el payload de líneas validando que cada una esté completa.
    const detalles = [];
    for (const l of lineas) {
      if (l.tipo === 'repuesto') {
        if (!l.fuenteId) return setErrorForm('Selecciona un repuesto en cada línea.');
        detalles.push({ repuestoId: Number(l.fuenteId), cantidad: Number(l.cantidad) });
      } else if (l.tipo === 'servicio') {
        if (!l.fuenteId) return setErrorForm('Selecciona un servicio en cada línea.');
        detalles.push({ servicioId: Number(l.fuenteId), cantidad: Number(l.cantidad) });
      } else {
        if (!l.concepto.trim()) return setErrorForm('Escribe el concepto en cada línea libre.');
        if (!(Number(l.precio) > 0)) return setErrorForm('Indica un precio en cada concepto libre.');
        detalles.push({
          concepto: l.concepto.trim(),
          precioUnitario: Number(l.precio).toFixed(2),
          cantidad: Number(l.cantidad),
        });
      }
    }
    if (detalles.length === 0) return setErrorForm('Agrega al menos una línea a la cotización.');

    setGuardando(true);
    setErrorForm('');
    try {
      const payload = {
        detalles,
        validezDias: Number(validezDias),
      };
      if (vehiculoId) payload.vehiculoId = Number(vehiculoId);
      if (observaciones.trim()) payload.observaciones = observaciones.trim();
      const creada = await crearCotizacion(payload);
      setModalAbierto(false);
      setCotizaciones((prev) => [creada, ...prev]);
      pushToast(`Cotización ${creada.numero} creada por ${formatearMoneda(creada.total)}.`);
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo crear la cotización'));
    } finally {
      setGuardando(false);
    }
  };

  const transicionar = async (cot, estado) => {
    setProcesandoId(cot.id);
    try {
      const actualizada = await cambiarEstadoCotizacion(cot.id, estado);
      setCotizaciones((prev) => prev.map((c) => (c.id === actualizada.id ? actualizada : c)));
      pushToast(`Cotización ${cot.numero} → ${estado}.`);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cambiar el estado'), 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const convertir = async (cot) => {
    setProcesandoId(cot.id);
    try {
      const orden = await convertirAOrden(cot.id);
      pushToast(`Cotización ${cot.numero} convertida en orden #${orden.id}.`);
      await cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo convertir la cotización'), 'error');
    } finally {
      setProcesandoId(null);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarCotizacion(eliminarId);
      setCotizaciones((prev) => prev.filter((c) => c.id !== eliminarId));
      pushToast('Cotización eliminada.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar la cotización'), 'error');
    }
  };

  const filtradas = cotizaciones.filter((c) => {
    const coincideEstado = !filtroEstado || c.estado === filtroEstado;
    if (!coincideEstado) return false;
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (c.numero ?? '').toLowerCase().includes(texto) ||
      (c.vehiculoPlaca ?? '').toLowerCase().includes(texto) ||
      (c.clienteNombre ?? '').toLowerCase().includes(texto)
    );
  });

  const totalCotizado = cotizaciones.reduce((acc, c) => acc + Number(c.total), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Cotizaciones"
        subtitulo={`${cotizaciones.length} cotizaciones · ${formatearMoneda(totalCotizado)} propuestos`}
      >
        <button onClick={abrirModal} className="btn btn-primary">
          <Plus size={16} /> Nueva cotización
        </button>
      </PageHeader>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por número, placa o cliente..."
            className="input pl-9 max-w-md"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="input w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="BORRADOR">Borrador</option>
          <option value="ENVIADA">Enviada</option>
          <option value="APROBADA">Aprobada</option>
          <option value="RECHAZADA">Rechazada</option>
          <option value="VENCIDA">Vencida</option>
        </select>
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icono={FileText}
            mensaje={busqueda || filtroEstado ? 'Sin resultados para tu búsqueda.' : 'No hay cotizaciones todavía.'}
            accionLabel="Nueva cotización"
            accionClick={abrirModal}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">No.</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Vehículo</th>
                  <th className="py-3 px-4 font-medium">Cliente</th>
                  <th className="py-3 px-4 font-medium">Líneas</th>
                  <th className="py-3 px-4 font-medium text-right">Total</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtradas.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-accent font-semibold">{c.numero}</td>
                    <td className="py-3 px-4 text-text-secondary">{formatearFechaHora(c.fecha)}</td>
                    <td className="py-3 px-4 font-mono text-accent">{c.vehiculoPlaca ?? '—'}</td>
                    <td className="py-3 px-4">{c.clienteNombre ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.detalles?.length ?? 0}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{formatearMoneda(c.total)}</td>
                    <td className="py-3 px-4"><Badge valor={c.estado} /></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => setDetalleCot(c)} className="p-1.5 text-text-secondary hover:text-info transition-colors" title="Ver detalle">
                        <FileText size={16} />
                      </button>
                      {c.estado === 'BORRADOR' && (
                        <button onClick={() => transicionar(c, 'ENVIADA')} disabled={procesandoId === c.id} className="p-1.5 text-text-secondary hover:text-info transition-colors ml-1" title="Enviar">
                          <Send size={16} />
                        </button>
                      )}
                      {c.estado === 'ENVIADA' && (
                        <>
                          <button onClick={() => transicionar(c, 'APROBADA')} disabled={procesandoId === c.id} className="p-1.5 text-text-secondary hover:text-success transition-colors ml-1" title="Aprobar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => transicionar(c, 'RECHAZADA')} disabled={procesandoId === c.id} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Rechazar">
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {c.estado === 'APROBADA' && !c.ordenTrabajoId && (
                        <button onClick={() => convertir(c)} disabled={procesandoId === c.id} className="p-1.5 text-text-secondary hover:text-success transition-colors ml-1" title="Convertir en orden">
                          <RefreshCw size={16} className={procesandoId === c.id ? 'animate-spin' : ''} />
                        </button>
                      )}
                      {c.estado === 'BORRADOR' && (
                        <button onClick={() => setEliminarId(c.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de creación */}
      <Modal
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo="Nueva cotización"
        tamanio="max-w-3xl"
      >
        {cargandoCatalogos ? (
          <div className="flex items-center justify-center gap-3 py-16 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando catálogos...
          </div>
        ) : (
          <form onSubmit={guardar} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label">Vehículo (opcional)</label>
                <select value={vehiculoId} onChange={(e) => setVehiculoId(e.target.value)} className="input">
                  <option value="">Sin vehículo</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.placa} · {v.marca} {v.modelo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Vigencia (días)</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={validezDias}
                  onChange={(e) => setValidezDias(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Observaciones</label>
                <input
                  type="text"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Notas para el cliente"
                  className="input"
                  maxLength={1000}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="label mb-0">Líneas de la cotización</label>
                <button type="button" onClick={agregarLinea} className="btn btn-ghost text-xs">
                  <Plus size={14} /> Agregar línea
                </button>
              </div>
              <div className="space-y-2">
                {lineas.map((linea, i) => (
                  <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-xl bg-surface-hover/40 p-2">
                    <select
                      value={linea.tipo}
                      onChange={(e) => actualizarLinea(i, { tipo: e.target.value, fuenteId: '', precio: '' })}
                      className="input col-span-3"
                    >
                      <option value="repuesto">Repuesto</option>
                      <option value="servicio">Servicio</option>
                      <option value="concepto">Concepto libre</option>
                    </select>

                    {linea.tipo === 'repuesto' && (
                      <select
                        value={linea.fuenteId}
                        onChange={(e) => actualizarLinea(i, { fuenteId: e.target.value })}
                        className="input col-span-5"
                        required
                      >
                        <option value="">Seleccionar repuesto...</option>
                        {repuestos.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.nombre} · {formatearMoneda(r.precio)}
                          </option>
                        ))}
                      </select>
                    )}
                    {linea.tipo === 'servicio' && (
                      <select
                        value={linea.fuenteId}
                        onChange={(e) => actualizarLinea(i, { fuenteId: e.target.value })}
                        className="input col-span-5"
                        required
                      >
                        <option value="">Seleccionar servicio...</option>
                        {servicios.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.nombre} · {formatearMoneda(s.precio)}
                          </option>
                        ))}
                      </select>
                    )}
                    {linea.tipo === 'concepto' && (
                      <>
                        <input
                          type="text"
                          value={linea.concepto}
                          onChange={(e) => actualizarLinea(i, { concepto: e.target.value })}
                          placeholder="Descripción"
                          className="input col-span-3"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={linea.precio}
                          onChange={(e) => actualizarLinea(i, { precio: e.target.value })}
                          placeholder="Precio"
                          className="input col-span-2"
                          required
                        />
                      </>
                    )}

                    <input
                      type="number"
                      min="1"
                      value={linea.cantidad}
                      onChange={(e) => actualizarLinea(i, { cantidad: e.target.value })}
                      className="input col-span-1 text-center"
                      required
                    />
                    <span className="col-span-1 text-right font-mono text-xs">
                      {formatearMoneda(precioLinea(linea) * (Number(linea.cantidad) || 0))}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitarLinea(i)}
                      className="col-span-1 justify-self-end p-1 text-text-secondary hover:text-danger transition-colors"
                      title="Quitar línea"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-surface-hover/40 px-4 py-3 text-sm">
              <span className="text-text-secondary">
                Subtotal <span className="font-mono text-text-primary">{formatearMoneda(subtotalPrevio)}</span>
                <span className="mx-2 text-muted">·</span>
                IVA (19%) <span className="font-mono text-text-primary">{formatearMoneda(subtotalPrevio * IVA_DEFECTO)}</span>
              </span>
              <span className="font-display text-lg font-medium">
                Total <span className="font-mono text-accent">{formatearMoneda(totalPrevio)}</span>
              </span>
            </div>

            {errorForm && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Crear cotización'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal de detalle */}
      <Modal
        abierto={detalleCot !== null}
        onCerrar={() => setDetalleCot(null)}
        titulo={`Cotización ${detalleCot?.numero ?? ''}`}
        tamanio="max-w-xl"
      >
        {detalleCot && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              <Badge valor={detalleCot.estado} />
              <span>{formatearFechaHora(detalleCot.fecha)}</span>
              {detalleCot.vehiculoPlaca && <span className="font-mono text-accent">{detalleCot.vehiculoPlaca}</span>}
              {detalleCot.clienteNombre && <span>{detalleCot.clienteNombre}</span>}
              <span>Vigencia: {detalleCot.validezDias} días</span>
            </div>

            {detalleCot.observaciones && (
              <p className="text-sm text-text-secondary">{detalleCot.observaciones}</p>
            )}

            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                    <th className="py-2 px-3 font-medium">Descripción</th>
                    <th className="py-2 px-3 font-medium text-center">Cant.</th>
                    <th className="py-2 px-3 font-medium text-right">P. Unit.</th>
                    <th className="py-2 px-3 font-medium text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="text-text-primary">
                  {detalleCot.detalles?.map((d) => (
                    <tr key={d.id} className="border-b border-border last:border-0">
                      <td className="py-2 px-3">{d.descripcion}</td>
                      <td className="py-2 px-3 text-center font-mono">{d.cantidad}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatearMoneda(d.precioUnitario)}</td>
                      <td className="py-2 px-3 text-right font-mono">{formatearMoneda(d.subtotalLinea)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono">{formatearMoneda(detalleCot.subtotal)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>IVA</span>
                <span className="font-mono">{formatearMoneda(detalleCot.iva)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-1 font-display text-base">
                <span>Total</span>
                <span className="font-mono text-accent">{formatearMoneda(detalleCot.total)}</span>
              </div>
            </div>

            {detalleCot.ordenTrabajoId && (
              <p className="text-sm text-success">
                Convertida en la orden de trabajo #{detalleCot.ordenTrabajoId}.
              </p>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar cotización"
        mensaje="Se eliminará la cotización en borrador. Esta acción no se puede deshacer."
      />
    </div>
  );
}
