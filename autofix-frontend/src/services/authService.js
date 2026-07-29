import api from './api';

export const login = async (correo, contrasena) => {
const response = await api.post('/api/auth/login', { correo, contrasena });
return response.data;
};

export const decodificarToken = (token) => {
const payload = token.split('.')[1];
const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
const decoded = JSON.parse(decodeURIComponent(escape(atob(base64))));
return {
    correo: decoded.sub,
    id: decoded.id,
    rol: decoded.rol,
    expira: decoded.exp,
};
};