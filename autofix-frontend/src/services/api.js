import axios from 'axios';

// En desarrollo el proxy de Vite reenvía /api al backend local (ver vite.config.js).
// En producción (Netlify) se define VITE_API_URL con la URL del backend,
// p. ej. https://autofix-api.onrender.com
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('autofix_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const urlPeticion = error?.config?.url ?? '';
    const esLogin = urlPeticion.includes('/api/auth/login');
    if (error.response?.status === 401 && !esLogin) {
      localStorage.removeItem('autofix_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;