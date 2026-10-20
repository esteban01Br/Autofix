import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { KeyRound, Loader2, ShieldCheck } from 'lucide-react';
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
            {empresa.logo_url ? (
              <img
                src={empresa.logo_url}
                alt={empresa.nombre}
                className="w-16 h-16 mx-auto rounded-2xl object-cover border border-border mb-4"
              />
            ) : (
              <span
                className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 text-base-bg"
                style={{ background: empresa.color_primario }}
                aria-hidden
              >
                {empresa.nombre.trim().slice(0, 1).toUpperCase()}
              </span>
            )}
            <h1 className="titulo-seccion break-words" style={{ color: empresa.color_primario }}>
              {empresa.nombre}
            </h1>
            <p className="text-sm text-text-secondary mt-2 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} /> Acceso privado de tu taller
            </p>
          </div>

          <div
            className="card p-6 sm:p-8 border-t-2"
            style={{ borderTopColor: empresa.color_primario }}
          >
            <FormLogin slug={empresa.slug} />
          </div>

          <p className="text-center text-xs text-text-secondary mt-6">
            ¿No reconoces esta página?{' '}
            <Link to="/" className="hover:text-accent transition-colors">
              Vuelve al portal
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
