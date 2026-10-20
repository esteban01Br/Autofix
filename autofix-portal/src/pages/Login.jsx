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
            <span className="w-14 h-14 mx-auto rounded-2xl bg-accent flex items-center justify-center text-base-bg mb-4">
              <Wrench size={26} strokeWidth={2.5} />
            </span>
            <h1 className="titulo-seccion">Bienvenido de nuevo</h1>
            <p className="text-sm text-text-secondary mt-2">
              Ingresa con tu correo y contraseña para entrar a AutoFix.
            </p>
          </div>

          <div className="card p-6 sm:p-8">
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
