import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({ abierto, onCerrar, onConfirmar, titulo, mensaje }) {
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo || 'Confirmar'} tamanio="max-w-sm">
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-danger/15 flex items-center justify-center text-danger">
          <AlertTriangle size={24} />
        </div>
        <p className="text-sm text-text-secondary">{mensaje || '¿Estás seguro de realizar esta acción?'}</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={onCerrar}
            className="btn btn-ghost flex-1"
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirmar(); onCerrar(); }}
            className="btn btn-danger flex-1"
          >
            Confirmar
          </button>
        </div>
      </div>
    </Modal>
  );
}