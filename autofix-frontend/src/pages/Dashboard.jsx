import { useEffect, useState } from 'react';
import { Car, Calendar, Wrench, Package } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import {
  obtenerVehiculos,
  obtenerCitas,
  obtenerOrdenes,
  obtenerRepuestos,
} from '../services/dashboardService';

export default function Dashboard() {
  const [metricas, setMetricas] = useState({
    vehiculos: 0,
    citas: 0,
    ordenes: 0,
    repuestos: 0,
  });
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [vehiculos, citas, ordenes, repuestos] = await Promise.all([
          obtenerVehiculos(),
          obtenerCitas(),
          obtenerOrdenes(),
          obtenerRepuestos(),
        ]);

        setMetricas({
          vehiculos: vehiculos.length,
          citas: citas.length,
          ordenes: ordenes.length,
          repuestos: repuestos.length,
        });

        setOrdenesRecientes(ordenes.slice(-5).reverse());
      } catch (err) {
        setError('No se pudieron cargar los datos del panel');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  if (cargando) {
    return <p className="text-text-secondary">Cargando panel...</p>;
  }

  if (error) {
    return <p className="text-danger">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard titulo="Vehículos" valor={metricas.vehiculos} icon={Car} acento />
        <MetricCard titulo="Citas" valor={metricas.citas} icon={Calendar} />
        <MetricCard titulo="Órdenes" valor={metricas.ordenes} icon={Wrench} acento />
        <MetricCard titulo="Repuestos" valor={metricas.repuestos} icon={Package} />
      </div>

      <div className="bg-surface border border-border rounded-lg p-5">
        <h3 className="font-display text-lg font-semibold text-text-primary mb-4">
          Órdenes recientes
        </h3>

        {ordenesRecientes.length === 0 ? (
          <p className="text-text-secondary text-sm">No hay órdenes registradas todavía.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-text-secondary border-b border-border">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Estado</th>
                <th className="pb-2 font-medium">Vehículo</th>
                <th className="pb-2 font-medium">Ingreso</th>
              </tr>
            </thead>
            <tbody className="font-mono text-text-primary">
              {ordenesRecientes.map((orden) => (
                <tr key={orden.id} className="border-b border-border last:border-0">
                  <td className="py-2.5">#{orden.id}</td>
                  <td className="py-2.5">
                    <span className="bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-medium">
                      {orden.estado}
                    </span>
                  </td>
                  <td className="py-2.5">{orden.vehiculoPlaca ?? '—'}</td>
                  <td className="py-2.5">{orden.fechaIngreso?.slice(0, 10) ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}