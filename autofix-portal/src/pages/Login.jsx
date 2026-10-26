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
                className="absolute inset-0 rounded-full bg-accent opacity-40 blur-2xl"
              />
              <span className="marca-violeta relative flex h-14 w-14 items-center justify-center rounded-full text-white">
                <Wrench size={26} strokeWidth={2.4} />
              </span>
            </div>
            <h1 className="font-display text-3xl font-medium tracking-tight sm:text-4xl">
              Bienvenido de nuevo
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              Ingresa con tu correo y contraseña para entrar a AutoFix.
            </p>
          </div>

          <div className="card p-6 shadow-2xl shadow-black/40 sm:p-8">
            <FormLogin />
          </div>

          <p className="text-center text-sm text-text-secondary mt-6">
            ¿Aún no tienes cuenta?{' '}
            <Link to="/comprar/basico" className="text-blueprint font-medium hover:text-frost">
              Adquiere un plan
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
