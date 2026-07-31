import { useEffect, useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { listarVehiculos, eliminarVehiculo } from '../services/vehiculoService';

export default function Vehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await listarVehiculos();
      setVehiculos(data);
    } catch (err) {
      setError('No se pudieron cargar los vehículos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este vehículo?')) return;
    try {
      await eliminarVehiculo(id);
      cargar();
    } catch (err) {
      alert('No se pudo eliminar el vehículo');
    }
  };

  if (cargando) return <p className="text-text-secondary">Cargando vehículos...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className="bg-surface border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold text-text-primary">
          Vehículos ({vehiculos.length})
        </h3>
        <button className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-base-bg text-sm font-semibold px-4 py-2 rounded-md transition-colors">
          <Plus size={16} />
          Nuevo vehículo
        </button>
      </div>

      {vehiculos.length === 0 ? (
        <p className="text-text-secondary text-sm">No hay vehículos registrados todavía.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-text-secondary border-b border-border">
              <th className="pb-2 font-medium">Placa</th>
              <th className="pb-2 font-medium">Marca / Modelo</th>
              <th className="pb-2 font-medium">Año</th>
              <th className="pb-2 font-medium">Color</th>
              <th className="pb-2 font-medium">Kilometraje</th>
              <th className="pb-2 font-medium">Cliente</th>
              <th className="pb-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="text-text-primary">
            {vehiculos.map((v) => (
              <tr key={v.id} className="border-b border-border last:border-0">
                <td className="py-2.5 font-mono text-accent">{v.placa}</td>
                <td className="py-2.5">{v.marca} {v.modelo}</td>
                <td className="py-2.5 font-mono">{v.anio}</td>
                <td className="py-2.5">{v.color}</td>
                <td className="py-2.5 font-mono">{v.kilometraje?.toLocaleString()} km</td>
                <td className="py-2.5">{v.clienteNombre}</td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => handleEliminar(v.id)}
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