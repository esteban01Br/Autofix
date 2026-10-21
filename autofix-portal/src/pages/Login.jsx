import { Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FormLogin from '../components/FormLogin';

/** Login genérico del portal (plataforma, SUPERADMIN y accesos guardados). */
export default function Login() {
  return (
    <div className="min-h-screen flex flex-col bg-workshop">
      <Nav compacto />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="relative mx-auto mb-4 w-fit">
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-2xl bg-accent opacity-40 blur-2xl"
              />
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-hover via-accent to-[#d98200] text-base-bg shadow-xl">
                <Wrench size={26} strokeWidth={2.5} />
              </span>
            </div>
            <h1 className="titulo-seccion">Bienvenido de nuevo</h1>
            <p className="mt-2 text-sm text-text-secondary">
              Ingresa con tu correo y contraseña para entrar a AutoFix.
            </p>
          </div>

          <div className="card p-6 shadow-2xl shadow-black/40 sm:p-8">
            <FormLogin />
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/comprar/basico" className="text-accent font-semibold hover:underline">
              Adquiere un plan
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
