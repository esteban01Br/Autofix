import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const CLAVE = 'autofix_tema';

const temaInicial = () => {
  if (typeof window === 'undefined') return 'oscuro';
  const guardado = window.localStorage.getItem(CLAVE);
  if (guardado === 'claro' || guardado === 'oscuro') return guardado;
  return 'oscuro';
};

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial);

  useEffect(() => {
    const raiz = document.documentElement;
    raiz.dataset.tema = tema;
    raiz.style.colorScheme = tema === 'claro' ? 'light' : 'dark';
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', tema === 'claro' ? '#f4f4f5' : '#0a0a0a');
    window.localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((actual) => (actual === 'claro' ? 'oscuro' : 'claro'));
  }, []);

  const valor = useMemo(
    () => ({ tema, esClaro: tema === 'claro', alternarTema, setTema }),
    [tema, alternarTema],
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTema() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error('useTema debe usarse dentro de ThemeProvider');
  }
  return contexto;
}
