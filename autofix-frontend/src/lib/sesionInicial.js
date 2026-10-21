import { decodificarToken } from '../services/authService';

const CLAVE_TOKEN = 'autofix_token';

/**
 * Consume el handoff del portal de ventas antes de montar el router.
 *
 * El portal entrega la sesión en `/?token=…&ir=…`. Si el router navegara
 * primero (la ruta `/` redirige al panel), el query se perdería y la app
 * nunca vería la sesión. Por eso esto se ejecuta en `main.jsx`, antes de
 * renderizar React, y deja la URL ya limpia en la ruta de aterrizaje.
 *
 * Devuelve la ruta de aterrizaje o `null` si no había token en la URL.
 */
export function consumirSesionDesdeUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  if (!token) return null;

  const irA = params.get('ir');
  params.delete('token');
  params.delete('ir');
  const query = params.toString();

  try {
    const datos = decodificarToken(token);
    if (!datos.expira || datos.expira * 1000 <= Date.now()) {
      localStorage.removeItem(CLAVE_TOKEN);
      return null;
    }

    localStorage.setItem(CLAVE_TOKEN, token);

    // La contraseña temporal manda sobre cualquier destino solicitado.
    // `ir` solo se acepta como ruta interna (evita redirecciones externas).
    const destino = datos.debeCambiarContrasena
      ? '/cambiar-contrasena'
      : irA && irA.startsWith('/') && !irA.startsWith('//')
        ? irA
        : '/dashboard';

    return `${destino}${query ? `?${query}` : ''}${window.location.hash}`;
  } catch {
    localStorage.removeItem(CLAVE_TOKEN);
    return null;
  }
}
