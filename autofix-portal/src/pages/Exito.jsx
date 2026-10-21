import { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { entrarALaApp } from '../lib/app';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

/**
 * Compra finalizada: muestra la URL privada de acceso de la empresa
 * y deja entrar al administrador directamente al panel.
 */
export default function Exito() {
  const ubicacion = useLocation();
  const registro = ubicacion.state;
  const [copiado, setCopiado] = useState(false);

  // Sin datos de registro (refresco o acceso directo) → volver al inicio.
  if (!registro?.token || !registro?.empresa?.slug) {
    return <Navigate to="/" replace />;
  }

  const { empresa, token, planNombre } = registro;
  const urlAcceso = `${window.location.origin}/acceso/${empresa.slug}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(urlAcceso);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    } catch {
      // Sin permiso de portapapeles: el usuario puede copiarlo a mano.
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center animate-slide-up">
          <div className="relative mx-auto mb-5 h-16 w-16">
            <span
              className="pulso-exito absolute inset-0 rounded-full bg-success-glow"
              aria-hidden="true"
            />
            <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-success-glow text-success ring-1 ring-success/30">
              <CheckCircle2 size={34} />
            </span>
          </div>

          <h1 className="titulo-seccion">¡Tu taller ya está en AutoFix!</h1>
          <p className="text-text-secondary mt-3">
            <span className="text-text-primary font-semibold">{empresa.nombre}</span>
            {planNombre ? ` · plan ${planNombre}` : ''} — suscripción activa por 12 meses.
          </p>

          {/* URL de acceso privada */}
          <div className="card mt-8 border-accent/20 p-5 text-left shadow-2xl shadow-black/30">
            <p className="label mb-2">Tu página de acceso (compártela con tu equipo)</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 px-3 py-2.5 rounded-md bg-base-bg border border-border font-mono text-sm text-blueprint truncate">
                {urlAcceso}
              </code>
              <button onClick={copiar} className="btn btn-ghost shrink-0" type="button">
                <Copy size={15} /> {copiado ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-text-secondary mt-2">
              Cada empleado inicia sesión desde esta URL con su propio correo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => entrarALaApp(token)}
              className="btn btn-primary btn-lg"
              type="button"
            >
              Entrar a mi panel <ArrowRight size={17} />
            </button>
            <Link to={`/acceso/${empresa.slug}`} className="btn btn-ghost btn-lg">
              <ExternalLink size={16} /> Ver mi página de acceso
            </Link>
          </div>

          <p className="text-xs text-text-secondary mt-6">
            Modo demostración: no se realizó ningún cobro real.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
