import api from './api';

// Registro público: crea la empresa y devuelve { empresa, token }
export const registrarEmpresa = async (data) => {
  const response = await api.post('/api/empresas/registro', data);
  return response.data;
};

// Datos de la empresa del usuario autenticado
export const obtenerEmpresaActual = async () => {
  const response = await api.get('/api/empresas/actual');
  return response.data;
};

// Actualizar marca/datos de la empresa (ADMIN)
export const actualizarEmpresaActual = async (data) => {
  const response = await api.put('/api/empresas/actual', data);
  return response.data;
};

// Listar todas las empresas (SUPERADMIN)
export const listarEmpresas = async () => {
  const response = await api.get('/api/empresas');
  return response.data;
};

// Activar o suspender una empresa (SUPERADMIN)
export const cambiarEstadoEmpresa = async (id, activa) => {
  const response = await api.patch(`/api/empresas/${id}/estado`, null, {
    params: { activa },
  });
  return response.data;
};
