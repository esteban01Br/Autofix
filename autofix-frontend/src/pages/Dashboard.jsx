import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Calendar, Wrench, Package, ArrowRight, Plus } from 'lucide-react';
import MetricCard from '../components/MetricCard';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { obtenerVehiculos, obtenerCitas, obtenerOrdenes, obtenerRepuestos } from '../services/dashboardService';

const acciones = [
  { label: 'Nueva cita', to: '/citas', icon: Calendar },
  { label: 'Nueva orden', to: '/ordenes', icon: Wrench },
  { label: 'Nuevo vehículo', to: '/vehiculos', icon: Car },
  { label: 'Nuevo repuesto', to: '/repuestos', icon: Package },
];

export default function Dashboard() {
  const [metricas, setMetricas] = useState({ vehiculos: 0, citas: 0, ordenes: 0, repuestos: 0 });
  const [ordenesRecientes, setOrdenesRecientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const { usuario } = useAuth();
  const navigate = useNavigate();

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
        setOrdenesRecientes(ordenes.slice(-6).reverse());
      } catch {
        setError('No se pudieron cargar los datos del panel');
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-32 text-text-secondary gap-3">
        <Spinner size={22} className="text-accent" /> Cargando panel...
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-danger flex items-center gap-3 bg-danger/5 border-danger/30">
        {error}
      </div>
    );
  }

  const ahora = new Date();
  const saludo = ahora.getHours() < 12 ? 'Buenos días' : ahora.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">
            {saludo}, <span className="text-accent">{usuario?.correo?.split('@')[0]}</span>
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Resumen general del taller · {ahora.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {acciones.map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => navigate(to)}
              className="btn btn-ghost btn-sm"
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 animate-fade-in">
        <MetricCard titulo="Vehículos" valor={metricas.vehiculos} icon={Car} acento />
        <MetricCard titulo="Citas" valor={metricas.citas} icon={Calendar} />
        <MetricCard titulo="Órdenes" valor={metricas.ordenes} icon={Wrench} acento />
        <MetricCard titulo="Repuestos" valor={metricas.repuestos} icon={Package} />
      </div>

      <div className="card p-5 animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold text-text-primary">Órdenes recientes</h3>
          <button
            onClick={() => navigate('/ordenes')}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover transition-colors"
          >
            Ver todas <ArrowRight size={14} />
          </button>
        </div>

        {ordenesRecientes.length === 0 ? (
          <EmptyState
            mensaje="Aún no hay órdenes de trabajo registradas."
            accionLabel="Crear orden"
            accionClick={() => navigate('/ordenes')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border">
                  <th className="pb-2 font-medium">ID</th>
                  <th className="pb-2 font-medium">Estado</th>
                  <th className="pb-2 font-medium">Vehículo</th>
                  <th className="pb-2 font-medium">Ingreso</th>
                  <th className="pb-2 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {ordenesRecientes.map((orden) => (
                  <tr key={orden.id} className="border-b border-border last:border-0 hover:bg-surface-hover transition-colors">
                    <td className="py-2.5 font-mono text-text-secondary">#{orden.id}</td>
                    <td className="py-2.5"><Badge valor={orden.estado} /></td>
                    <td className="py-2.5 font-mono text-accent">{orden.vehiculoPlaca ?? '—'}</td>
                    <td className="py-2.5 text-text-secondary">
                      {orden.fechaIngreso ? new Date(orden.fechaIngreso).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => navigate('/ordenes')}
                        className="text-sm text-steel hover:text-accent transition-colors inline-flex items-center gap-1"
                      >
                        <Plus size={14} /> Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}