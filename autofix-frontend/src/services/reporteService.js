import api from './api';

export const productividadMecanicos = async (params) => {
  const response = await api.get('/api/reportes/productividad', { params });
  return response.data;
};

export const resumenEmpresa = async () => {
  const response = await api.get('/api/reportes/resumen');
  return response.data;
};
