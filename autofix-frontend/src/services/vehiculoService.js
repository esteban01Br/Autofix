import api from './api';

export const listarVehiculos = async () => {
  const response = await api.get('/api/vehiculos');
  return response.data;
};

export const eliminarVehiculo = async (id) => {
  await api.delete(`/api/vehiculos/${id}`);
};