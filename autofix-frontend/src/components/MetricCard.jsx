export default function MetricCard({ titulo, valor, icon: Icon, acento = false }) {
  return (
    <div className="card p-5 flex items-center justify-between group hover:border-accent/40 transition-colors">
      <div>
        <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
          {titulo}
        </p>
        <p className="font-display text-3xl font-bold text-text-primary group-hover:text-accent transition-colors">
          {valor}
        </p>
      </div>
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${
          acento ? 'bg-accent-glow text-accent' : 'bg-steel/15 text-steel'
        }`}
      >
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
}