import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout({ titulo }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen bg-base-bg">
      <Sidebar abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />
      <div className="lg:ml-64 min-h-screen flex flex-col">
        <Header titulo={titulo} />
        <button
          onClick={() => setMenuAbierto(true)}
          className="fixed top-4 left-4 z-20 p-2 rounded-md bg-surface border border-border text-text-primary lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <main className="p-4 sm:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}