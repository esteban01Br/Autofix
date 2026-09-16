import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Vehiculos = lazy(() => import('./pages/Vehiculos'));
const Clientes = lazy(() => import('./pages/Clientes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Mecanicos = lazy(() => import('./pages/Mecanicos'));
const Citas = lazy(() => import('./pages/Citas'));
const Ordenes = lazy(() => import('./pages/Ordenes'));
const Repuestos = lazy(() => import('./pages/Repuestos'));
const Facturas = lazy(() => import('./pages/Facturas'));
const NoEncontrada = lazy(() => import('./pages/NoEncontrada'));

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
        <Route path="/login" element={<Login />} />

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
          <Route path="/facturas" element={<Facturas />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  );
}