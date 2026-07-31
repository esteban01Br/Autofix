import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Car,
  Calendar,
  Wrench,
  Package,
  Receipt,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const modulos = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { to: '/usuarios', label: 'Usuarios', icon: Users },
  { to: '/clientes', label: 'Clientes', icon: UserCog },
  { to: '/vehiculos', label: 'Vehículos', icon: Car },
  { to: '/citas', label: 'Citas', icon: Calendar },
  { to: '/ordenes', label: 'Órdenes', icon: Wrench },
  { to: '/repuestos', label: 'Repuestos', icon: Package },
  { to: '/facturas', label: 'Facturas', icon: Receipt },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0">
      <div className="px-6 py-5 border-b border-border">
        <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
          AUTO<span className="text-accent">FIX</span>
        </h1>
        <p className="text-xs text-text-secondary mt-0.5">Panel administrativo</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {modulos.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border-l-2 border-accent'
                  : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-sm font-medium text-text-primary truncate">{usuario?.correo}</p>
          <p className="text-xs text-accent font-mono uppercase">{usuario?.rol}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-md text-sm font-medium text-text-secondary hover:bg-surface-hover hover:text-danger transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}