import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Aplica el tema guardado (o la preferencia del sistema) antes del primer render.
const temaGuardado = localStorage.getItem('autofix-tema');
const temaInicial = temaGuardado === 'light' || temaGuardado === 'dark'
  ? temaGuardado
  : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
document.documentElement.setAttribute('data-theme', temaInicial);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
