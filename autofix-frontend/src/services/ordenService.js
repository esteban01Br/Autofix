import api from './api';

export const listarOrdenes = async (params) => {
  const response = await api.get('/api/ordenes', { params });
  return response.data;
};

export const obtenerOrden = async (id) => {
  const response = await api.get(`/api/ordenes/${id}`);
  return response.data;
};

export const crearOrden = async (data) => {
  const response = await api.post('/api/ordenes', data);
  return response.data;
};

export const actualizarOrden = async (id, data) => {
  const response = await api.put(`/api/ordenes/${id}`, data);
  return response.data;
};

export const cambiarEstadoOrden = async (id, estado) => {
  const response = await api.patch(`/api/ordenes/${id}/estado`, { estado });
  return response.data;
};

export const asignarMecanico = async (id, mecanicoId) => {
  const response = await api.patch(`/api/ordenes/${id}/mecanico`, { mecanicoId });
  return response.data;
};

export const asignarMecanicoOrden = asignarMecanico;

export const eliminarOrden = async (id) => {
  await api.delete(`/api/ordenes/${id}`);
};

// Vista del mecánico: solo sus órdenes asignadas
export const obtenerMisOrdenes = async () => {
  const response = await api.get('/api/ordenes/mias');
  return response.data;
};
