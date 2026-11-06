import { useState } from 'react';
import { Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import { descargarExportacion, descargarTodo } from '../services/exportarService';

/** Obtiene el nombre del archivo desde Content-Disposition o usa uno genérico. */
function nombreDesdeCabeceras(headers, respaldo) {
  const disposicion = headers?.['content-disposition'] ?? '';
  const coincidencia = disposicion.match(/filename="?([^";]+)"?/i);
  return coincidencia ? coincidencia[1] : respaldo;
}

function guardarBlob(data, nombre) {
  const url = URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Botón de descarga visible SOLO para ADMIN.
 * Descarga una entidad a CSV o, con `todo`, el ZIP de toda la empresa.
 */
export default function BotonExportar({
  entidad,
  todo = false,
  desde,
  hasta,
  etiqueta = 'Exportar',
}) {
  const { usuario } = useAuth();
  const { pushToast } = useToast();
  const [cargando, setCargando] = useState(false);

  if (usuario?.rol !== 'ADMIN') return null;

  const manejarClick = async () => {
    setCargando(true);
    try {
      const respuesta = todo
        ? await descargarTodo({ desde, hasta })
        : await descargarExportacion(entidad, { desde, hasta });
      const nombre = nombreDesdeCabeceras(
        respuesta.headers,
        todo ? 'autofix_datos.zip' : `autofix_${entidad}.csv`
      );
      guardarBlob(respuesta.data, nombre);
      pushToast('Descarga generada correctamente.');
    } catch (err) {
      pushToast(
        extraerMensajeError(err, 'No se pudo generar la exportación.'),
        'error'
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <button
      type="button"
      onClick={manejarClick}
      disabled={cargando}
      className="btn btn-ghost"
      title="Descargar en CSV"
    >
      <Download size={16} />
      {cargando ? 'Exportando...' : etiqueta}
    </button>
  );
}
