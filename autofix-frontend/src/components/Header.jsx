import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import Badge from './Badge';

export default function Header({ titulo }) {
  const [buscar, setBuscar] = useState('');
  const navigate = useNavigate();

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

  return (
    <header className="h-16 bg-surface-glass backdrop-blur-md border-b border-border flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
      <h2 className="font-display text-xl font-semibold text-text-primary tracking-wide">
        {titulo}
      </h2>

      <div className="flex items-center gap-3">
        <form onSubmit={manejarBusqueda} className="hidden sm:block relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
          />
          <input
            type="text"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Ir a un módulo..."
            className="input pl-9 pr-8 w-64"
          />
          {buscar && (
            <button
              type="button"
              onClick={() => setBuscar('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
            >
              <X size={14} />
            </button>
          )}
        </form>
      </div>
    </header>
  );
}