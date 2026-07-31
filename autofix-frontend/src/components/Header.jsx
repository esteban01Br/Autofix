export default function Header({ titulo }) {
  return (
    <header className="h-16 bg-surface border-b border-border flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="font-display text-xl font-semibold text-text-primary tracking-wide">
        {titulo}
      </h2>

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar..."
          className="bg-base-bg border border-border rounded-md px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent w-64"
        />
      </div>
    </header>
  );
}