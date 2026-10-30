import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheckBig, CircleX, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let contador = 0;

const estilos = {
  success: {
    container: 'bg-success/10 border-success/30',
    circulo: 'bg-success/15',
    icono: <CircleCheckBig size={18} className="text-success" />,
  },
  error: {
    container: 'bg-danger/10 border-danger/30',
    circulo: 'bg-danger/15',
    icono: <CircleX size={18} className="text-danger" />,
  },
  info: {
    container: 'bg-info/10 border-info/30',
    circulo: 'bg-info/15',
    icono: <Info size={18} className="text-info" />,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((mensaje, tipo = 'success', duracion = 4000) => {
    const id = ++contador;
    setToasts((prev) => [...prev, { id, mensaje, tipo, duracion }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracion);
  }, []);

  const cerrarToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      {/* Renderizado de toasts */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const estilo = estilos[toast.tipo] || estilos.info;
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto relative flex min-w-[260px] max-w-[420px] items-center gap-3 overflow-hidden rounded-2xl border bg-surface/95 px-4 py-3 shadow-xl shadow-black/20 backdrop-blur-md animate-slide-up ${estilo.container}`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${estilo.circulo}`}
              >
                {estilo.icono}
              </span>
              <p className="flex-1 text-sm text-text-primary">{toast.mensaje}</p>
              <button
                onClick={() => cerrarToast(toast.id)}
                className="p-1 text-muted transition-colors hover:text-text-primary"
                aria-label="Cerrar notificación"
              >
                <X size={14} />
              </button>
              <span
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-white/15"
                style={{
                  animation: `toast-progress ${toast.duracion}ms linear forwards`,
                }}
              />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe usarse dentro de un ToastProvider');
  }
  return context;
}