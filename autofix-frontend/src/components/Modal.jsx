import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ abierto, onCerrar, titulo, children, tamanio = 'max-w-lg' }) {
  useEffect(() => {
    if (!abierto) return;
    const escucharTecla = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', escucharTecla);
    return () => window.removeEventListener('keydown', escucharTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div
        className={`bg-surface border border-border rounded-xl w-full ${tamanio} max-h-[90vh] flex flex-col shadow-2xl shadow-black/40 animate-scale-in`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-display text-lg font-semibold text-text-primary tracking-wide">
            {titulo}
          </h3>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}