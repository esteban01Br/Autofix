import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Car } from 'lucide-react';
import { listarVehiculos, crearVehiculo, actualizarVehiculo, eliminarVehiculo } from '../services/vehiculoService';
import { listarClientes } from '../services/clienteService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

const estadoInicial = { placa: '', marca: '', modelo: '', anio: '', color: '', kilometraje: '', clienteId: '' };

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
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
      const [datosVehiculos, datosClientes] = await Promise.all([
        listarVehiculos(),
        listarClientes(),
      ]);
      setVehiculos(datosVehiculos);
      setClientes(datosClientes);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los vehículos'), 'error');
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

  const abrirEditar = (v) => {
    setEditando(v);
    setFormulario({
      placa: v.placa,
      marca: v.marca,
      modelo: v.modelo,
      anio: v.anio ?? '',
      color: v.color ?? '',
      kilometraje: v.kilometraje ?? '',
      clienteId: v.clienteId,
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
    const datos = {
      placa: formulario.placa.trim().toUpperCase(),
      marca: formulario.marca.trim(),
      modelo: formulario.modelo.trim(),
      anio: formulario.anio === '' ? null : Number(formulario.anio),
      color: formulario.color || null,
      kilometraje: formulario.kilometraje === '' ? null : Number(formulario.kilometraje),
      clienteId: Number(formulario.clienteId),
    };
    try {
      if (editando) {
        await actualizarVehiculo(editando.id, datos);
        pushToast('Vehículo actualizado correctamente.');
      } else {
        await crearVehiculo(datos);
        pushToast('Vehículo creado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el vehículo'));
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarVehiculo(eliminarId);
      pushToast('Vehículo eliminado.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el vehículo'), 'error');
    }
  };

  const filtrados = vehiculos.filter((v) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return [v.placa, v.marca, v.modelo, v.color, v.clienteNombre]
      .filter(Boolean)
      .some((campo) => campo.toLowerCase().includes(texto));
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Vehículos" subtitulo={`${vehiculos.length} vehículos registrados`}>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo vehículo
        </button>
      </PageHeader>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por placa, marca, modelo o cliente..."
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
            icono={Car}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay vehículos registrados todavía.'}
            accionLabel="Registrar vehículo"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Placa</th>
                  <th className="py-3 px-4 font-medium">Marca / Modelo</th>
                  <th className="py-3 px-4 font-medium">Año</th>
                  <th className="py-3 px-4 font-medium">Color</th>
                  <th className="py-3 px-4 font-medium">Kilometraje</th>
                  <th className="py-3 px-4 font-medium">Cliente</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((v) => (
                  <tr key={v.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-accent font-semibold">{v.placa}</td>
                    <td className="py-3 px-4">{v.marca} <span className="text-text-secondary">{v.modelo}</span></td>
                    <td className="py-3 px-4 font-mono">{v.anio ?? '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        {v.color ? (
                          <>
                            <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: v.color.toLowerCase() }} />
                            {v.color}
                          </>
                        ) : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{v.kilometraje?.toLocaleString('es-CO')} km</td>
                    <td className="py-3 px-4 text-text-secondary">{v.clienteNombre}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirEditar(v)} className="p-1.5 text-text-secondary hover:text-accent transition-colors" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(v.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
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
        titulo={editando ? `Editar vehículo · ${editando.placa}` : 'Nuevo vehículo'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Placa *</label>
              <input name="placa" value={formulario.placa} onChange={manejarCambio} className="input font-mono uppercase" maxLength={10} required placeholder="ABC123" />
            </div>
            <div>
              <label className="label">Cliente *</label>
              <select name="clienteId" value={formulario.clienteId} onChange={manejarCambio} className="input" required>
                <option value="">Seleccionar...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.usuario?.nombre} {c.usuario?.apellido} — {c.usuario?.correo}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Marca *</label>
              <input name="marca" value={formulario.marca} onChange={manejarCambio} className="input" maxLength={50} required placeholder="Toyota" />
            </div>
            <div>
              <label className="label">Modelo *</label>
              <input name="modelo" value={formulario.modelo} onChange={manejarCambio} className="input" maxLength={50} required placeholder="Corolla" />
            </div>
            <div>
              <label className="label">Año</label>
              <input name="anio" type="number" min="1950" max="2100" value={formulario.anio} onChange={manejarCambio} className="input" placeholder="2020" />
            </div>
            <div>
              <label className="label">Color</label>
              <input name="color" value={formulario.color} onChange={manejarCambio} className="input" maxLength={30} placeholder="Rojo" />
            </div>
            <div>
              <label className="label">Kilometraje</label>
              <input name="kilometraje" type="number" min="0" value={formulario.kilometraje} onChange={manejarCambio} className="input" placeholder="15000" />
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
              {errorForm}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear vehículo'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar vehículo"
        mensaje="Esta acción eliminará el vehículo y sus citas asociadas. ¿Deseas continuar?"
      />
    </div>
  );
}