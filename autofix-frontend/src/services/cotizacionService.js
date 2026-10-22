import api from './api';

// Cotizaciones: propuestas de precio previas a la orden de trabajo.
export const listarCotizaciones = async (params) => {
  const response = await api.get('/api/cotizaciones', { params });
  return response.data;
};

export const obtenerCotizacion = async (id) => {
  const response = await api.get(`/api/cotizaciones/${id}`);
  return response.data;
};

export const crearCotizacion = async (data) => {
  const response = await api.post('/api/cotizaciones', data);
  return response.data;
};

export const actualizarCotizacion = async (id, data) => {
  const response = await api.put(`/api/cotizaciones/${id}`, data);
  return response.data;
};

export const cambiarEstadoCotizacion = async (id, estado) => {
  const response = await api.patch(`/api/cotizaciones/${id}/estado`, { estado });
  return response.data;
};

// Convierte una cotización aprobada en orden de trabajo.
export const convertirAOrden = async (id) => {
  const response = await api.post(`/api/cotizaciones/${id}/convertir`);
  return response.data;
};

export const eliminarCotizacion = async (id) => {
  await api.delete(`/api/cotizaciones/${id}`);
};
