import api from './api';

/** Inicia sesión en la API. `slug` vincula el login a una página de acceso. */
export const login = async (correo, contrasena, slug) => {
  const cuerpo = { correo, contrasena };
  if (slug) cuerpo.slug = slug;
  const response = await api.post('/api/auth/login', cuerpo);
  return response.data;
};

/** Registro de empresa con plan (compra simulada) — crea empresa + suscripción. */
export const registrarEmpresa = async (datos) => {
  const response = await api.post('/api/empresas/registro', datos);
  return response.data;
};

/** Catálogo público de planes del SaaS. */
export const listarPlanes = async () => {
  const response = await api.get('/api/suscripciones/planes');
  return response.data;
};

/** Branding público de la página de acceso de una empresa. */
export const empresaPublica = async (slug) => {
  const response = await api.get(`/api/empresas/publico/${encodeURIComponent(slug)}`);
  return response.data;
};
