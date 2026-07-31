import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { listarClientes, eliminarCliente } from '../services/clienteService';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarClientes();
      setClientes(data);
    } catch (err) {
      setError('No se pudieron cargar los clientes');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await eliminarCliente(id);
      cargar();
    } catch (err) {
      alert('No se pudo eliminar el cliente');
    }
  };

  if (cargando) return <p className="text-text-secondary">Cargando clientes...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Clientes ({clientes.length})
        </h3>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-base-bg text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          <Plus size={16} />
          Nuevo cliente
        </button>
      </div>

      {clientes.length === 0 ? (
        <p className="text-text-secondary text-sm">No hay clientes registrados todavía.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="pb-2 font-medium">Nombre</th>
              <th className="pb-2 font-medium">Correo</th>
              <th className="pb-2 font-medium">Dirección</th>
              <th className="pb-2 font-medium">Vehículos</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {clientes.map((c) => (
              <tr key={c.id} className="border-b border-border last:border-0">
                <td className="py-2.5">{c.usuario?.nombre} {c.usuario?.apellido}</td>
                <td className="py-2.5 text-text-secondary">{c.usuario?.correo}</td>
                <td className="py-2.5">{c.direccion}</td>
                <td className="py-2.5 font-mono">{c.vehiculos?.length ?? '—'}</td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => handleEliminar(c.id)}
                    className="text-text-secondary hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}