import api from './api';

/** Descarga el CSV de una entidad (respuesta binaria para conservar el BOM). */
export const descargarExportacion = async (entidad, params) => {
  const response = await api.get(`/api/exportar/${entidad}`, {
    params,
    responseType: 'blob',
  });
  return response;
};

/** Descarga el ZIP con todos los datos de la empresa. */
export const descargarTodo = async (params) => {
  const response = await api.get('/api/exportar/todo', {
    params,
    responseType: 'blob',
  });
  return response;
};
