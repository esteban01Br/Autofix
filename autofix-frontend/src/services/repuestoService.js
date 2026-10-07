import api from './api';

export const listarRepuestos = async (params) => {
  const response = await api.get('/api/repuestos', { params });
  return response.data;
};

export const obtenerRepuesto = async (id) => {
  const response = await api.get(`/api/repuestos/${id}`);
  return response.data;
};

export const buscarPorCodigo = async (codigo) => {
  const response = await api.get(`/api/repuestos/por-codigo/${encodeURIComponent(codigo)}`);
  return response.data;
};

export const crearRepuesto = async (data) => {
  const response = await api.post('/api/repuestos', data);
  return response.data;
};

export const actualizarRepuesto = async (id, data) => {
  const response = await api.put(`/api/repuestos/${id}`, data);
  return response.data;
};

export const ajustarStockRepuesto = async (id, cantidad) => {
  const response = await api.patch(`/api/repuestos/${id}/stock`, { cantidad });
  return response.data;
};

export const eliminarRepuesto = async (id) => {
  await api.delete(`/api/repuestos/${id}`);
};