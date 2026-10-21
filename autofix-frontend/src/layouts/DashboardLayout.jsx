import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout({ titulo }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  return (
    <div className="fondo-panel min-h-screen bg-base-bg">
      <Sidebar abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />

      <div className="flex min-h-screen flex-col lg:ml-64">
        <Header titulo={titulo} />

        <button
          onClick={() => setMenuAbierto(true)}
          className="fixed left-4 top-4 z-20 rounded-full border border-border bg-surface-glass p-2 text-text-primary shadow-lg backdrop-blur-xl transition-colors hover:border-accent/40 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        <main className="flex-1 p-4 sm:p-8">
          {/* La key reinicia la animación cada vez que se cambia de módulo. */}
          <div key={ubicacion.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
