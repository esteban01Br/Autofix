import api from './api';

export const listarAuditoria = async (params) => {
  const response = await api.get('/api/auditoria', { params });
  return response.data;
};
