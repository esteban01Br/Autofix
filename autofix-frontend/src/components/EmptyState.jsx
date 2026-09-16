import { FolderOpen } from 'lucide-react';

export default function EmptyState({ icono: Icon = FolderOpen, mensaje = 'No hay registros', accionLabel, accionClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-full bg-surface-hover flex items-center justify-center text-text-secondary mb-4">
        <Icon size={24} />
      </div>
      <p className="text-sm text-text-secondary mb-4">{mensaje}</p>
      {accionLabel && accionClick && (
        <button onClick={accionClick} className="btn btn-primary btn-sm">
          {accionLabel}
        </button>
      )}
    </div>
  );
}