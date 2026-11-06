import { Mail, MapPin, Building2 } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import { NEGOCIO } from '../config/negocio';

/** Texto visible cuando un dato del negocio aún no se ha completado. */
const pendiente = '[PENDIENTE: completar en src/config/negocio.js]';

/** Página pública de contacto del portal. */
export default function Contacto() {
  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3 mb-2 text-accent">
            <Mail size={22} />
            <span className="font-mono text-[10px] uppercase tracking-[0.16em]">
              AutoFix · Contacto
            </span>
          </div>
          <h1 className="titulo-seccion">Contacto</h1>
          <p className="mt-4 text-text-secondary leading-relaxed">
            Escríbenos si tienes dudas sobre AutoFix, el funcionamiento de tu cuenta o el
            tratamiento de tus datos personales.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <section className="card p-6">
              <div className="flex items-center gap-2 text-accent">
                <Building2 size={17} />
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  Responsable del servicio
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {NEGOCIO.nombre || pendiente}
              </p>
              <p className="mt-2 text-xs text-muted">
                [PENDIENTE: revisar con abogado]
              </p>
            </section>

            <section className="card p-6">
              <div className="flex items-center gap-2 text-accent">
                <Mail size={17} />
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  Correo de contacto
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {NEGOCIO.correoContacto ? (
                  <a
                    href={`mailto:${NEGOCIO.correoContacto}`}
                    className="text-accent hover:underline"
                  >
                    {NEGOCIO.correoContacto}
                  </a>
                ) : (
                  pendiente
                )}
              </p>
              <p className="mt-2 text-xs text-muted">
                [PENDIENTE: revisar con abogado]
              </p>
            </section>

            <section className="card p-6 sm:col-span-2">
              <div className="flex items-center gap-2 text-accent">
                <MapPin size={17} />
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  Ciudad
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {NEGOCIO.ciudad || pendiente}
              </p>
            </section>
          </div>

          <p className="mt-8 text-xs text-muted">
            [PENDIENTE: revisar con abogado] Este documento es una base de trabajo y
            debe completarse con los datos reales del responsable antes de publicar el
            portal.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
