import api from './api';

export const listarClientes = async () => {
  const response = await api.get('/api/clientes');
  return response.data;
};

export const eliminarCliente = async (id) => {
  await api.delete(`/api/clientes/${id}`);
};