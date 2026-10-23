import { useState } from 'react';
import { formatearMoneda } from '../lib/utils';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Etiqueta corta de un mes "YYYY-MM" → "Ene" (o "Ene 25" si cambia de año). */
function etiquetaMes(clave, anioActual) {
  const [anio, mes] = clave.split('-').map(Number);
  const corto = MESES_CORTOS[mes - 1] ?? '';
  return anio === anioActual ? corto : `${corto} ${String(anio).slice(2)}`;
}

/**
 * Gráfica de barras de facturación mensual, dibujada a mano en SVG
 * (sin librería de gráficas) para mantener el bundle ligero y el
 * estilo premium del producto.
 */
export default function GraficaVentas({ datos = [] }) {
  const [activo, setActivo] = useState(null);

  if (!datos.length) return null;

  const maximo = Math.max(...datos.map((d) => d.total), 1);
  const anioActual = new Date().getFullYear();
  // Altura proporcional de cada barra (mínimo 4% para que se vea un zero).
  const alturaBarra = (total) => Math.max(0.04, total / maximo);
  const totalPeriodo = datos.reduce((acc, d) => acc + d.total, 0);
  const activoDato = activo !== null ? datos[activo] : null;

  return (
    <div className="px-5 py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-text-secondary">
          Facturado en el periodo{' '}
          <span className="font-mono font-semibold text-accent">{formatearMoneda(totalPeriodo)}</span>
        </p>
        <p className="font-mono text-xs text-text-secondary">
          {activoDato
            ? `${etiquetaMes(activoDato.mes, anioActual)}: ${formatearMoneda(activoDato.total)} · ${activoDato.facturas} factura(s)`
            : 'Pasa el cursor sobre una barra'}
        </p>
      </div>

      <div className="flex h-44 items-end gap-1.5 sm:gap-2">
        {datos.map((d, i) => (
          <div
            key={d.mes}
            className="group relative flex h-full flex-1 flex-col justify-end"
            onMouseEnter={() => setActivo(i)}
            onMouseLeave={() => setActivo(null)}
          >
            {/* Valor sobre la barra al pasar el cursor. */}
            <span
              className={`mb-1 text-center font-mono text-[10px] text-accent transition-opacity ${
                activo === i ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {formatearMoneda(d.total)}
            </span>
            <div
              className={`w-full rounded-t-md transition-all duration-200 ${
                activo === i
                  ? 'bg-gradient-to-t from-accent to-accent-hover'
                  : d.total > 0
                    ? 'bg-accent/70 group-hover:bg-accent'
                    : 'bg-surface-hover'
              }`}
              style={{ height: `${alturaBarra(d.total) * 100}%` }}
            />
          </div>
        ))}
      </div>

      {/* Eje de meses */}
      <div className="mt-2 flex gap-1.5 sm:gap-2">
        {datos.map((d, i) => (
          <span
            key={d.mes}
            className={`flex-1 text-center font-mono text-[10px] ${
              activo === i ? 'text-accent' : 'text-text-secondary'
            }`}
          >
            {etiquetaMes(d.mes, anioActual)}
          </span>
        ))}
      </div>
    </div>
  );
}
