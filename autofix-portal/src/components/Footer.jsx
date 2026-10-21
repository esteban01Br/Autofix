import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-hover via-accent to-[#d98200] text-base-bg">
                <Wrench size={16} strokeWidth={2.5} />
              </span>
              <span className="font-display text-xl font-bold uppercase tracking-wide">
                Auto<span className="text-accent">Fix</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">
              Gestión para talleres mecánicos. Cada empresa con su página de acceso privada,
              sus roles y sus datos aislados.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-xs">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary/70">
                Producto
              </p>
              <ul className="space-y-1.5 text-text-secondary">
                <li><a href="#caracteristicas" className="transition-colors hover:text-text-primary">Características</a></li>
                <li><a href="#como-funciona" className="transition-colors hover:text-text-primary">Cómo funciona</a></li>
                <li><a href="#planes" className="transition-colors hover:text-text-primary">Planes</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-text-secondary/70">
                Acceso
              </p>
              <ul className="space-y-1.5 text-text-secondary">
                <li><Link to="/login" className="transition-colors hover:text-text-primary">Iniciar sesión</Link></li>
                <li><Link to="/comprar/basico" className="transition-colors hover:text-text-primary">Crear cuenta</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-[11px] text-text-secondary sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AutoFix SaaS — Gestión para talleres mecánicos.</p>
          <p>Cada taller tiene su propia página de acceso privada.</p>
        </div>
      </div>
    </footer>
  );
}
