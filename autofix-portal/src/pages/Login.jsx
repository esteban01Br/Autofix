import { Link } from 'react-router-dom';
import { MousePointer2, Wrench } from 'lucide-react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FormLogin from '../components/FormLogin';
import Carro3D from '../components/Carro3D';

/** Login genérico del portal (plataforma, SUPERADMIN y accesos guardados). */
export default function Login() {
  return (
    <div className="flex min-h-screen flex-col bg-workshop">
      <Nav compacto />

      <main className="relative flex-1 overflow-hidden px-4 py-8 sm:py-10 lg:py-14">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/20 blur-[90px]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-info/10 blur-[100px]"
        />

        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
          {/* Escena del auto: primero en móvil, a la derecha en escritorio */}
          <div className="order-1 min-w-0 lg:order-2">
            <div className="mb-3 hidden items-end justify-between gap-4 lg:flex">
              <div>
                <p className="eyebrow">Panel en vivo</p>
                <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-text-primary">
                  Todo tu taller,{' '}
                  <span className="texto-degradado">en movimiento.</span>
                </h2>
              </div>
              <span className="badge inline-flex items-center gap-1.5 border border-accent/30 bg-accent-glow text-[#c9baff]">
                <MousePointer2 size={11} /> Interactivo
              </span>
            </div>

            <Carro3D />
          </div>

          {/* Formulario */}
          <div className="order-2 mx-auto w-full max-w-md animate-slide-up lg:order-1 lg:mx-0">
            <div className="mb-6 text-center lg:text-left">
              <div className="relative mx-auto mb-4 w-fit lg:mx-0">
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

            <div className="card login-card p-6 shadow-2xl shadow-black/40 sm:p-8">
              <FormLogin />
            </div>

            <p className="mt-6 text-center text-sm text-text-secondary lg:text-left">
              ¿Aún no tienes cuenta?{' '}
              <Link
                to="/comprar/basico"
                className="text-blueprint font-medium hover:text-frost"
              >
                Adquiere un plan
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
