export default function PageHeader({ titulo, subtitulo, children }) {
  return (
    <div className="flex items-center justify-between mb-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-text-primary tracking-wide">{titulo}</h1>
        {subtitulo && <p className="text-sm text-text-secondary mt-0.5">{subtitulo}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}