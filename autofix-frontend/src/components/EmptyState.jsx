import { FolderOpen } from 'lucide-react';

export default function EmptyState({
  icono: Icon = FolderOpen,
  mensaje = 'No hay registros',
  sugerencia,
  accionLabel,
  accionClick,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center animate-fade-in">
      <div className="relative mb-4">
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-accent-glow blur-xl"
        />
        <div className="tile-icono relative h-16 w-16">
          <Icon size={26} />
        </div>
      </div>
      <p className="text-sm font-medium text-text-primary">{mensaje}</p>
      {sugerencia && (
        <p className="mt-1 max-w-sm text-xs text-muted">{sugerencia}</p>
      )}
      {accionLabel && accionClick && (
        <button onClick={accionClick} className="btn btn-primary btn-sm mt-4">
          {accionLabel}
        </button>
      )}
    </div>
  );
}
