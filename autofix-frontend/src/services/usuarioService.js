import api from './api';

export const listarUsuarios = async (params) => {
  const response = await api.get('/api/usuarios', { params });
  return response.data;
};

export const obtenerUsuario = async (id) => {
  const response = await api.get(`/api/usuarios/${id}`);
  return response.data;
};

export const crearUsuario = async (data) => {
  const response = await api.post('/api/usuarios', data);
  return response.data;
};

export const actualizarUsuario = async (id, data) => {
  const response = await api.put(`/api/usuarios/${id}`, data);
  return response.data;
};

export const eliminarUsuario = async (id) => {
  await api.delete(`/api/usuarios/${id}`);
};