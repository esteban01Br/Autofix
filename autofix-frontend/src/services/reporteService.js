import api from './api';

export const productividadMecanicos = async (params) => {
  const response = await api.get('/api/reportes/productividad', { params });
  return response.data;
};

export const resumenEmpresa = async () => {
  const response = await api.get('/api/reportes/resumen');
  return response.data;
};

// Serie mensual de facturación (para la gráfica de ingresos).
export const ventasMensuales = async (meses = 12) => {
  const response = await api.get('/api/reportes/ventas-mensuales', { params: { meses } });
  return response.data;
};
