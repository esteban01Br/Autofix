import { createContext, useCallback, useContext, useState } from 'react';
import { CircleCheckBig, CircleX, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

let contador = 0;

const estilos = {
  success: {
    container: 'bg-success/10 border-success/30',
    icono: <CircleCheckBig size={18} className="text-success" />,
  },
  error: {
    container: 'bg-danger/10 border-danger/30',
    icono: <CircleX size={18} className="text-danger" />,
  },
  info: {
    container: 'bg-info/10 border-info/30',
    icono: <Info size={18} className="text-info" />,
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((mensaje, tipo = 'success', duracion = 4000) => {
    const id = ++contador;
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
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
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg border bg-surface shadow-lg shadow-black/30 animate-slide-up min-w-[260px] max-w-[420px] ${estilo.container}`}
            >
              {estilo.icono}
              <p className="text-sm text-text-primary flex-1">{toast.mensaje}</p>
              <button onClick={() => cerrarToast(toast.id)} className="p-1 text-text-secondary hover:text-text-primary transition-colors">
                <X size={14} />
              </button>
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