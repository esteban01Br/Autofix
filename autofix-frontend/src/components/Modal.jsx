import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ abierto, onCerrar, titulo, children, tamanio = 'max-w-lg' }) {
  useEffect(() => {
    if (!abierto) return undefined;
    const escucharTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', escucharTecla);
    // Evita el scroll del fondo mientras el modal está abierto.
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', escucharTecla);
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-md animate-fade-in sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        className={`flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-border bg-surface shadow-2xl shadow-black/30 backdrop-blur-2xl sm:rounded-2xl ${tamanio} animate-slide-up sm:animate-scale-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-medium tracking-tight text-text-primary">
            {titulo}
          </h3>
          <button
            onClick={onCerrar}
            className="rounded-full p-1.5 text-muted transition-colors hover:bg-glass-fuerte hover:text-text-primary"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}
