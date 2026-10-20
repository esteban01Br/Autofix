import api from './api';

export const listarServicios = async (params) => {
  const response = await api.get('/api/servicios', { params });
  return response.data;
};

export const obtenerServicio = async (id) => {
  const response = await api.get(`/api/servicios/${id}`);
  return response.data;
};

export const crearServicio = async (data) => {
  const response = await api.post('/api/servicios', data);
  return response.data;
};

export const actualizarServicio = async (id, data) => {
  const response = await api.put(`/api/servicios/${id}`, data);
  return response.data;
};

export const eliminarServicio = async (id) => {
  await api.delete(`/api/servicios/${id}`);
};
