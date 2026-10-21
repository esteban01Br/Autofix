import { useEffect, useRef, useState } from 'react';

/**
 * Revela su contenido con una animación suave al entrar en pantalla.
 * Usa IntersectionObserver y respeta la preferencia de movimiento reducido.
 */
export default function Reveal({ children, delay = 0, className = '' }) {
  const referencia = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const elemento = referencia.current;
    if (!elemento) return undefined;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return undefined;
    }

    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observador.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      ref={referencia}
      style={{ transitionDelay: `${delay}ms` }}
      className={`reveal ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
