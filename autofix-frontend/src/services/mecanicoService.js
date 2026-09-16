import api from './api';

export const listarMecanicos = async (params) => {
  const response = await api.get('/api/mecanicos', { params });
  return response.data;
};

export const obtenerMecanico = async (id) => {
  const response = await api.get(`/api/mecanicos/${id}`);
  return response.data;
};

export const crearMecanico = async (data) => {
  const response = await api.post('/api/mecanicos', data);
  return response.data;
};

export const actualizarMecanico = async (id, data) => {
  const response = await api.put(`/api/mecanicos/${id}`, data);
  return response.data;
};

export const eliminarMecanico = async (id) => {
  await api.delete(`/api/mecanicos/${id}`);
};