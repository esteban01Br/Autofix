import api from './api';

export const listarVehiculos = async (params) => {
  const response = await api.get('/api/vehiculos', { params });
  return response.data;
};

export const obtenerVehiculo = async (id) => {
  const response = await api.get(`/api/vehiculos/${id}`);
  return response.data;
};

export const crearVehiculo = async (data) => {
  const response = await api.post('/api/vehiculos', data);
  return response.data;
};

export const actualizarVehiculo = async (id, data) => {
  const response = await api.put(`/api/vehiculos/${id}`, data);
  return response.data;
};

export const eliminarVehiculo = async (id) => {
  await api.delete(`/api/vehiculos/${id}`);
};