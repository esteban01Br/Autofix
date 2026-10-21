import { useEffect, useRef, useState } from 'react';

/**
 * Anima un número desde su valor anterior hasta el nuevo.
 * Se usa en las tarjetas del panel para que los indicadores "entren"
 * con movimiento en lugar de aparecer de golpe.
 */
export function useContador(valor = 0, duracion = 700) {
  const [mostrado, setMostrado] = useState(0);
  const anterior = useRef(0);

  useEffect(() => {
    const destino = Number(valor) || 0;
    const inicioValor = anterior.current;
    const diferencia = destino - inicioValor;

    if (diferencia === 0) {
      setMostrado(destino);
      return undefined;
    }

    let frame;
    const inicio = performance.now();
    const animar = (t) => {
      const progreso = Math.min(1, (t - inicio) / duracion);
      // Curva ease-out cúbica: arranca rápido y frena suave.
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      setMostrado(Math.round(inicioValor + diferencia * suavizado));
      if (progreso < 1) {
        frame = requestAnimationFrame(animar);
      } else {
        anterior.current = destino;
      }
    };

    frame = requestAnimationFrame(animar);
    return () => cancelAnimationFrame(frame);
  }, [valor, duracion]);

  return mostrado;
}
