import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Calendar } from 'lucide-react';
import { listarCitas, crearCita, actualizarCita, cambiarEstadoCita, eliminarCita } from '../services/citaService';
import { listarVehiculos } from '../services/vehiculoService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { fecha: '', hora: '', descripcion: '', vehiculoId: '' };
const estadosCita = ['PENDIENTE', 'CONFIRMADA', 'CANCELADA', 'FINALIZADA'];

export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
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
      const [datosCitas, datosVehiculos] = await Promise.all([
        listarCitas({ estado: filtroEstado || undefined }),
        listarVehiculos(),
      ]);
      setCitas(datosCitas);
      setVehiculos(datosVehiculos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las citas'), 'error');
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

  const abrirEditar = (c) => {
    setEditando(c);
    setFormulario({
      fecha: c.fecha,
      hora: c.hora,
      descripcion: c.descripcion ?? '',
      vehiculoId: c.vehiculoId,
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
        await actualizarCita(editando.id, {
          fecha: formulario.fecha,
          hora: formulario.hora,
          descripcion: formulario.descripcion || null,
          vehiculoId: Number(formulario.vehiculoId),
        });
        pushToast('Cita actualizada correctamente.');
      } else {
        await crearCita({
          fecha: formulario.fecha,
          hora: formulario.hora,
          descripcion: formulario.descripcion || null,
          vehiculoId: Number(formulario.vehiculoId),
        });
        pushToast('Cita creada correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar la cita'));
    } finally {
      setGuardando(false);
    }
  };

  const manejarEstado = async (id, estado) => {
    try {
      const actualizada = await cambiarEstadoCita(id, estado);
      setCitas((prev) => prev.map((c) => (c.id === id ? actualizada : c)));
      pushToast(`Cita marcada como ${estado.toLowerCase()} · #${id}`);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cambiar el estado'), 'error');
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarCita(eliminarId);
      pushToast('Cita eliminada.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar la cita'), 'error');
    }
  };

  const filtrados = citas.filter((c) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      (c.vehiculoPlaca ?? '').toLowerCase().includes(texto) ||
      (c.clienteNombre ?? '').toLowerCase().includes(texto) ||
      (c.descripcion ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Citas" subtitulo={`${citas.length} citas`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nueva cita
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por placa, cliente o descripción..."
            className="input pl-9"
          />
        </div>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input sm:w-48">
          <option value="">Todos los estados</option>
          {estadosCita.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icono={Calendar}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay citas registradas todavía.'}
            accionLabel="Agendar cita"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Hora</th>
                  <th className="py-3 px-4 font-medium">Vehículo</th>
                  <th className="py-3 px-4 font-medium">Cliente</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-secondary">#{c.id}</td>
                    <td className="py-3 px-4">{c.fecha}</td>
                    <td className="py-3 px-4 font-mono">{c.hora}</td>
                    <td className="py-3 px-4 font-mono text-accent">{c.vehiculoPlaca ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.clienteNombre ?? '—'}</td>
                    <td className="py-3 px-4">
                      <select
                        value={c.estado}
                        onChange={(e) => manejarEstado(c.id, e.target.value)}
                        className="input !py-1 !px-2 text-xs w-auto"
                      >
                        {estadosCita.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(c)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(c.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? `Editar cita #${editando.id}` : 'Nueva cita'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Fecha *</label>
              <input name="fecha" type="date" value={formulario.fecha} onChange={manejarCambio} className="input" required />
            </div>
            <div>
              <label className="label">Hora *</label>
              <input name="hora" type="time" value={formulario.hora} onChange={manejarCambio} className="input" required />
            </div>
            <div className="col-span-2">
              <label className="label">Vehículo *</label>
              <select name="vehiculoId" value={formulario.vehiculoId} onChange={manejarCambio} className="input" required>
                <option value="">Seleccionar vehículo...</option>
                {vehiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.placa} · {v.marca} {v.modelo} — {v.clienteNombre || 'Sin cliente'}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Descripción</label>
              <textarea name="descripcion" value={formulario.descripcion} onChange={manejarCambio} className="input min-h-20 resize-y" maxLength={500} placeholder="Motivo de la visita..." />
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cita'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar cita"
        mensaje="¿Deseas eliminar esta cita?"
      />
    </div>
  );
}