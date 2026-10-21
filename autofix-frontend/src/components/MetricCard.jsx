import { useContador } from '../lib/useContador';

/** Mini gráfico de líneas dibujado a mano (sin dependencias externas). */
function MiniTendencia({ datos = [], color = 'var(--color-accent)' }) {
  if (datos.length < 2) return null;

  const ancho = 92;
  const alto = 30;
  const maximo = Math.max(...datos, 1);
  const paso = ancho / (datos.length - 1);
  const puntos = datos
    .map((valor, indice) => {
      const x = indice * paso;
      const y = alto - 3 - (valor / maximo) * (alto - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `0,${alto} ${puntos} ${ancho},${alto}`;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className="w-[92px] h-[30px] overflow-visible"
      aria-hidden="true"
    >
      <polygon points={area} fill={color} opacity="0.08" />
      <polyline
        points={puntos}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

export default function MetricCard({
  titulo,
  valor = 0,
  icon: Icon,
  acento = false,
  detalle,
  serie,
  onClick,
}) {
  const mostrado = useContador(valor);
  const Etiqueta = onClick ? 'button' : 'div';
  // Sin actividad no se dibuja la línea: una raya plana al pie de la tarjeta
  // se lee como un adorno roto, no como información.
  const hayActividad = Array.isArray(serie) && serie.some((punto) => punto > 0);

  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card card-hover group relative w-full overflow-hidden p-5 text-left ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Halo decorativo que se intensifica al pasar el cursor */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-40 transition-opacity duration-300 group-hover:opacity-80"
        style={{
          background: acento ? 'rgba(102, 58, 243, 0.3)' : 'rgba(124, 145, 182, 0.14)',
        }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            {titulo}
          </p>
          <p className="mt-1.5 font-display text-3xl font-medium tabular-nums tracking-tight text-text-primary transition-colors group-hover:text-frost">
            {mostrado}
          </p>
          {detalle && (
            <p className="mt-1 truncate text-xs text-muted">{detalle}</p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 ${
            acento
              ? 'bg-accent-glow text-[#b9a5ff] shadow-[inset_0_0_0_1px_rgba(102,58,243,0.38)]'
              : 'tile-icono'
          }`}
        >
          {Icon && <Icon size={20} />}
        </div>
      </div>

      {hayActividad && serie.length > 1 && (
        <div className="relative mt-3 flex justify-end opacity-80 transition-opacity group-hover:opacity-100">
          <MiniTendencia
            datos={serie}
            color={acento ? 'var(--color-accent)' : 'var(--color-steel)'}
          />
        </div>
      )}
    </Etiqueta>
  );
}
