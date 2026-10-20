import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Nav({ compacto = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-glass backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 group">
          <span className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-base-bg transition-transform group-hover:scale-105">
            <Wrench size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold tracking-wide uppercase">
            Auto<span className="text-accent">Fix</span>
          </span>
          <span className="badge bg-info/10 text-info hidden sm:inline-flex">SaaS</span>
        </Link>

        {!compacto && (
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#caracteristicas" className="hover:text-text-primary transition-colors">
              Características
            </a>
            <a href="#como-funciona" className="hover:text-text-primary transition-colors">
              Cómo funciona
            </a>
            <a href="#planes" className="hover:text-text-primary transition-colors">
              Planes
            </a>
          </nav>
        )}

        <div className="flex items-center gap-2">
          <Link to="/login" className="btn btn-ghost btn-sm">
            Iniciar sesión
          </Link>
          {!compacto && (
            <Link to="/comprar/basico" className="btn btn-primary btn-sm hidden sm:inline-flex">
              Comenzar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
