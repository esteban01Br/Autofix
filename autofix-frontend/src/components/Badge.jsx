const mapas = {
  // Estados de orden
  RECIBIDO: { color: 'bg-info-glow text-info' },
  DIAGNOSTICO: { color: 'bg-warning-glow text-warning' },
  EN_REPARACION: { color: 'bg-accent-glow text-accent' },
  ESPERANDO_REPUESTOS: { color: 'bg-danger-glow text-danger' },
  LISTO: { color: 'bg-success-glow text-success' },
  ENTREGADO: { color: 'bg-steel/15 text-steel' },

  // Estados de cita
  PENDIENTE: { color: 'bg-warning-glow text-warning' },
  CONFIRMADA: { color: 'bg-info-glow text-info' },
  CANCELADA: { color: 'bg-danger-glow text-danger' },
  FINALIZADA: { color: 'bg-success-glow text-success' },

  // Roles
  ADMIN: { color: 'bg-accent-glow text-accent' },
  MECANICO: { color: 'bg-info-glow text-info' },
  CLIENTE: { color: 'bg-steel/15 text-steel' },

  // Booleanos
  true: { color: 'bg-success-glow text-success' },
  false: { color: 'bg-danger-glow text-danger' },
};

export default function Badge({ valor, dot = true }) {
  const estilo = mapas[valor] || { color: 'bg-surface-hover text-text-secondary' };
  return (
    <span className={`badge ${estilo.color}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {valor?.replaceAll('_', ' ') || '—'}
    </span>
  );
}