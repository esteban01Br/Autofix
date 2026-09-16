export function extraerMensajeError(err, fallback = 'Ocurrió un error inesperado') {
  const detalle = err?.response?.data?.detail;
  if (!detalle) return fallback;
  if (typeof detalle === 'string') return detalle;
  if (Array.isArray(detalle)) {
    const msgs = detalle.map((d) => d.msg).filter(Boolean);
    return msgs.length ? msgs.join(' · ') : fallback;
  }
  return fallback;
}

export function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatearMoneda(valor) {
  if (valor === null || valor === undefined) return '—';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(valor));
}