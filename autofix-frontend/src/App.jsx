import { Suspense, lazy } from 'react';
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
  '/empresas': 'Empresas',
  '/mi-empresa': 'Mi empresa',
  '/mis-ordenes': 'Mis órdenes',
  '/auditoria': 'Auditoría',
  '/productividad': 'Productividad',
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
        <Route path="/registro-empresa" element={<RegistroEmpresa />} />
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
          <Route path="/facturas" element={<Facturas />} />
          <Route path="/empresas" element={<ProtectedRoute roles={['SUPERADMIN']}><Empresas /></ProtectedRoute>} />
          <Route path="/mi-empresa" element={<ProtectedRoute roles={['ADMIN']}><MiEmpresa /></ProtectedRoute>} />
          <Route path="/mis-ordenes" element={<ProtectedRoute roles={['MECANICO']}><MisOrdenes /></ProtectedRoute>} />
          <Route path="/auditoria" element={<ProtectedRoute roles={['ADMIN', 'GERENTE']}><Auditoria /></ProtectedRoute>} />
          <Route path="/productividad" element={<ProtectedRoute roles={['ADMIN', 'GERENTE']}><Productividad /></ProtectedRoute>} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </Suspense>
  );
}