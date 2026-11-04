import { Menu, Moon, Sun } from 'lucide-react';
import Badge from './Badge';
import BuscadorModulos from './BuscadorModulos';
import Notificaciones from './Notificaciones';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../context/ThemeContext';

const capitalizar = (texto) =>
  texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : '';

export default function Header({ titulo, alAbrirMenu }) {
  const { usuario } = useAuth();
  const { esClaro, alternarTema } = useTema();

  const nombreUsuario = usuario?.nombre
    ? `${usuario.nombre} ${usuario.apellido ?? ''}`.trim()
    : capitalizar(usuario?.sub?.split('@')[0] ?? 'Usuario');
  const iniciales = nombreUsuario
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0))
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface-glass pl-3 pr-3 backdrop-blur-xl sm:pr-4 lg:pl-8 lg:pr-8">
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={alAbrirMenu}
          aria-label="Abrir menú"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:text-text-primary lg:hidden"
        >
          <Menu size={17} />
        </button>
        <div className="min-w-0">
          <p className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted sm:block">
            AutoFix
          </p>
          <h2 className="truncate font-display text-lg font-medium tracking-tight text-text-primary sm:text-xl">
            {titulo}
          </h2>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <BuscadorModulos />

        <button
          type="button"
          onClick={alternarTema}
          aria-label={esClaro ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          title={esClaro ? 'Modo oscuro' : 'Modo claro'}
          className="group flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:border-steel-border hover:text-text-primary"
        >
          {esClaro ? (
            <Moon size={16} className="transition-transform duration-300 group-hover:-rotate-12" />
          ) : (
            <Sun size={16} className="transition-transform duration-300 group-hover:rotate-45" />
          )}
        </button>

        <Notificaciones />

        <div className="hidden items-center gap-2.5 border-l border-border pl-2.5 sm:flex sm:pl-3">
          <div className="tile-icono h-9 w-9 shrink-0 text-[11px] font-semibold">
            {iniciales || 'AF'}
          </div>
          <div className="min-w-0 leading-none">
            <p
              className="max-w-[160px] truncate text-sm font-medium leading-tight text-text-primary"
              title={nombreUsuario}
            >
              {nombreUsuario}
            </p>
            <div className="mt-1 flex">
              <Badge valor={usuario?.rol} dot={false} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
