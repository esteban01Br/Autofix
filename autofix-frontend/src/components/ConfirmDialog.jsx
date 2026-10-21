import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ abierto, onCerrar, onConfirmar, titulo, mensaje }) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo || 'Confirmar'} tamanio="max-w-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-danger/25 blur-xl"
          />
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-danger/15 text-danger ring-1 ring-danger/30">
            <AlertTriangle size={24} />
          </div>
        </div>
        <p className="text-sm text-text-secondary">
          {mensaje || '¿Estás seguro de realizar esta acción?'}
        </p>
        <div className="flex w-full gap-3">
          <button onClick={onCerrar} className="btn btn-ghost flex-1">
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirmar();
              onCerrar();
            }}
            className="btn btn-danger flex-1"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}
