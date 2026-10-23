import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Truck, Package } from 'lucide-react';
import {
  listarProveedores,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor,
} from '../services/proveedorService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = {
  nombre: '',
  nit: '',
  contacto: '',
  telefono: '',
  correo: '',
  direccion: '',
  activo: true,
};

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
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
      const datos = await listarProveedores();
      setProveedores(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los proveedores'), 'error');
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

  const abrirEditar = (p) => {
    setEditando(p);
    setFormulario({
      nombre: p.nombre,
      nit: p.nit ?? '',
      contacto: p.contacto ?? '',
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      direccion: p.direccion ?? '',
      activo: p.activo,
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
      nit: formulario.nit.trim() || null,
      contacto: formulario.contacto.trim() || null,
      telefono: formulario.telefono.trim() || null,
      correo: formulario.correo.trim() || null,
      direccion: formulario.direccion.trim() || null,
      activo: formulario.activo,
    };
    try {
      if (editando) {
        const actualizado = await actualizarProveedor(editando.id, payload);
        setProveedores((prev) => prev.map((p) => (p.id === actualizado.id ? actualizado : p)));
        pushToast('Proveedor actualizado.');
      } else {
        const creado = await crearProveedor(payload);
        setProveedores((prev) => [...prev, creado]);
        pushToast('Proveedor agregado al catálogo.');
      }
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el proveedor'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarProveedor(eliminarId);
      setProveedores((prev) => prev.filter((p) => p.id !== eliminarId));
      pushToast('Proveedor eliminado del catálogo.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el proveedor'), 'error');
    }
  };

  const filtrados = proveedores.filter((p) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      p.nombre.toLowerCase().includes(texto) ||
      (p.contacto ?? '').toLowerCase().includes(texto) ||
      (p.correo ?? '').toLowerCase().includes(texto) ||
      (p.nit ?? '').toLowerCase().includes(texto)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Proveedores"
        subtitulo={`${proveedores.length} proveedores de repuestos`}
      >
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo proveedor
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, contacto, correo o NIT..."
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
            icono={Truck}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'Aún no hay proveedores registrados.'}
            accionLabel="Nuevo proveedor"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Proveedor</th>
                  <th className="py-3 px-4 font-medium">NIT</th>
                  <th className="py-3 px-4 font-medium">Contacto</th>
                  <th className="py-3 px-4 font-medium">Teléfono</th>
                  <th className="py-3 px-4 font-medium">Correo</th>
                  <th className="py-3 px-4 font-medium text-center">Repuestos</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-medium">{p.nombre}</td>
                    <td className="py-3 px-4 font-mono text-text-secondary">{p.nit ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">{p.contacto ?? '—'}</td>
                    <td className="py-3 px-4 font-mono text-text-secondary">{p.telefono ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary max-w-[180px] truncate">{p.correo ?? '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-mono text-text-secondary">
                        <Package size={13} /> {p.repuestosAsociados}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge valor={p.activo} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(p)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(p.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? 'Editar proveedor' : 'Nuevo proveedor'}
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
              placeholder="Ej: Repuestos del Norte"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">NIT</label>
              <input
                name="nit"
                value={formulario.nit}
                onChange={manejarCambio}
                className="input"
                maxLength={20}
                placeholder="900123456-1"
              />
            </div>
            <div>
              <label className="label">Contacto</label>
              <input
                name="contacto"
                value={formulario.contacto}
                onChange={manejarCambio}
                className="input"
                maxLength={150}
                placeholder="Persona de contacto"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Teléfono</label>
              <input
                name="telefono"
                value={formulario.telefono}
                onChange={manejarCambio}
                className="input"
                maxLength={20}
                placeholder="3001234567"
              />
            </div>
            <div>
              <label className="label">Correo</label>
              <input
                name="correo"
                type="email"
                value={formulario.correo}
                onChange={manejarCambio}
                className="input"
                maxLength={150}
                placeholder="ventas@proveedor.com"
              />
            </div>
          </div>
          <div>
            <label className="label">Dirección</label>
            <input
              name="direccion"
              value={formulario.direccion}
              onChange={manejarCambio}
              className="input"
              maxLength={200}
              placeholder="Dirección del proveedor"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <input
              name="activo"
              type="checkbox"
              checked={formulario.activo}
              onChange={manejarCambio}
              className="accent-accent"
            />
            Proveedor activo (disponible para comprar)
          </label>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar proveedor"
        mensaje="El proveedor se eliminará del catálogo. Si tiene repuestos asociados, deberás desactivarlo en su lugar."
      />
    </div>
  );
}
