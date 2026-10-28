import axios from 'axios';

// URL del backend en producción (Render). En desarrollo usa el proxy de Vite.
const API_URL = 'https://autofix-api-tm6d.onrender.com';

const api = axios.create({
  baseURL: import.meta.env.DEV ? '/' : API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
