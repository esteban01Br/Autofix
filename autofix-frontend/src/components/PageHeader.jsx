export default function PageHeader({ titulo, subtitulo, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 animate-fade-in sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="mb-1.5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          <span className="h-1 w-1 rounded-full bg-accent-hover" />
          AutoFix
        </p>
        <h1 className="font-display text-2xl font-medium tracking-tight text-text-primary">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-0.5 text-sm text-muted">{subtitulo}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
