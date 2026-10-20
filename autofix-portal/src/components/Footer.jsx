export default function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-secondary">
        <p>© {new Date().getFullYear()} AutoFix SaaS — Gestión para talleres mecánicos.</p>
        <p>Cada taller tiene su propia página de acceso privada.</p>
      </div>
    </footer>
  );
}
