import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function DashboardLayout({ titulo }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [progreso, setProgreso] = useState({ visible: false, avance: 0 });
  const ubicacion = useLocation();

  // Barra de progreso + desplazamiento al inicio cada vez que se cambia de módulo.
  useEffect(() => {
    setProgreso({ visible: true, avance: 12 });
    const aMedio = setTimeout(() => setProgreso({ visible: true, avance: 72 }), 70);
    const aFin = setTimeout(() => setProgreso({ visible: true, avance: 100 }), 260);
    const ocultar = setTimeout(() => setProgreso({ visible: false, avance: 0 }), 560);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      clearTimeout(aMedio);
      clearTimeout(aFin);
      clearTimeout(ocultar);
    };
  }, [ubicacion.pathname]);

  return (
    <div className="fondo-panel min-h-screen bg-base-bg">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent"
      >
        <div
          className="h-full bg-accent shadow-[0_0_10px_var(--color-accent)] transition-all duration-300 ease-out"
          style={{
            width: `${progreso.avance}%`,
            opacity: progreso.visible ? 1 : 0,
          }}
        />
      </div>

      <Sidebar abierto={menuAbierto} cerrar={() => setMenuAbierto(false)} />

      <div className="flex min-h-screen flex-col lg:ml-64">
        <Header titulo={titulo} alAbrirMenu={() => setMenuAbierto(true)} />

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
