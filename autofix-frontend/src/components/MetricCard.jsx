export default function MetricCard({ titulo, valor, icon: Icon, acento = false }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between">
      <div>
        <p className="text-xs text-text-secondary uppercase tracking-wide font-medium mb-1">
          {titulo}
        </p>
        <p className="font-display text-3xl font-bold text-text-primary">{valor}</p>
      </div>
      <div
        className={`w-11 h-11 rounded-md flex items-center justify-center ${
          acento ? 'bg-accent/10 text-accent' : 'bg-steel/10 text-steel'
        }`}
      >
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
}