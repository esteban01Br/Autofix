import api from './api';

export const listarFacturas = async (params) => {
  const response = await api.get('/api/facturas', { params });
  return response.data;
};

export const obtenerFactura = async (id) => {
  const response = await api.get(`/api/facturas/${id}`);
  return response.data;
};

export const crearFactura = async (data) => {
  const response = await api.post('/api/facturas', data);
  return response.data;
};

export const eliminarFactura = async (id) => {
  await api.delete(`/api/facturas/${id}`);
};