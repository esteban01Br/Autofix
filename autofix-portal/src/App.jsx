import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Acceso = lazy(() => import('./pages/Acceso'));
const Comprar = lazy(() => import('./pages/Comprar'));
const Exito = lazy(() => import('./pages/Exito'));
const Legal = lazy(() => import('./pages/Legal'));
const Contacto = lazy(() => import('./pages/Contacto'));

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base-bg text-text-secondary text-sm">
          Cargando portal…
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/acceso/:slug" element={<Acceso />} />
        <Route path="/comprar/:planId" element={<Comprar />} />
        <Route path="/exito" element={<Exito />} />
        <Route path="/terminos" element={<Legal />} />
        <Route path="/privacidad" element={<Legal />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
