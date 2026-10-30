import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

const Login = lazy(() => import('./pages/Login'));
const RegistroEmpresa = lazy(() => import('./pages/RegistroEmpresa'));
const CambioContrasena = lazy(() => import('./pages/CambioContrasena'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehiculos = lazy(() => import('./pages/Vehiculos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Mecanicos = lazy(() => import('./pages/Mecanicos'));
const Citas = lazy(() => import('./pages/Citas'));
const Ordenes = lazy(() => import('./pages/Ordenes'));
const Repuestos = lazy(() => import('./pages/Repuestos'));
const Facturas = lazy(() => import('./pages/Facturas'));
const Empresas = lazy(() => import('./pages/Empresas'));
const MiEmpresa = lazy(() => import('./pages/MiEmpresa'));
const MisOrdenes = lazy(() => import('./pages/MisOrdenes'));
const Auditoria = lazy(() => import('./pages/Auditoria'));
const Productividad = lazy(() => import('./pages/Productividad'));
const Servicios = lazy(() => import('./pages/Servicios'));
const Cotizaciones = lazy(() => import('./pages/Cotizaciones'));
const Proveedores = lazy(() => import('./pages/Proveedores'));
const NoEncontrada = lazy(() => import('./pages/NoEncontrada'));

// El portal de ventas (app separada) concentra el login, el registro de
// empresas y la compra de suscripciones. En producción se usa la URL del portal.
const PORTAL_URL = import.meta.env.VITE_PORTAL_URL
  ? import.meta.env.VITE_PORTAL_URL.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:5174'
    : 'https://autofix-portal.pages.dev';

/**
 * Redirección al portal. Debe hacerse con `window.location.replace`:
 * React Router interpreta una URL absoluta como ruta interna y terminaba
 * en `/login/http://portal/...`.
 */
function RedirigirAlPortal({ ruta }) {
  useEffect(() => {
    if (PORTAL_URL) window.location.replace(`${PORTAL_URL}${ruta}`);
  }, [ruta]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-workshop text-sm text-muted">
      Abriendo el portal…
    </div>
  );
}

const titulos = {
  '/dashboard': 'Panel',
  '/usuarios': 'Usuarios',
  '/clientes': 'Clientes',
  '/vehiculos': 'Vehículos',
  '/citas': 'Citas',
  '/mecanicos': 'Mecánicos',
  '/ordenes': 'Órdenes de trabajo',
  '/repuestos': 'Repuestos',
  '/facturas': 'Facturas',
  '/empresas': 'Empresas',
  '/mi-empresa': 'Mi empresa',
  '/mis-ordenes': 'Mis órdenes',
  '/auditoria': 'Auditoría',
  '/productividad': 'Productividad',
  '/servicios': 'Servicios',
  '/cotizaciones': 'Cotizaciones',
  '/proveedores': 'Proveedores',
};

function ConTitulo() {
  const ubicacion = useLocation();
  const titulo = titulos[ubicacion.pathname] || 'AutoFix';
  return <DashboardLayout titulo={titulo} />;
}

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-base-bg text-text-secondary text-sm">
          Cargando aplicación...
        </div>
      }
    >
      <Routes>
        <Route
          path="/login"
          element={PORTAL_URL ? <RedirigirAlPortal ruta="/login" /> : <Login />}
        />
        <Route
          path="/registro-empresa"
          element={
            PORTAL_URL ? (
              <RedirigirAlPortal ruta="/comprar/basico" />
            ) : (
              <RegistroEmpresa />
            )
          }
        />
        <Route path="/cambiar-contrasena" element={<CambioContrasena />} />

        <Route
          element={
            <ProtectedRoute>
              <ConTitulo />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/usuarios" element={<ProtectedRoute roles={['ADMIN']}><Usuarios /></ProtectedRoute>} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/vehiculos" element={<Vehiculos />} />
          <Route path="/citas" element={<Citas />} />
          <Route path="/mecanicos" element={<ProtectedRoute roles={['ADMIN', 'MECANICO']}><Mecanicos /></ProtectedRoute>} />
          <Route path="/ordenes" element={<Ordenes />} />
          <Route path="/repuestos" element={<Repuestos />} />
          <Route path="/facturas" element={<ProtectedRoute roles={['ADMIN', 'GERENTE', 'CAJERO']}><Facturas /></ProtectedRoute>} />
          <Route path="/empresas" element={<ProtectedRoute roles={['SUPERADMIN']}><Empresas /></ProtectedRoute>} />
          <Route path="/mi-empresa" element={<ProtectedRoute roles={['ADMIN']}><MiEmpresa /></ProtectedRoute>} />
          <Route path="/mis-ordenes" element={<ProtectedRoute roles={['MECANICO']}><MisOrdenes /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute roles={['ADMIN', 'GERENTE']}><Auditoria /></ProtectedRoute>} />
          <Route path="/productividad" element={<ProtectedRoute roles={['ADMIN', 'GERENTE']}><Productividad /></ProtectedRoute>} />
          <Route path="/servicios" element={<ProtectedRoute roles={['ADMIN', 'GERENTE', 'ASESOR']}><Servicios /></ProtectedRoute>} />
        <Route path="/cotizaciones" element={<ProtectedRoute roles={['ADMIN', 'GERENTE']}><Cotizaciones /></ProtectedRoute>} />
        <Route path="/proveedores" element={<ProtectedRoute roles={['ADMIN', 'GERENTE', 'BODEGUERO']}><Proveedores /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  );
}