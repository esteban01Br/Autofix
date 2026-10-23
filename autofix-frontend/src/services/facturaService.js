import api from './api';

export const listarFacturas = async (params) => {
  const response = await api.get('/api/facturas', { params });
  return response.data;
};

export const obtenerFactura = async (id) => {
  const response = await api.get(`/api/facturas/${id}`);
  return response.data;
};

export const crearFactura = async (data) => {
  const response = await api.post('/api/facturas', data);
  return response.data;
};

export const eliminarFactura = async (id) => {
  await api.delete(`/api/facturas/${id}`);
};

// Descarga el PDF del comprobante interno de la factura.
export const descargarFacturaPDF = async (id, numero) => {
  const response = await api.get(`/api/facturas/${id}/pdf`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const enlace = document.createElement('a');
  enlace.href = url;
  // El backend entrega el nombre sugerido en el header; si no, usamos el número.
  const disposition = response.headers?.['content-disposition'];
  const nombre = disposition?.match(/filename="?(.+?)"?;?$/)?.[1] || `${numero || 'factura'}.pdf`;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
};

// Pagos y abonos de una factura
export const listarPagos = async (facturaId) => {
  const response = await api.get(`/api/facturas/${facturaId}/pagos`);
  return response.data;
};

export const registrarPago = async (facturaId, data) => {
  const response = await api.post(`/api/facturas/${facturaId}/pagos`, data);
  return response.data;
};