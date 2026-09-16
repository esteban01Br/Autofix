import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuario } from '../services/usuarioService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearFecha } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { nombre: '', apellido: '', correo: '', contrasena: '', telefono: '', rol: 'CLIENTE', activo: true };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
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
      const datos = await listarUsuarios({ rol: filtroRol || undefined, busqueda: busqueda || undefined });
      setUsuarios(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los usuarios'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [filtroRol]);

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setEditando(u);
    setFormulario({
      nombre: u.nombre,
      apellido: u.apellido,
      correo: u.correo,
      contrasena: '',
      telefono: u.telefono ?? '',
      rol: u.rol,
      activo: u.activo,
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
    try {
      if (editando) {
        const datos = {
          nombre: formulario.nombre.trim(),
          apellido: formulario.apellido.trim(),
          correo: formulario.correo.trim(),
          telefono: formulario.telefono || null,
          rol: formulario.rol,
          activo: formulario.activo,
        };
        if (formulario.contrasena) datos.contrasena = formulario.contrasena;
        await actualizarUsuario(editando.id, datos);
        pushToast('Usuario actualizado correctamente.');
      } else {
        await crearUsuario({
          nombre: formulario.nombre.trim(),
          apellido: formulario.apellido.trim(),
          correo: formulario.correo.trim(),
          contrasena: formulario.contrasena,
          telefono: formulario.telefono || null,
          rol: formulario.rol,
        });
        pushToast('Usuario creado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el usuario'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarUsuario(eliminarId);
      pushToast('Usuario eliminado.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el usuario'), 'error');
    }
  };

  const filtrados = usuarios.filter((u) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return `${u.nombre} ${u.apellido} ${u.correo} ${u.telefono ?? ''}`
      .toLowerCase()
      .includes(texto);
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Usuarios" subtitulo={`${usuarios.length} usuarios del sistema`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo usuario
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono..."
            className="input pl-9"
          />
        </div>
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)} className="input sm:w-44">
          <option value="">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="MECANICO">Mecánico</option>
          <option value="CLIENTE">Cliente</option>
        </select>
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icono={Users}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay usuarios registrados.'}
            accionLabel="Crear usuario"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">ID</th>
                  <th className="py-3 px-4 font-medium">Nombre</th>
                  <th className="py-3 px-4 font-medium">Correo</th>
                  <th className="py-3 px-4 font-medium">Teléfono</th>
                  <th className="py-3 px-4 font-medium">Rol</th>
                  <th className="py-3 px-4 font-medium text-center">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-text-secondary">#{u.id}</td>
                    <td className="py-3 px-4 font-medium">{u.nombre} {u.apellido}</td>
                    <td className="py-3 px-4 text-text-secondary">{u.correo}</td>
                    <td className="py-3 px-4 font-mono">{u.telefono ?? '—'}</td>
                    <td className="py-3 px-4"><Badge valor={u.rol} /></td>
                    <td className="py-3 px-4 text-center"><Badge valor={String(u.activo)} /></td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(u)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(u.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? `Editar usuario · ${editando.correo}` : 'Nuevo usuario'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <label className="label">{editando ? 'Nueva contraseña' : 'Contraseña *'}</label>
              <input name="contrasena" type="password" value={formulario.contrasena} onChange={manejarCambio} className="input" required={!editando} minLength={8} placeholder="Mínimo 8 caracteres" />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input name="telefono" value={formulario.telefono} onChange={manejarCambio} className="input" maxLength={20} />
            </div>
            <div>
              <label className="label">Rol *</label>
              <select name="rol" value={formulario.rol} onChange={manejarCambio} className="input">
                <option value="CLIENTE">Cliente</option>
                <option value="MECANICO">Mecánico</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formulario.activo}
                  onChange={manejarCambio}
                  className="w-4 h-4 accent-accent"
                />
                Usuario activo
              </label>
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar usuario"
        mensaje="No se puede eliminar si el usuario está asociado a un cliente o mecánico."
      />
    </div>
  );
}