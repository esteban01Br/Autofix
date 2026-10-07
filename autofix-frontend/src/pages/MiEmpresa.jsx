import { useEffect, useState } from 'react';
import { Building2, Save, Palette } from 'lucide-react';
import { obtenerEmpresaActual, actualizarEmpresaActual } from '../services/empresaService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Spinner from '../components/Spinner';

const estadoInicial = {
  nombre: '',
  nit: '',
  direccion: '',
  telefono: '',
  correo: '',
  logo_url: '',
  color_primario: '#f59e0b',
  color_secundario: '#1f2937',
  iva_porcentaje: '19.00',
};

export default function MiEmpresa() {
  const [empresa, setEmpresa] = useState(null);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const { pushToast } = useToast();

  useEffect(() => {
    const cargar = async () => {
      try {
        const datos = await obtenerEmpresaActual();
        setEmpresa(datos);
        setFormulario({
          nombre: datos.nombre ?? '',
          nit: datos.nit ?? '',
          direccion: datos.direccion ?? '',
          telefono: datos.telefono ?? '',
          correo: datos.correo ?? '',
          logo_url: datos.logo_url ?? '',
          color_primario: datos.color_primario ?? '#f59e0b',
          color_secundario: datos.color_secundario ?? '#1f2937',
          iva_porcentaje: String(datos.iva_porcentaje ?? '19.00'),
        });
      } catch (err) {
        pushToast(extraerMensajeError(err, 'No se pudo cargar la empresa'), 'error');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const actualizada = await actualizarEmpresaActual({
        nombre: formulario.nombre.trim(),
        nit: formulario.nit.trim() || null,
        direccion: formulario.direccion.trim() || null,
        telefono: formulario.telefono.trim() || null,
        correo: formulario.correo.trim() || null,
        logo_url: formulario.logo_url.trim() || null,
        color_primario: formulario.color_primario,
        color_secundario: formulario.color_secundario,
        iva_porcentaje: formulario.iva_porcentaje,
      });
      setEmpresa(actualizada);
      pushToast('Datos de la empresa actualizados correctamente.');
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron guardar los cambios'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center gap-3 py-32 text-text-secondary">
        <Spinner size={22} className="text-accent" /> Cargando empresa...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titulo="Mi empresa"
        subtitulo={empresa ? `${empresa.nombre} · próxima factura FAC-${String(empresa.consecutivo_factura + 1).padStart(4, '0')}` : ''}
      />

      <form onSubmit={guardar} className="space-y-6 max-w-3xl">
        {/* Vista previa de la marca */}
        <div className="card p-5 flex items-center gap-4 animate-fade-in">
          <span
            className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0"
            style={{ backgroundColor: formulario.color_primario }}
          >
            {formulario.logo_url ? (
              <img src={formulario.logo_url} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              (formulario.nombre || 'A').charAt(0).toUpperCase()
            )}
          </span>
          <div>
            <p className="font-display text-xl font-bold text-text-primary">
              {formulario.nombre || 'Tu empresa'}
            </p>
            <p className="text-xs text-text-secondary">Vista previa de la marca</p>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <Building2 size={18} />
            <h3 className="font-display text-lg font-semibold text-text-primary">Datos generales</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Nombre de la empresa *</label>
              <input name="nombre" value={formulario.nombre} onChange={manejarCambio} className="input" required maxLength={150} />
            </div>
            <div>
              <label className="label">NIT</label>
              <input name="nit" value={formulario.nit} onChange={manejarCambio} className="input" maxLength={20} />
            </div>
            <div>
              <label className="label">Teléfono</label>
              <input name="telefono" value={formulario.telefono} onChange={manejarCambio} className="input" maxLength={20} />
            </div>
            <div>
              <label className="label">Correo de contacto</label>
              <input name="correo" type="email" value={formulario.correo} onChange={manejarCambio} className="input" maxLength={150} />
            </div>
            <div>
              <label className="label">Dirección</label>
              <input name="direccion" value={formulario.direccion} onChange={manejarCambio} className="input" maxLength={200} />
            </div>
            <div>
              <label className="label">IVA (%)</label>
              <input name="iva_porcentaje" type="number" min="0" max="100" step="0.01" value={formulario.iva_porcentaje} onChange={manejarCambio} className="input" required />
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-accent">
            <Palette size={18} />
            <h3 className="font-display text-lg font-semibold text-text-primary">Marca</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">URL del logo</label>
              <input name="logo_url" value={formulario.logo_url} onChange={manejarCambio} className="input" maxLength={500} placeholder="https://ejemplo.com/logo.png" />
            </div>
            <div>
              <label className="label">Color primario</label>
              <div className="flex items-center gap-3">
                <input type="color" name="color_primario" value={formulario.color_primario} onChange={manejarCambio} className="w-12 h-10 rounded-md border border-border bg-surface cursor-pointer" />
                <input name="color_primario" value={formulario.color_primario} onChange={manejarCambio} className="input font-mono flex-1" maxLength={7} />
              </div>
            </div>
            <div>
              <label className="label">Color secundario</label>
              <div className="flex items-center gap-3">
                <input type="color" name="color_secundario" value={formulario.color_secundario} onChange={manejarCambio} className="w-12 h-10 rounded-md border border-border bg-surface cursor-pointer" />
                <input name="color_secundario" value={formulario.color_secundario} onChange={manejarCambio} className="input font-mono flex-1" maxLength={7} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-primary" disabled={guardando}>
            {guardando ? (
              <>
                <Spinner size={16} /> Guardando...
              </>
            ) : (
              <>
                <Save size={16} /> Guardar cambios
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
