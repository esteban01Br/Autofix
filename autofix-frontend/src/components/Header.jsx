import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import Badge from './Badge';
import { useAuth } from '../context/AuthContext';

export default function Header({ titulo }) {
  const [buscar, setBuscar] = useState('');
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const manejarBusqueda = (e) => {
    e.preventDefault();
    const texto = buscar.trim().toLowerCase();
    if (!texto) return;
    const rutas = [
      '/dashboard', '/usuarios', '/clientes', '/vehiculos', '/citas',
      '/mecanicos', '/ordenes', '/repuestos', '/facturas',
    ];
    // Coincidencia simple de la etiqueta con el término buscado.
    const mapa = {
      panel: '/dashboard',
      usuario: '/usuarios',
      cliente: '/clientes',
      veh: '/vehiculos',
      cita: '/citas',
      mec: '/mecanicos',
      orden: '/ordenes',
      trabajo: '/ordenes',
      repuesto: '/repuestos',
      factura: '/facturas',
      facturaci: '/facturas',
    };
    for (const clave of Object.keys(mapa)) {
      if (texto.includes(clave) || clave.includes(texto)) {
        navigate(mapa[clave]);
        setBuscar('');
        return;
      }
    }
    // Si no hay coincidencia, intentar rutas cercanas.
    const coincidencia = rutas.find((r) => r.includes(texto));
    if (coincidencia) {
      navigate(coincidencia);
      setBuscar('');
    }
  };

  const iniciales = (usuario?.sub ?? '?').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface-glass pl-16 pr-4 backdrop-blur-xl lg:pl-8 lg:pr-8">
      <div className="min-w-0">
        <p className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-text-secondary/70 sm:block">
          AutoFix
        </p>
        <h2 className="truncate font-display text-lg font-semibold tracking-wide text-text-primary sm:text-xl">
          {titulo}
        </h2>
      </div>

      <div className="flex items-center gap-3">
        <form onSubmit={manejarBusqueda} className="relative hidden sm:block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Ir a un módulo..."
            className="input w-56 pl-9 pr-8 lg:w-64"
          />
          {buscar && (
            <button
              type="button"
              onClick={() => setBuscar('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </form>

        <div className="hidden items-center gap-2.5 border-l border-border pl-3 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-hover via-accent to-[#d98200] text-[11px] font-bold text-base-bg">
            {iniciales}
          </div>
          <div className="leading-tight">
            <p className="max-w-[150px] truncate text-xs font-medium text-text-primary">
              {usuario?.sub}
            </p>
            <div className="mt-0.5">
              <Badge valor={usuario?.rol} dot={false} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
