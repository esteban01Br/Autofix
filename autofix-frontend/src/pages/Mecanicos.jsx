import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Wrench } from 'lucide-react';
import { listarMecanicos, crearMecanico, actualizarMecanico, eliminarMecanico } from '../services/mecanicoService';
import { listarUsuarios, crearUsuario } from '../services/usuarioService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { especialidad: '', usuarioId: '', nuevoUsuario: false, nombre: '', apellido: '', correo: '', contrasena: '', telefono: '' };

export default function Mecanicos() {
  const [mecanicos, setMecanicos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
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
      const [datosMecanicos, datosUsuarios] = await Promise.all([
        listarMecanicos(),
        listarUsuarios(),
      ]);
      setMecanicos(datosMecanicos);
      setUsuarios(datosUsuarios);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los mecánicos'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const usuariosDisponibles = usuarios.filter(
    (u) => !mecanicos.some((m) => m.usuario?.id === u.id)
  );

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (m) => {
    setEditando(m);
    setFormulario({
      especialidad: m.especialidad ?? '',
      usuarioId: m.usuario?.id ?? '',
      nuevoUsuario: false,
      nombre: m.usuario?.nombre ?? '',
      apellido: m.usuario?.apellido ?? '',
      correo: m.usuario?.correo ?? '',
      contrasena: '',
      telefono: m.usuario?.telefono ?? '',
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
        await actualizarMecanico(editando.id, {
          usuarioId: Number(formulario.usuarioId || editando.usuario?.id),
          especialidad: formulario.especialidad || null,
        });
        pushToast('Mecánico actualizado correctamente.');
      } else {
        let usuarioId = Number(formulario.usuarioId);
        if (formulario.nuevoUsuario) {
          const nuevo = await crearUsuario({
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            correo: formulario.correo.trim(),
            contrasena: formulario.contrasena,
            telefono: formulario.telefono || null,
            rol: 'MECANICO',
          });
          usuarioId = nuevo.id;
        }
        await crearMecanico({ usuarioId, especialidad: formulario.especialidad || null });
        pushToast('Mecánico creado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el mecánico'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarMecanico(eliminarId);
      pushToast('Mecánico eliminado.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el mecánico'), 'error');
    }
  };

  const filtrados = mecanicos.filter((m) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    const nombre = `${m.usuario?.nombre ?? ''} ${m.usuario?.apellido ?? ''}`.toLowerCase();
    return (
      nombre.includes(texto) ||
      (m.usuario?.correo ?? '').toLowerCase().includes(texto) ||
      (m.especialidad ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Mecánicos" subtitulo={`${mecanicos.length} mecánicos del taller`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo mecánico
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o especialidad..."
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
            icono={Wrench}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay mecánicos registrados todavía.'}
            accionLabel="Registrar mecánico"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Nombre</th>
                  <th className="py-3 px-4 font-medium">Correo</th>
                  <th className="py-3 px-4 font-medium">Teléfono</th>
                  <th className="py-3 px-4 font-medium">Especialidad</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-medium">{m.usuario?.nombre} {m.usuario?.apellido}</td>
                    <td className="py-3 px-4 text-text-secondary">{m.usuario?.correo}</td>
                    <td className="py-3 px-4 font-mono">{m.usuario?.telefono ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="badge bg-info-glow text-info">{m.especialidad || 'General'}</span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(m)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(m.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? `Editar mecánico · ${editando.usuario?.nombre}` : 'Nuevo mecánico'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="label">Especialidad</label>
            <input name="especialidad" value={formulario.especialidad} onChange={manejarCambio} className="input" maxLength={100} placeholder="Motor, Caja, Electricidad..." />
          </div>

          {editando ? (
            <div>
              <label className="label">Usuario vinculado</label>
              <select name="usuarioId" value={formulario.usuarioId || editando.usuario?.id} onChange={manejarCambio} className="input">
                <option value={editando.usuario?.id}>{editando.usuario?.nombre} {editando.usuario?.apellido} ({editando.usuario?.correo})</option>
                {usuariosDisponibles.map((u) => (
                  <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.correo})</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between">
                <label className="label mb-0">Vincular a un usuario</label>
                <button
                  type="button"
                  onClick={() => setFormulario((f) => ({ ...f, nuevoUsuario: !f.nuevoUsuario, usuarioId: '' }))}
                  className="text-xs font-semibold text-accent hover:text-accent-hover"
                >
                  {formulario.nuevoUsuario ? 'Usar usuario existente' : 'Crear usuario nuevo'}
                </button>
              </div>

              {formulario.nuevoUsuario ? (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="label">Nombre *</label>
                    <input name="nombre" value={formulario.nombre} onChange={manejarCambio} className="input" required maxLength={100} />
                  </div>
                  <div>
                    <label className="label">Apellido *</label>
                    <input name="apellido" value={formulario.apellido} onChange={manejarCambio} className="input" required maxLength={100} />
                  </div>
                  <div className="col-span-2">
                    <label className="label">Correo *</label>
                    <input name="correo" type="email" value={formulario.correo} onChange={manejarCambio} className="input" required maxLength={150} />
                  </div>
                  <div>
                    <label className="label">Contraseña *</label>
                    <input name="contrasena" type="password" value={formulario.contrasena} onChange={manejarCambio} className="input" required minLength={8} placeholder="Mínimo 8 caracteres" />
                  </div>
                  <div>
                    <label className="label">Teléfono</label>
                    <input name="telefono" value={formulario.telefono} onChange={manejarCambio} className="input" maxLength={20} />
                  </div>
                </div>
              ) : (
                <select name="usuarioId" value={formulario.usuarioId} onChange={manejarCambio} className="input mt-3" required>
                  <option value="">Seleccionar usuario...</option>
                  {usuariosDisponibles.map((u) => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.correo})</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear mecánico'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar mecánico"
        mensaje="No se puede eliminar si tiene órdenes de trabajo asignadas."
      />
    </div>
  );
}