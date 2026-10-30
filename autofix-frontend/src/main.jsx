import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { consumirSesionDesdeUrl } from './lib/sesionInicial';

// El portal entrega la sesión en /?token=…&ir=…; se consume antes de montar
// el router para que la primera navegación no borre el query.
const rutaInicial = consumirSesionDesdeUrl();
if (rutaInicial) {
  window.history.replaceState({}, '', rutaInicial);
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);