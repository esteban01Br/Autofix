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
  Wrench as Activity,
  LogOut,
  ChevronRight,
  Building2,
  Store,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

const modulos = [
  { to: '/dashboard', label: 'Panel', icon: LayoutDashboard, roles: ['SUPERADMIN', 'ADMIN', 'MECANICO', 'CLIENTE'] },
  { to: '/empresas', label: 'Empresas', icon: Building2, roles: ['SUPERADMIN'] },
  { to: '/mi-empresa', label: 'Mi empresa', icon: Store, roles: ['ADMIN'] },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['ADMIN'] },
  { to: '/clientes', label: 'Clientes', icon: UserCog, roles: ['ADMIN', 'MECANICO'] },
  { to: '/vehiculos', label: 'Vehículos', icon: Car, roles: ['ADMIN', 'MECANICO', 'CLIENTE'] },
  { to: '/citas', label: 'Citas', icon: Calendar, roles: ['ADMIN', 'MECANICO', 'CLIENTE'] },
  { to: '/mecanicos', label: 'Mecánicos', icon: Activity, roles: ['ADMIN'] },
  { to: '/ordenes', label: 'Órdenes', icon: Wrench, roles: ['ADMIN', 'MECANICO'] },
  { to: '/repuestos', label: 'Repuestos', icon: Package, roles: ['ADMIN', 'MECANICO'] },
  { to: '/facturas', label: 'Facturas', icon: Receipt, roles: ['ADMIN', 'MECANICO', 'CLIENTE'] },
];

export default function Sidebar({ abierto, cerrar }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const visibles = modulos.filter((m) => (usuario?.rol ? m.roles.includes(usuario.rol) : false));

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={cerrar}
        />
      )}

      <aside
        className={`w-64 h-screen bg-surface border-r border-border flex flex-col fixed left-0 top-0 z-40 transition-transform duration-200 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
              AUTO<span className="text-accent">FIX</span>
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">Taller & gestión</p>
          </div>
          <button onClick={cerrar} className="lg:hidden text-text-secondary hover:text-text-primary">
            <ChevronRight size={18} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibles.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={cerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors group ${
                  isActive
                    ? 'bg-accent-glow text-accent'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span className="flex-1">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-border">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-text-primary truncate">{usuario?.correo}</p>
            <Badge valor={usuario?.rol} dot={false} />
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
    </>
  );
}