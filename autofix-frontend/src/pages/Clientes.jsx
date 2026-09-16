import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { listarClientes, crearCliente, actualizarCliente, eliminarCliente } from '../services/clienteService';
import { listarUsuarios, crearUsuario } from '../services/usuarioService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { direccion: '', usuarioId: '', nuevoUsuario: false, nombre: '', apellido: '', correo: '', contrasena: '', telefono: '' };

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
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
      const [datosClientes, datosUsuarios] = await Promise.all([
        listarClientes(),
        listarUsuarios(),
      ]);
      setClientes(datosClientes);
      setUsuarios(datosUsuarios);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los clientes'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  /* Usuarios que aún no son clientes (para el selector). */
  const usuariosDisponibles = usuarios.filter(
    (u) => !clientes.some((c) => c.usuario?.id === u.id)
  );

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (c) => {
    setEditando(c);
    setFormulario({
      direccion: c.direccion ?? '',
      usuarioId: c.usuario?.id ?? '',
      nuevoUsuario: false,
      nombre: c.usuario?.nombre ?? '',
      apellido: c.usuario?.apellido ?? '',
      correo: c.usuario?.correo ?? '',
      contrasena: '',
      telefono: c.usuario?.telefono ?? '',
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
        const datos = {
          usuarioId: Number(formulario.usuarioId || editando.usuario?.id),
          direccion: formulario.direccion || null,
        };
        await actualizarCliente(editando.id, datos);
        pushToast('Cliente actualizado correctamente.');
      } else {
        let usuarioId = Number(formulario.usuarioId);
        if (formulario.nuevoUsuario) {
          const nuevo = await crearUsuario({
            nombre: formulario.nombre.trim(),
            apellido: formulario.apellido.trim(),
            correo: formulario.correo.trim(),
            contrasena: formulario.contrasena,
            telefono: formulario.telefono || null,
            rol: 'CLIENTE',
          });
          usuarioId = nuevo.id;
        }
        await crearCliente({ usuarioId, direccion: formulario.direccion || null });
        pushToast('Cliente creado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el cliente'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarCliente(eliminarId);
      pushToast('Cliente eliminado.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el cliente'), 'error');
    }
  };

  const filtrados = clientes.filter((c) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    const nombre = `${c.usuario?.nombre ?? ''} ${c.usuario?.apellido ?? ''}`.toLowerCase();
    return (
      nombre.includes(texto) ||
      (c.usuario?.correo ?? '').toLowerCase().includes(texto) ||
      (c.direccion ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Clientes" subtitulo={`${clientes.length} clientes registrados`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo cliente
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, correo o dirección..."
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
            icono={Users}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay clientes registrados todavía.'}
            accionLabel="Registrar cliente"
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
                  <th className="py-3 px-4 font-medium">Dirección</th>
                  <th className="py-3 px-4 font-medium text-center">Vehículos</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {c.usuario?.nombre} {c.usuario?.apellido}
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{c.usuario?.correo}</td>
                    <td className="py-3 px-4 font-mono">{c.usuario?.telefono ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.direccion ?? '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="badge bg-steel/15 text-steel">{c.vehiculos?.length ?? 0}</span>
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
        titulo={editando ? `Editar cliente · ${editando.usuario?.nombre}` : 'Nuevo cliente'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="label">Dirección</label>
            <input name="direccion" value={formulario.direccion} onChange={manejarCambio} className="input" maxLength={200} placeholder="Calle 10 # 20-30" />
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
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido} · <Badge valor={u.rol} dot={false} /></option>
                  ))}
                </select>
              )}
            </div>
          )}

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
              {errorForm}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar cliente"
        mensaje="Se eliminará el cliente. No se puede eliminar si tiene vehículos con órdenes de trabajo."
      />
    </div>
  );
}