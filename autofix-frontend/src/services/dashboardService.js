import api from './api';

export const obtenerVehiculos = async () => {
  const response = await api.get('/api/vehiculos');
  return response.data;
};

export const obtenerCitas = async () => {
  const response = await api.get('/api/citas');
  return response.data;
};

export const obtenerOrdenes = async () => {
  const response = await api.get('/api/ordenes');
  return response.data;
};

export const obtenerRepuestos = async () => {
  const response = await api.get('/api/repuestos');
  return response.data;
};