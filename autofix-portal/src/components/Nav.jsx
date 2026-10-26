import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Nav({ compacto = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-glass backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="marca-violeta flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform group-hover:scale-105 group-hover:-rotate-3">
            <Wrench size={17} strokeWidth={2.4} />
          </span>
          <span className="font-display text-2xl font-medium tracking-tight">
            Auto<span className="texto-degradado">Fix</span>
          </span>
          <span className="badge hidden border border-[rgba(186,215,247,0.12)] bg-[rgba(186,214,247,0.06)] text-frost sm:inline-flex">
            SaaS
          </span>
        </Link>

        {!compacto && (
          <nav className="hidden items-center gap-7 text-sm text-muted md:flex">
            {[
              { href: '#caracteristicas', label: 'Características' },
              { href: '#como-funciona', label: 'Cómo funciona' },
              { href: '#planes', label: 'Planes' },
            ].map((enlace) => (
              <a
                key={enlace.href}
                href={enlace.href}
                className="group relative py-1 transition-colors hover:text-text-primary"
              >
                {enlace.label}
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent-hover transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          <ThemeToggle />
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
