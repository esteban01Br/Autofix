/** URL de la app operativa (donde vive el panel del taller). */
export const APP_URL = (import.meta.env.VITE_APP_URL || 'http://localhost:5173').replace(
  /\/+$/,
  '',
);

/**
 * Entrega la sesión a la app: la redirige con /?token=… y la app
 * guarda el token en su propio almacenamiento (handoff entre orígenes).
 */
export const entrarALaApp = (token, ruta) => {
  const destino = ruta || '/dashboard';
  window.location.href = `${APP_URL}/?token=${encodeURIComponent(token)}&ir=${encodeURIComponent(destino)}`;
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
