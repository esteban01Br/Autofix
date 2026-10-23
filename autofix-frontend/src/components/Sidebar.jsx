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
  X,
  Building2,
  Store,
  ShieldCheck,
  BarChart3,
  ClipboardList,
  FileText,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Badge from './Badge';

const OPERACION = ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO'];
const EQUIPO = ['ADMIN', 'GERENTE'];

/**
 * Módulos agrupados por área. El sidebar solo muestra las secciones con
 * al menos un módulo visible para el rol de la sesión.
 */
const secciones = [
  {
    titulo: 'General',
    items: [
      {
        to: '/dashboard',
        label: 'Panel',
        icon: LayoutDashboard,
        roles: ['SUPERADMIN', 'ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'BODEGUERO', 'CAJERO', 'CLIENTE'],
      },
      { to: '/empresas', label: 'Empresas', icon: Building2, roles: ['SUPERADMIN'] },
      { to: '/mi-empresa', label: 'Mi empresa', icon: Store, roles: ['ADMIN', 'GERENTE'] },
    ],
  },
  {
    titulo: 'Operación',
    items: [
      { to: '/clientes', label: 'Clientes', icon: UserCog, roles: OPERACION },
      { to: '/vehiculos', label: 'Vehículos', icon: Car, roles: [...OPERACION, 'CLIENTE'] },
      { to: '/citas', label: 'Citas', icon: Calendar, roles: [...OPERACION, 'CLIENTE'] },
      { to: '/ordenes', label: 'Órdenes', icon: Wrench, roles: OPERACION },
      { to: '/mis-ordenes', label: 'Mis órdenes', icon: Activity, roles: ['MECANICO'] },
      {
        to: '/repuestos',
        label: 'Repuestos',
        icon: Package,
        roles: ['ADMIN', 'GERENTE', 'BODEGUERO', 'MECANICO'],
      },
      {
        to: '/proveedores',
        label: 'Proveedores',
        icon: Truck,
        roles: ['ADMIN', 'GERENTE', 'BODEGUERO'],
      },
      { to: '/servicios', label: 'Servicios', icon: ClipboardList, roles: ['ADMIN', 'GERENTE', 'ASESOR'] },
      { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText, roles: ['ADMIN', 'GERENTE'] },
    ],
  },
  {
    titulo: 'Equipo',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: Users, roles: EQUIPO },
      { to: '/mecanicos', label: 'Mecánicos', icon: Activity, roles: EQUIPO },
      { to: '/productividad', label: 'Productividad', icon: BarChart3, roles: EQUIPO },
    ],
  },
  {
    titulo: 'Administración',
    items: [
      { to: '/facturas', label: 'Facturas', icon: Receipt, roles: ['ADMIN', 'GERENTE', 'CAJERO'] },
      { to: '/auditoria', label: 'Auditoría', icon: ShieldCheck, roles: EQUIPO },
    ],
  },
];

export default function Sidebar({ abierto, cerrar }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nombreUsuario = usuario?.sub?.split('@')[0] ?? 'Usuario';
  const iniciales = nombreUsuario.slice(0, 2).toUpperCase();
  const visibles = secciones
    .map((seccion) => ({
      ...seccion,
      items: seccion.items.filter((item) => item.roles.includes(usuario?.rol)),
    }))
    .filter((seccion) => seccion.items.length > 0);

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={cerrar}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-surface-glass backdrop-blur-2xl transition-transform duration-300 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Marca */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="marca-violeta flex h-10 w-10 items-center justify-center rounded-full text-white">
              <Wrench size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="font-display text-xl font-medium tracking-tight text-text-primary">
                AUTO<span className="texto-degradado">FIX</span>
              </h1>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                Gestión de taller
              </p>
            </div>
          </div>
          <button
            onClick={cerrar}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-glass-fuerte hover:text-text-primary lg:hidden"
            aria-label="Cerrar menú"
          >
            <X size={17} />
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {visibles.map((seccion) => (
            <div key={seccion.titulo}>
              <p className="mb-1.5 px-3 font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-muted/80">
                {seccion.titulo}
              </p>
              <div className="space-y-0.5">
                {seccion.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={cerrar}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 rounded-full py-2.5 pl-3.5 pr-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent-glow text-white shadow-[inset_0_1px_1px_rgba(216,236,248,0.08)]'
                          : 'text-text-secondary hover:translate-x-0.5 hover:bg-glass-fuerte hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          aria-hidden="true"
                          className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-full transition-all duration-200 ${
                            isActive ? 'bg-accent-hover' : 'bg-transparent'
                          }`}
                        />
                        <Icon
                          size={17}
                          className={`shrink-0 transition-transform duration-200 ${
                            isActive ? 'text-blueprint' : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="flex-1">{label}</span>
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full bg-accent-hover transition-opacity ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Sesión */}
        <div className="border-t border-border px-3 py-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-2xl bg-white/[0.04] px-2.5 py-2 ring-1 ring-[rgba(186,215,247,0.08)]">
            <div className="tile-icono h-8 w-8 shrink-0 text-[10px] font-semibold">
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-text-primary">{nombreUsuario}</p>
              <div className="mt-0.5">
                <Badge valor={usuario?.rol} dot={false} />
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger-glow hover:text-danger"
          >
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}
