import api from './api';

export const listarClientes = async (params) => {
  const response = await api.get('/api/clientes', { params });
  return response.data;
};

export const obtenerCliente = async (id) => {
  const response = await api.get(`/api/clientes/${id}`);
  return response.data;
};

export const crearCliente = async (data) => {
  const response = await api.post('/api/clientes', data);
  return response.data;
};

export const actualizarCliente = async (id, data) => {
  const response = await api.put(`/api/clientes/${id}`, data);
  return response.data;
};

export const eliminarCliente = async (id) => {
  await api.delete(`/api/clientes/${id}`);
};