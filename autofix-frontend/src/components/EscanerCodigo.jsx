import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { ScanBarcode } from 'lucide-react';
import Modal from './Modal';

/**
 * Escáner de código de barras con la cámara del dispositivo.
 * Detecta EAN-13, EAN-8, CODE-128, CODE-39, QR, etc.
 *
 * Props:
 *  - abierto: muestra/oculta el escáner
 *  - onCerrar: se llama al cancelar
 *  - onDetectado(codigo): se llama una vez, al leer un código válido
 */
export default function EscanerCodigo({ abierto, onCerrar, onDetectado }) {
  const videoRef = useRef(null);
  const [error, setError] = useState('');
  // Ref para no reiniciar la cámara si el padre re-renderiza.
  const onDetectadoRef = useRef(onDetectado);
  onDetectadoRef.current = onDetectado;

  useEffect(() => {
    if (!abierto) return undefined;

    setError('');
    const lector = new BrowserMultiFormatReader();
    let activo = true;

    const detenerCamara = () => {
      const video = videoRef.current;
      if (video?.srcObject) {
        video.srcObject.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
    };

    lector
      .decodeFromConstraints(
        // facingMode 'environment' prefiere la cámara trasera en el celular.
        { video: { facingMode: 'environment' } },
        videoRef.current,
        (resultado) => {
          if (!activo || !resultado) return;
          activo = false;
          navigator.vibrate?.(150);
          detenerCamara();
          onDetectadoRef.current(resultado.getText());
        }
      )
      .catch(() => {
        if (activo) {
          setError(
            'No se pudo acceder a la cámara. Revisa los permisos del navegador e inténtalo de nuevo.'
          );
        }
      });

    return () => {
      activo = false;
      detenerCamara();
    };
  }, [abierto]);

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Escanear código de barras"
      tamanio="max-w-md"
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-lg border border-border bg-black">
          <video
            ref={videoRef}
            className="w-full aspect-[4/3] object-cover"
            muted
            playsInline
          />
          {/* Guía visual: rectángulo donde apuntar el código */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-3/4 h-1/3 border-2 border-accent/80 rounded-md shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
          </div>
        </div>

        {error ? (
          <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
            {error}
          </div>
        ) : (
          <p className="text-sm text-text-secondary flex items-center gap-2">
            <ScanBarcode size={16} className="text-accent shrink-0" />
            Apunta la cámara al código de barras. Se detectará automáticamente.
          </p>
        )}

        <div className="flex justify-end">
          <button type="button" onClick={onCerrar} className="btn btn-ghost">
            Cancelar
          </button>
        </div>
      </div>
    </Modal>
  );
}
