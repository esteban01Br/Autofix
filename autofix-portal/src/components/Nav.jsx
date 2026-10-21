import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export default function Nav({ compacto = false }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface-glass backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent-hover via-accent to-[#d98200] text-base-bg shadow-[0_8px_24px_-10px_var(--color-accent)] transition-transform group-hover:scale-105 group-hover:-rotate-3">
            <Wrench size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-2xl font-bold uppercase tracking-wide">
            Auto<span className="text-accent">Fix</span>
          </span>
          <span className="badge hidden bg-info/10 text-info sm:inline-flex">SaaS</span>
        </Link>

        {!compacto && (
          <nav className="hidden items-center gap-7 text-sm text-text-secondary md:flex">
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
                <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
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
