import api from './api';

export const listarDetalles = async (params) => {
  const response = await api.get('/api/detalles', { params });
  return response.data;
};

export const listarDetallesPorOrden = async (ordenId) => {
  const response = await api.get(`/api/detalles/orden/${ordenId}`);
  return response.data;
};

export const crearDetalle = async (ordenId, data) => {
  const response = await api.post(`/api/detalles/orden/${ordenId}`, data);
  return response.data;
};

export const actualizarDetalle = async (detalleId, data) => {
  const response = await api.put(`/api/detalles/${detalleId}`, data);
  return response.data;
};

export const eliminarDetalle = async (detalleId) => {
  await api.delete(`/api/detalles/${detalleId}`);
};