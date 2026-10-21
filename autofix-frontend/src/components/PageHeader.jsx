export default function PageHeader({ titulo, subtitulo, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
      <div className="relative pl-3.5">
        <span
          aria-hidden="true"
          className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-accent to-transparent"
        />
        <h1 className="font-display text-2xl font-bold tracking-wide text-text-primary">
          {titulo}
        </h1>
        {subtitulo && (
          <p className="mt-0.5 text-sm text-text-secondary">{subtitulo}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
