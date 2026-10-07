import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Building2, User, ArrowRight, ArrowLeft, Wrench, AlertCircle } from 'lucide-react';
import { registrarEmpresa } from '../services/empresaService';
import { useAuth } from '../context/AuthContext';
import { extraerMensajeError } from '../lib/utils';
import Spinner from '../components/Spinner';

const estadoInicial = {
  nombre_empresa: '',
  nit: '',
  direccion: '',
  telefono_empresa: '',
  nombre: '',
  apellido: '',
  correo: '',
  contrasena: '',
};

export default function RegistroEmpresa() {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { usuario } = useAuth();

  if (usuario) {
    return <Navigate to="/dashboard" replace />;
  }

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formulario.nombre_empresa.trim() || !formulario.nombre.trim() || !formulario.apellido.trim()) {
      setError('Completa el nombre de la empresa y tus nombres y apellidos.');
      return;
    }
    if (formulario.contrasena.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setCargando(true);
    try {
      const datos = await registrarEmpresa({
        nombre_empresa: formulario.nombre_empresa.trim(),
        nit: formulario.nit.trim() || null,
        direccion: formulario.direccion.trim() || null,
        telefono_empresa: formulario.telefono_empresa.trim() || null,
        nombre: formulario.nombre.trim(),
        apellido: formulario.apellido.trim(),
        correo: formulario.correo.trim(),
        contrasena: formulario.contrasena,
      });
      // Entra directo: el registro devuelve el token del dueño (ADMIN).
      localStorage.setItem('autofix_token', datos.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(extraerMensajeError(err, 'No se pudo registrar la empresa'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-bg flex items-center justify-center p-6">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center text-base-bg shadow-lg shadow-accent-glow">
            <Wrench size={22} />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-wide text-text-primary">
              AUTO<span className="text-accent">FIX</span>
            </h1>
            <p className="text-xs text-text-secondary">Registra tu taller en la plataforma</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 shadow-2xl shadow-black/30 space-y-6">
          {/* Datos de la empresa */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <Building2 size={18} />
              <h2 className="font-display text-lg font-semibold text-text-primary">Datos de tu empresa</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nombre de la empresa *</label>
                <input
                  name="nombre_empresa"
                  value={formulario.nombre_empresa}
                  onChange={manejarCambio}
                  className="input"
                  required
                  maxLength={150}
                  placeholder="Ej: Taller Los Andes"
                />
              </div>
              <div>
                <label className="label">NIT</label>
                <input name="nit" value={formulario.nit} onChange={manejarCambio} className="input" maxLength={20} placeholder="900.123.456-1" />
              </div>
              <div>
                <label className="label">Teléfono</label>
                <input name="telefono_empresa" value={formulario.telefono_empresa} onChange={manejarCambio} className="input" maxLength={20} placeholder="300 123 4567" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Dirección</label>
                <input name="direccion" value={formulario.direccion} onChange={manejarCambio} className="input" maxLength={200} placeholder="Calle 10 # 20-30" />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Datos del dueño */}
          <div>
            <div className="flex items-center gap-2 mb-4 text-accent">
              <User size={18} />
              <h2 className="font-display text-lg font-semibold text-text-primary">Tu usuario administrador</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Nombre *</label>
                <input name="nombre" value={formulario.nombre} onChange={manejarCambio} className="input" required maxLength={100} />
              </div>
              <div>
                <label className="label">Apellido *</label>
                <input name="apellido" value={formulario.apellido} onChange={manejarCambio} className="input" required maxLength={100} />
              </div>
              <div>
                <label className="label">Correo electrónico *</label>
                <input name="correo" type="email" value={formulario.correo} onChange={manejarCambio} className="input" required maxLength={150} placeholder="tucorreo@empresa.com" />
              </div>
              <div>
                <label className="label">Contraseña *</label>
                <input name="contrasena" type="password" value={formulario.contrasena} onChange={manejarCambio} className="input" required minLength={8} placeholder="Mínimo 8 caracteres" />
              </div>
            </div>
          </div>

          {error && (
            <div role="alert" className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Link to="/login" className="text-sm text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft size={14} /> Ya tengo cuenta
            </Link>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={cargando}>
              {cargando ? (
                <>
                  <Spinner size={16} /> Registrando empresa...
                </>
              ) : (
                <>
                  Crear mi empresa <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
