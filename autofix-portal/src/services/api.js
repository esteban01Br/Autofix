import axios from 'axios';

// URL del backend (configúrala con VITE_API_URL). En desarrollo usa el proxy de Vite.
const API_URL = (
  import.meta.env.VITE_API_URL?.trim() || 'https://autofix-api-tm6d.onrender.com'
).replace(/\/+$/, '');

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/' : API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
