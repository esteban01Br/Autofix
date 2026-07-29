import { createContext, useContext, useState, useEffect } from 'react';
import { login as loginRequest, decodificarToken } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autofix_token');
    if (token) {
      try {
        const datos = decodificarToken(token);
        if (datos.expira * 1000 > Date.now()) {
          setUsuario(datos);
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