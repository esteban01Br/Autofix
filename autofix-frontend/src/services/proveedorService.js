import api from './api';

// Proveedores: catálogo de fuentes de compra de repuestos.
export const listarProveedores = async (params) => {
  const response = await api.get('/api/proveedores', { params });
  return response.data;
};

export const obtenerProveedor = async (id) => {
  const response = await api.get(`/api/proveedores/${id}`);
  return response.data;
};

export const crearProveedor = async (data) => {
  const response = await api.post('/api/proveedores', data);
  return response.data;
};

export const actualizarProveedor = async (id, data) => {
  const response = await api.put(`/api/proveedores/${id}`, data);
  return response.data;
};

export const eliminarProveedor = async (id) => {
  await api.delete(`/api/proveedores/${id}`);
};
