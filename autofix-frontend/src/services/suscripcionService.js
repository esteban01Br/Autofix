import api from './api';

// Suscripciones (SaaS): planes, estado y gestión del SUPERADMIN.

export const suscripcionActual = async () => {
  const response = await api.get('/api/suscripciones/actual');
  return response.data;
};

export const listarPlanes = async () => {
  const response = await api.get('/api/suscripciones/planes');
  return response.data;
};

// Solo SUPERADMIN: crea o ajusta la suscripción de cualquier empresa.
export const gestionarSuscripcion = async (empresaId, data) => {
  const response = await api.post(`/api/suscripciones/empresas/${empresaId}`, data);
  return response.data;
};
