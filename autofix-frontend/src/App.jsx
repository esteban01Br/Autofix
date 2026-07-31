import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Vehiculos from './pages/Vehiculos';
import Clientes from './pages/Clientes';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout titulo="Panel" />
          </ProtectedRoute>
        }
      >
        <Route path="/vehiculos" element={<Vehiculos />} />
        <Route path="/clientes" element={<Clientes />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;