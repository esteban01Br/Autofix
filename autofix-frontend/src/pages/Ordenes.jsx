import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ClipboardList, Eye, PackagePlus } from 'lucide-react';
import { listarOrdenes, crearOrden, actualizarOrden, cambiarEstadoOrden, asignarMecanicoOrden, eliminarOrden } from '../services/ordenService';
import { listarDetallesPorOrden, crearDetalle, actualizarDetalle, eliminarDetalle } from '../services/detalleService';
import { listarVehiculos } from '../services/vehiculoService';
import { listarMecanicos } from '../services/mecanicoService';
import { listarRepuestos } from '../services/repuestoService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearFechaHora, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import Badge from '../components/Badge';

const estadosOrden = ['RECIBIDO', 'DIAGNOSTICO', 'EN_REPARACION', 'ESPERANDO_REPUESTOS', 'LISTO', 'ENTREGADO'];
const estadoInicial = { vehiculoId: '', mecanicoId: '', diagnostico: '', observaciones: '' };

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [eliminarId, setEliminarId] = useState(null);

  const [detallesOrden, setDetallesOrden] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);
  const [nuevoDetalle, setNuevoDetalle] = useState({ repuestoId: '', cantidad: 1 });

  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const [datosOrdenes, datosVehiculos, datosMecanicos] = await Promise.all([
        listarOrdenes({ estado: filtroEstado || undefined }),
        listarVehiculos(),
        listarMecanicos(),
      ]);
      setOrdenes(datosOrdenes);
      setVehiculos(datosVehiculos);
      setMecanicos(datosMecanicos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las órdenes'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtroEstado]);

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (o) => {
    setEditando(o);
    setFormulario({
      vehiculoId: o.vehiculoId,
      mecanicoId: o.mecanico?.id ?? '',
      diagnostico: o.diagnostico ?? '',
      observaciones: o.observaciones ?? '',
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      if (editando) {
        await actualizarOrden(editando.id, {
          vehiculoId: Number(formulario.vehiculoId),
          mecanicoId: formulario.mecanicoId ? Number(formulario.mecanicoId) : null,
          diagnostico: formulario.diagnostico || null,
          observaciones: formulario.observaciones || null,
        });
        pushToast('Orden actualizada correctamente.');
      } else {
        await crearOrden({
          vehiculoId: Number(formulario.vehiculoId),
          mecanicoId: formulario.mecanicoId ? Number(formulario.mecanicoId) : null,
          diagnostico: formulario.diagnostico || null,
          observaciones: formulario.observaciones || null,
        });
        pushToast('Orden creada correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar la orden'));
    } finally {
      setGuardando(false);
    }
  };

  const manejarEstado = async (id, estado) => {
    try {
      await cambiarEstadoOrden(id, estado);
      pushToast(`Orden #${id} marcada como ${estado.toLowerCase()}`);
      setOrdenes((prev) => prev.map((o) => (o.id === id ? { ...o, estado } : o)));
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cambiar el estado'), 'error');
    }
  };

  const manejarMecanico = async (id, mecanicoId) => {
    try {
      const actualizada = await asignarMecanicoOrden(id, Number(mecanicoId));
      pushToast(`Mecánico asignado a la orden #${id}`);
      setOrdenes((prev) => prev.map((o) => (o.id === id ? actualizada : o)));
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo asignar el mecánico'), 'error');
    }
  };

  const abrirDetalles = async (o) => {
    setDetallesOrden(o);
    setDetalles([]);
    setCargandoDetalles(true);
    setNuevoDetalle({ repuestoId: '', cantidad: 1 });
    try {
      if (repuestos.length === 0) {
        setRepuestos(await listarRepuestos());
      }
      setDetalles(await listarDetallesPorOrden(o.id));
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los detalles'), 'error');
    } finally {
      setCargandoDetalles(false);
    }
  };

  const agregarDetalle = async (e) => {
    e.preventDefault();
    if (!nuevoDetalle.repuestoId || !nuevoDetalle.cantidad) return;
    try {
      const creado = await crearDetalle(detallesOrden.id, {
        repuestoId: Number(nuevoDetalle.repuestoId),
        cantidad: Number(nuevoDetalle.cantidad),
      });
      setDetalles((prev) => [...prev, creado]);
      setNuevoDetalle({ repuestoId: '', cantidad: 1 });
      pushToast('Repuesto agregado a la orden.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo agregar el repuesto'), 'error');
    }
  };

  const ajustarDetalle = async (d, cambios) => {
    try {
      const actualizado = await actualizarDetalle(d.id, cambios);
      setDetalles((prev) => prev.map((x) => (x.id === d.id ? actualizado : x)));
      pushToast('Detalle actualizado correctamente.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo actualizar el detalle'), 'error');
    }
  };

  const removerDetalle = async (id) => {
    try {
      await eliminarDetalle(id);
      setDetalles((prev) => prev.filter((x) => x.id !== id));
      pushToast('Repuesto retirado de la orden.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo retirar el repuesto'), 'error');
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarOrden(eliminarId);
      pushToast('Orden eliminada.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar la orden'), 'error');
    }
  };

  const filtradas = ordenes.filter((o) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (o.vehiculoPlaca ?? '').toLowerCase().includes(texto) ||
      (o.mecanico?.nombreCompleto ?? '').toLowerCase().includes(texto) ||
      (o.diagnostico ?? '').toLowerCase().includes(texto)
    );
  });

  const totalDetalles = detalles.reduce((acc, d) => acc + Number(d.subtotalLinea), 0);

  return (
    <div className="space-y-6">
      <PageHeader titulo="Órdenes de trabajo" subtitulo={`${ordenes.length} órdenes`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nueva orden
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa, mecánico o diagnóstico..."
            className="input pl-9"
          />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input sm:w-60">
          <option value="">Todos los estados</option>
          {estadosOrden.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icono={ClipboardList}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay órdenes de trabajo todavía.'}
            accionLabel="Crear orden"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Vehículo</th>
                  <th className="py-3 px-4 font-medium">Mecánico</th>
                  <th className="py-3 px-4 font-medium">Ingreso</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-center">Piezas</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtradas.map((o) => (
                  <tr key={o.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-secondary">#{o.id}</td>
                    <td className="py-3 px-4 font-mono text-accent">{o.vehiculoPlaca ?? '—'}</td>
                    <td className="py-3 px-4">
                      {o.mecanico ? (
                        <span>{o.mecanico.nombreCompleto}</span>
                      ) : (
                        <select
                          value=""
                          onChange={(e) => manejarMecanico(o.id, e.target.value)}
                          className="input !py-1 !px-2 text-xs w-36"
                        >
                          <option value="">Asignar...</option>
                          {mecanicos.map((m) => (
                            <option key={m.id} value={m.id}>{m.usuario.nombre} {m.usuario.apellido}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{formatearFechaHora(o.fechaIngreso)}</td>
                    <td className="py-3 px-4">
                      <select
                        value={o.estado}
                        onChange={(e) => manejarEstado(o.id, e.target.value)}
                        className="input !py-1 !px-2 text-xs w-44"
                      >
                        {estadosOrden.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge bg-steel/15 text-steel">{o.detalles?.length ?? 0}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirDetalles(o)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Ver repuestos">
                        <Eye size={16} />
                      </button>
                      <button onClick={() => abrirEditar(o)} className="p-1.5 text-text-secondary hover:text-accent transition-colors ml-1" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(o.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? `Editar orden #${editando.id}` : 'Nueva orden de trabajo'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Vehículo *</label>
              <select name="vehiculoId" value={formulario.vehiculoId} onChange={manejarCambio} className="input" required>
                <option value="">Seleccionar vehículo...</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} · {v.marca} {v.modelo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Mecánico</label>
              <select name="mecanicoId" value={formulario.mecanicoId} onChange={manejarCambio} className="input">
                <option value="">Sin asignar</option>
                {mecanicos.map((m) => (
                  <option key={m.id} value={m.id}>{m.usuario.nombre} {m.usuario.apellido}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Diagnóstico</label>
              <textarea name="diagnostico" value={formulario.diagnostico} onChange={manejarCambio} className="input min-h-20 resize-y" maxLength={1000} placeholder="Descripción del diagnóstico..." />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="label">Observaciones</label>
              <textarea name="observaciones" value={formulario.observaciones} onChange={manejarCambio} className="input min-h-20 resize-y" maxLength={1000} placeholder="Notas adicionales..." />
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear orden'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={detallesOrden !== null}
        onCerrar={() => setDetallesOrden(null)}
        titulo={`Repuestos · Orden #${detallesOrden?.id ?? ''}`}
        tamanio="max-w-2xl"
      >
        {cargandoDetalles ? (
          <div className="flex items-center justify-center gap-3 py-14 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={agregarDetalle} className="card bg-surface-hover/40 p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <PackagePlus size={16} className="text-accent" /> Agregar repuesto
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_6rem_auto] gap-3">
                <select
                  value={nuevoDetalle.repuestoId}
                  onChange={(e) => setNuevoDetalle((n) => ({ ...n, repuestoId: e.target.value }))}
                  className="input"
                  required
                >
                  <option value="">Seleccionar repuesto...</option>
                  {repuestos.map((r) => (
                    <option key={r.id} value={r.id} disabled={r.stock <= 0}>
                      {r.nombre} · {formatearMoneda(r.precio)} · {r.stock} disp.
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={nuevoDetalle.cantidad}
                  onChange={(e) => setNuevoDetalle((n) => ({ ...n, cantidad: e.target.value }))}
                  className="input"
                  required
                />
                <button type="submit" className="btn btn-primary">Agregar</button>
              </div>
            </form>

            {detalles.length === 0 ? (
              <EmptyState icono={PackagePlus} mensaje="Esta orden aún no tiene repuestos." />
            ) : (
              <div className="divide-y divide-border">
                {detalles.map((d) => (
                  <div key={d.id} className="flex items-center justify-between gap-4 py-3 animate-fade-in">
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary truncate">{d.repuestoNombre}</div>
                      <div className="text-xs text-text-secondary font-mono">{formatearMoneda(d.precioUnitario)} c/u</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => ajustarDetalle(d, { cantidad: d.cantidad - 1 })} className="btn btn-sm btn-ghost px-2" disabled={d.cantidad <= 1}>−</button>
                      <span className="text-sm font-mono w-8 text-center">{d.cantidad}</span>
                      <button onClick={() => ajustarDetalle(d, { cantidad: d.cantidad + 1 })} className="btn btn-sm btn-ghost px-2">+</button>
                      <span className="text-sm font-mono text-accent w-20 text-right">{formatearMoneda(d.subtotalLinea)}</span>
                      <button onClick={() => removerDetalle(d.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors" title="Quitar">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {detalles.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-sm text-text-secondary">Total repuestos</span>
                <span className="text-xl font-display font-bold text-text-primary">{formatearMoneda(totalDetalles)}</span>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar orden"
        mensaje="Se eliminará la orden y sus repuestos asociados. No se puede eliminar si tiene factura."
      />
    </div>
  );
}