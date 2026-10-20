import axios from 'axios';

// En desarrollo el proxy de Vite reenvía /api al backend local (ver vite.config.js).
// En producción (Netlify) se define VITE_API_URL con la URL del backend en Render.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
