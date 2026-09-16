import api from './api';

export const listarCitas = async (params) => {
  const response = await api.get('/api/citas', { params });
  return response.data;
};

export const obtenerCita = async (id) => {
  const response = await api.get(`/api/citas/${id}`);
  return response.data;
};

export const crearCita = async (data) => {
  const response = await api.post('/api/citas', data);
  return response.data;
};

export const actualizarCita = async (id, data) => {
  const response = await api.put(`/api/citas/${id}`, data);
  return response.data;
};

export const cambiarEstadoCita = async (id, estado) => {
  const response = await api.patch(`/api/citas/${id}/estado`, { estado });
  return response.data;
};

export const eliminarCita = async (id) => {
  await api.delete(`/api/citas/${id}`);
};