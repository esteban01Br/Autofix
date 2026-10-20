import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginRequest, decodificarToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Handoff desde el portal de ventas: llegamos con /?token=XXXX
    // (el login ahora vive en el portal; la app solo recibe la sesión).
    const params = new URLSearchParams(window.location.search);
    const tokenRecibido = params.get('token');
    const irA = params.get('ir');
    let token = localStorage.getItem('autofix_token');
    if (tokenRecibido) {
      token = tokenRecibido;
      localStorage.setItem('autofix_token', token);
      params.delete('token');
      params.delete('ir');
      const limpio =
        window.location.pathname +
        (params.toString() ? `?${params.toString()}` : '') +
        window.location.hash;
      window.history.replaceState({}, '', limpio);
    }

    if (token) {
      try {
        const datos = decodificarToken(token);
        if (datos.expira * 1000 > Date.now()) {
          setUsuario(datos);
          if (tokenRecibido) {
            // Aterrizaje tras entrar desde el portal: la contraseña temporal
            // obliga primero al cambio de contraseña. `ir` solo se acepta
            // como ruta interna (evita redirecciones externas).
            const destino =
              irA && irA.startsWith('/') && !irA.startsWith('//') ? irA : null;
            const ruta = datos.debeCambiarContrasena
              ? '/cambiar-contrasena'
              : destino || '/dashboard';
            window.history.replaceState({}, '', ruta);
          }
        } else {
          localStorage.removeItem('autofix_token');
        }
      } catch {
        localStorage.removeItem('autofix_token');
      }
    }
    setCargando(false);
  }, []);

  const login = async (correo, contrasena) => {
    const data = await loginRequest(correo, contrasena);
    localStorage.setItem('autofix_token', data.token);
    const datos = decodificarToken(data.token);
    setUsuario(datos);
    return datos;
  };

  const logout = () => {
    localStorage.removeItem('autofix_token');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}