import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CornerDownLeft, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buscarModulos } from '../lib/modulos';

function Resultado({ item, activo, onSelect, onHover }) {
  const Icono = item.icon;
  return (
    <button
      type="button"
      role="option"
      aria-selected={activo}
      onMouseEnter={onHover}
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-[8px] px-2.5 py-2 text-left transition-colors ${
        activo ? 'bg-surface-hover text-text-primary' : 'text-text-secondary hover:bg-surface-hover'
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border transition-colors ${
          activo
            ? 'border-accent/60 bg-accent-glow text-accent'
            : 'border-border bg-surface text-text-primary'
        }`}
      >
        <Icono size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text-primary">{item.label}</span>
        <span className="block truncate text-xs text-muted">{item.desc}</span>
      </span>
      <span className="hidden shrink-0 rounded-full border border-border px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-muted sm:block">
        {item.seccion}
      </span>
      <ArrowRight
        size={14}
        className={`shrink-0 transition-all ${activo ? 'translate-x-0 text-accent opacity-100' : '-translate-x-1 opacity-0'}`}
      />
    </button>
  );
}

export default function BuscadorModulos() {
  const [consulta, setConsulta] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const [movil, setMovil] = useState(false);
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);
  const inputMovilRef = useRef(null);

  const resultados = useMemo(
    () => buscarModulos(usuario?.rol, consulta),
    [usuario?.rol, consulta],
  );

  useEffect(() => {
    setActivo(0);
  }, [consulta, abierto]);

  // Atajo de teclado: Ctrl/Cmd + K o "/" para buscar.
  useEffect(() => {
    const alPresionar = (evento) => {
      const escribiendo = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName,
      );
      if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === 'k') {
        evento.preventDefault();
        if (window.matchMedia('(min-width: 768px)').matches) {
          inputRef.current?.focus();
          setAbierto(true);
        } else {
          setMovil(true);
        }
        return;
      }
      if (evento.key === '/' && !escribiendo) {
        evento.preventDefault();
        inputRef.current?.focus();
        setAbierto(true);
      }
      if (evento.key === 'Escape') {
        setAbierto(false);
        setMovil(false);
      }
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, []);

  useEffect(() => {
    if (movil) {
      const temporizador = setTimeout(() => inputMovilRef.current?.focus(), 40);
      return () => clearTimeout(temporizador);
    }
    return undefined;
  }, [movil]);

  useEffect(() => {
    if (!abierto) return undefined;
    const alClicFuera = (evento) => {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, [abierto]);

  const irA = (item) => {
    if (!item) return;
    navigate(item.to);
    setConsulta('');
    setAbierto(false);
    setMovil(false);
    inputRef.current?.blur();
  };

  const alTeclear = (evento) => {
    if (evento.key === 'ArrowDown') {
      evento.preventDefault();
      setAbierto(true);
      setActivo((indice) => Math.min(indice + 1, resultados.length - 1));
    } else if (evento.key === 'ArrowUp') {
      evento.preventDefault();
      setActivo((indice) => Math.max(indice - 1, 0));
    } else if (evento.key === 'Enter') {
      evento.preventDefault();
      irA(resultados[activo]);
    } else if (evento.key === 'Escape') {
      setAbierto(false);
      inputRef.current?.blur();
    }
  };

  const panelResultados = (
    <div className="max-h-[60vh] overflow-y-auto p-1.5">
      {resultados.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium text-text-primary">Sin coincidencias</p>
          <p className="mt-1 text-xs text-muted">
            Prueba con “citas”, “stock”, “facturas” o “usuarios”.
          </p>
        </div>
      ) : (
        <div role="listbox" aria-label="Módulos">
          {resultados.map((item, indice) => (
            <Resultado
              key={item.to}
              item={item}
              activo={indice === activo}
              onHover={() => setActivo(indice)}
              onSelect={() => irA(item)}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Buscador de escritorio */}
      <div ref={contenedorRef} className="relative hidden md:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          ref={inputRef}
          type="text"
          value={consulta}
          onChange={(evento) => setConsulta(evento.target.value)}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclear}
          placeholder="Buscar módulo…"
          aria-label="Buscar módulo"
          aria-expanded={abierto}
          role="combobox"
          aria-controls="resultados-modulos"
          className="input h-9 w-56 pl-9 pr-14 lg:w-72"
        />
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-muted">
          Ctrl K
        </span>

        {abierto && (
          <div
            id="resultados-modulos"
            className="absolute right-0 top-[calc(100%+8px)] w-[420px] overflow-hidden rounded-[10px] border border-border bg-surface/95 shadow-xl shadow-black/20 backdrop-blur-xl animate-slide-down"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                {consulta ? `${resultados.length} resultado${resultados.length === 1 ? '' : 's'}` : 'Módulos disponibles'}
              </span>
              <span className="hidden items-center gap-1 text-[10px] text-muted sm:flex">
                <CornerDownLeft size={11} /> abrir · esc cerrar
              </span>
            </div>
            {panelResultados}
          </div>
        )}
      </div>

      {/* Botón de búsqueda en móvil */}
      <button
        type="button"
        onClick={() => setMovil(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-text-secondary transition-colors hover:text-text-primary md:hidden"
        aria-label="Buscar módulo"
      >
        <Search size={16} />
      </button>

      {/* Búsqueda en móvil (pantalla completa, fuera del header) */}
      {movil &&
        createPortal(
          <div className="fixed inset-0 z-[80] flex flex-col bg-black/60 p-3 backdrop-blur-sm md:hidden">
          <div className="overflow-hidden rounded-[10px] border border-border bg-surface shadow-2xl animate-slide-down">
            <div className="flex items-center gap-2 border-b border-border p-2">
              <Search size={16} className="ml-1 shrink-0 text-muted" />
              <input
                ref={inputMovilRef}
                type="text"
                value={consulta}
                onChange={(evento) => setConsulta(evento.target.value)}
                placeholder="Buscar módulo…"
                aria-label="Buscar módulo"
                className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setMovil(false)}
                className="rounded-full p-1.5 text-muted hover:text-text-primary"
                aria-label="Cerrar búsqueda"
              >
                <X size={17} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-1.5">
              {resultados.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="text-sm font-medium text-text-primary">Sin coincidencias</p>
                  <p className="mt-1 text-xs text-muted">
                    Prueba con “citas”, “stock” o “facturas”.
                  </p>
                </div>
              ) : (
                resultados.map((item) => (
                  <Resultado
                    key={item.to}
                    item={item}
                    activo={false}
                    onHover={() => {}}
                    onSelect={() => irA(item)}
                  />
                ))
              )}
            </div>
          </div>
            <button
              type="button"
              onClick={() => setMovil(false)}
              className="mt-3 self-center text-xs text-white/80"
            >
              Cerrar
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
