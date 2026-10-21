/** Bloque de carga con brillo animado (reemplaza al spinner en vistas densas). */
export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
