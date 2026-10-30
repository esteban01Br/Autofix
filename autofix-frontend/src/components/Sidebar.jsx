import { NavLink, useNavigate } from 'react-router-dom';
import { LogOut, X, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { modulosVisibles } from '../lib/modulos';
import Badge from './Badge';

const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '';

export default function Sidebar({ abierto, cerrar }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const nombreUsuario = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido ?? ''}`.trim()
    : capitalizar(usuario?.sub?.split('@')[0] ?? 'Usuario');
  const iniciales = nombreUsuario
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase();
  const visibles = modulosVisibles(usuario?.rol);

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
            <div className="marca-violeta flex h-10 w-10 items-center justify-center rounded-full text-cloud-white">
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
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-text-primary lg:hidden"
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
                      `group relative flex items-center gap-3 overflow-hidden rounded-full py-2.5 pl-3.5 pr-3 text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-accent-glow text-text-primary'
                          : 'text-text-secondary hover:translate-x-0.5 hover:bg-surface-hover hover:text-text-primary'
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
                            isActive ? 'scale-110 text-accent' : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="flex-1">{label}</span>
                        <span
                          aria-hidden="true"
                          className={`h-1.5 w-1.5 rounded-full bg-accent transition-all duration-200 ${
                            isActive ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
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
          <div className="mb-2 flex items-center gap-2.5 rounded-2xl border border-border bg-surface px-2.5 py-2">
            <div className="tile-icono h-9 w-9 shrink-0 text-[11px] font-semibold">
              {iniciales || 'AF'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium leading-tight text-text-primary" title={nombreUsuario}>
                {nombreUsuario}
              </p>
              <div className="mt-1 flex">
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
