import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { empresaPublica } from '../services/authService';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FormLogin from '../components/FormLogin';

/**
 * Página de acceso privada de una empresa: /acceso/{slug}.
 * Muestra el nombre y los colores de la empresa (branding público)
 * y el login vinculado a esa empresa.
 */
export default function Acceso() {
  const { slug } = useParams();
  const [empresa, setEmpresa] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setNoExiste(false);
    setEmpresa(null);
    empresaPublica(slug)
      .then((datos) => vivo && setEmpresa(datos))
      .catch(() => vivo && setNoExiste(true))
      .finally(() => vivo && setCargando(false));
    return () => {
      vivo = false;
    };
  }, [slug]);

  if (cargando) {
    return (
      <div className="min-h-screen flex flex-col bg-workshop">
        <Nav compacto />
        <main className="flex-1 flex items-center justify-center gap-3 text-text-secondary text-sm">
          <Loader2 size={20} className="animate-spin text-accent" />
          Cargando tu página…
        </main>
        <Footer />
      </div>
    );
  }

  if (noExiste || !empresa) {
    return (
      <div className="min-h-screen flex flex-col bg-workshop">
        <Nav compacto />
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="card max-w-md w-full p-8 text-center animate-scale-in">
            <span className="w-14 h-14 mx-auto rounded-full bg-danger-glow flex items-center justify-center text-danger mb-4">
              <KeyRound size={26} />
            </span>
            <h1 className="font-display text-2xl font-bold uppercase">
              Página no encontrada
            </h1>
            <p className="text-sm text-text-secondary mt-3">
              No existe una empresa registrada en este enlace. Pide a tu
              administrador la dirección correcta de acceso.
            </p>
            <div className="flex flex-col gap-3 mt-6">
              <Link to="/login" className="btn btn-primary">
                Ir al login general
              </Link>
              <Link to="/" className="btn btn-ghost">
                Volver al inicio
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          {/* Marca de la empresa (branding de su página privada) */}
          <div className="text-center mb-6">
            <div className="relative mx-auto mb-4 w-fit">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl opacity-40 blur-2xl"
                style={{ background: empresa.color_primario }}
              />
              {empresa.logo_url ? (
                <img
                  src={empresa.logo_url}
                  alt={empresa.nombre}
                  className="relative h-16 w-16 rounded-2xl border border-white/10 object-cover shadow-xl"
                />
              ) : (
                <span
                  className="relative flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-base-bg shadow-xl ring-1 ring-white/15"
                  style={{ background: empresa.color_primario }}
                  aria-hidden="true"
                >
                  {empresa.nombre.trim().slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-base-bg bg-success text-base-bg">
                <ShieldCheck size={12} />
              </span>
            </div>
            <h1
              className="break-words font-display text-3xl font-bold tracking-wide"
              style={{ color: empresa.color_primario }}
            >
              {empresa.nombre}
            </h1>
            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-secondary">
              <Lock size={12} /> Acceso privado de tu taller
            </p>
          </div>

          <div
            className="card border-t-2 p-6 shadow-2xl shadow-black/40 sm:p-8"
            style={{ borderTopColor: empresa.color_primario }}
          >
            <FormLogin slug={empresa.slug} />
          </div>

          <p className="mt-6 text-center text-xs text-text-secondary">
            ¿No reconoces esta página?{' '}
            <Link to="/" className="transition-colors hover:text-accent">
              Vuelve al portal
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
