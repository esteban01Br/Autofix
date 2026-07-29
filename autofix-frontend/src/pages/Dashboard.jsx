import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { usuario, logout } = useAuth();

  return (
    <div>
      <h1>Dashboard AutoFix</h1>
      <p>Correo: {usuario?.correo}</p>
      <p>Rol: {usuario?.rol}</p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}