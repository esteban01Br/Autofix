import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, ClipboardList, Clock } from 'lucide-react';
import { listarServicios, crearServicio, actualizarServicio, eliminarServicio } from '../services/servicioService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { nombre: '', descripcion: '', precio: '', duracion_minutos: '', activo: true };

export default function Servicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [eliminarId, setEliminarId] = useState(null);
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarServicios();
      setServicios(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los servicios'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (s) => {
    setEditando(s);
    setFormulario({
      nombre: s.nombre,
      descripcion: s.descripcion ?? '',
      precio: String(s.precio),
      duracion_minutos: s.duracionMinutos != null ? String(s.duracionMinutos) : '',
      activo: s.activo,
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    const payload = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      precio: Number(formulario.precio),
      duracion_minutos: formulario.duracion_minutos === '' ? null : Number(formulario.duracion_minutos),
      activo: formulario.activo,
    };
    try {
      if (editando) {
        const actualizado = await actualizarServicio(editando.id, payload);
        setServicios((prev) => prev.map((s) => (s.id === actualizado.id ? actualizado : s)));
        pushToast('Servicio actualizado.');
      } else {
        const creado = await crearServicio(payload);
        setServicios((prev) => [...prev, creado]);
        pushToast('Servicio creado en el catálogo.');
      }
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el servicio'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarServicio(eliminarId);
      setServicios((prev) => prev.filter((s) => s.id !== eliminarId));
      pushToast('Servicio eliminado del catálogo.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el servicio'), 'error');
    }
  };

  const filtrados = servicios.filter((s) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      s.nombre.toLowerCase().includes(texto) ||
      (s.descripcion ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Servicios" subtitulo={`${servicios.length} servicios y mano de obra`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo servicio
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o descripción..."
          className="input pl-9 max-w-md"
        />
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icono={ClipboardList}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'El catálogo de servicios está vacío.'}
            accionLabel="Nuevo servicio"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Servicio</th>
                  <th className="py-3 px-4 font-medium">Descripción</th>
                  <th className="py-3 px-4 font-medium text-right">Precio</th>
                  <th className="py-3 px-4 font-medium">Duración</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-medium">{s.nombre}</td>
                    <td className="py-3 px-4 text-text-secondary max-w-xs truncate">{s.descripcion ?? '—'}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-accent">{formatearMoneda(s.precio)}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {s.duracionMinutos != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={13} /> {s.duracionMinutos} min
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <Badge valor={s.activo} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(s)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(s.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? 'Editar servicio' : 'Nuevo servicio'}
        tamanio="max-w-md"
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input
              name="nombre"
              value={formulario.nombre}
              onChange={manejarCambio}
              className="input"
              required
              maxLength={150}
              placeholder="Ej: Cambio de aceite"
            />
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea
              name="descripcion"
              value={formulario.descripcion}
              onChange={manejarCambio}
              className="input"
              rows={2}
              maxLength={500}
              placeholder="Detalle del servicio o mano de obra"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Precio *</label>
              <input
                name="precio"
                type="number"
                step="0.01"
                min="0.01"
                value={formulario.precio}
                onChange={manejarCambio}
                className="input"
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="label">Duración (min)</label>
              <input
                name="duracion_minutos"
                type="number"
                min="0"
                max="1440"
                value={formulario.duracion_minutos}
                onChange={manejarCambio}
                className="input"
                placeholder="Opcional"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              name="activo"
              type="checkbox"
              checked={formulario.activo}
              onChange={manejarCambio}
              className="accent-accent"
            />
            Servicio activo (disponible para uso)
          </label>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar servicio"
        mensaje="El servicio se eliminará del catálogo de forma permanente."
      />
    </div>
  );
}
