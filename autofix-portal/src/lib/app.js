/** URL de la app operativa, obtenida de VITE_APP_URL. */
const APP_URL = import.meta.env.VITE_APP_URL?.trim() || 'https://TU-PANEL.netlify.app';

/**
 * Entrega la sesión a la app: la redirige con /#token=… y la app
 * guarda el token en su propio almacenamiento (handoff entre orígenes).
 *
 * El token viaja en el fragmento (#), que el navegador no envía al
 * servidor: no queda en los logs y no se incluye en el Referer.
 * Solo se llama después de una acción del usuario (login o botón de
 * "Entrar a mi panel"), nunca al cargar una página.
 */
export const entrarALaApp = (token, ruta) => {
  const destino = ruta || '/dashboard';
  window.location.href = `${APP_URL}/#token=${encodeURIComponent(token)}&ir=${encodeURIComponent(destino)}`;
};

/** Extrae un mensaje legible de un error de la API. */
export const mensajeError = (err, respaldo) => {
  const detalle = err?.response?.data?.detail;
  if (typeof detalle === 'string') return detalle;
  if (detalle?.mensaje) return detalle.mensaje;
  if (Array.isArray(detalle) && detalle[0]?.msg) {
    const campo = detalle[0]?.loc?.slice(1).join(' · ');
    return campo ? `${campo}: ${detalle[0].msg}` : detalle[0].msg;
  }
  if (err?.code === 'ERR_NETWORK') {
    return 'No se pudo conectar con el servidor. Inténtalo de nuevo en unos segundos.';
  }
  return respaldo;
};