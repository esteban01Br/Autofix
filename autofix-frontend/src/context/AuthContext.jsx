import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  login as loginRequest,
  decodificarToken,
  obtenerPerfil,
} from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Completa el token (que solo trae correo y rol) con el perfil real.
  const cargarPerfil = useCallback(async (datosToken) => {
    try {
      const perfil = await obtenerPerfil();
      return { ...datosToken, ...perfil };
    } catch {
      return datosToken;
    }
  }, []);

  useEffect(() => {
    // El handoff del portal (?token=&ir=) se consume en main.jsx antes de
    // montar el router; aquí solo se restaura la sesión guardada.
    const token = localStorage.getItem('autofix_token');
    if (token) {
      try {
        const datos = decodificarToken(token);
        if (datos.expira * 1000 > Date.now()) {
          setUsuario(datos);
          cargarPerfil(datos).then(setUsuario);
        } else {
          localStorage.removeItem('autofix_token');
        }
      } catch {
        localStorage.removeItem('autofix_token');
      }
    }
    setCargando(false);
  }, [cargarPerfil]);

  const login = async (correo, contrasena) => {
    const data = await loginRequest(correo, contrasena);
    localStorage.setItem('autofix_token', data.token);
    const datos = decodificarToken(data.token);
    setUsuario(datos);
    const completo = await cargarPerfil(datos);
    setUsuario(completo);
    return completo;
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
