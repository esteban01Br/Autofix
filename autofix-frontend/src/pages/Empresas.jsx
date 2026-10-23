import { useEffect, useState } from 'react';
import { Building2, Power, Search, CreditCard } from 'lucide-react';
import { listarEmpresas, cambiarEstadoEmpresa } from '../services/empresaService';
import { gestionarSuscripcion } from '../services/suscripcionService';
import Badge from '../components/Badge';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';

export default function Empresas() {
  const [empresas, setEmpresas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  // Panel SUPERADMIN: gestión de la suscripción de una empresa.
  const [suscripcionDe, setSuscripcionDe] = useState(null);
  const [formSuscripcion, setFormSuscripcion] = useState({ plan: 'BASICO', dias: 365, estado: 'ACTIVA' });
  const [guardando, setGuardando] = useState(false);
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarEmpresas();
      setEmpresas(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar las empresas'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const alternarEstado = async (empresa) => {
    try {
      const actualizada = await cambiarEstadoEmpresa(empresa.id, !empresa.activa);
      setEmpresas((prev) => prev.map((e) => (e.id === empresa.id ? actualizada : e)));
      pushToast(
        actualizada.activa
          ? `Empresa "${actualizada.nombre}" activada.`
          : `Empresa "${actualizada.nombre}" suspendida. Sus usuarios conservan sus datos.`
      );
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo cambiar el estado'), 'error');
    }
  };

  const abrirGestion = (empresa) => {
    const sus = empresa.suscripcion;
    setSuscripcionDe(empresa);
    setFormSuscripcion({
      plan: sus?.plan ?? 'BASICO',
      dias: 365,
      estado: sus?.estado ?? 'ACTIVA',
    });
  };

  const guardarSuscripcion = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const gestionada = await gestionarSuscripcion(suscripcionDe.id, {
        plan: formSuscripcion.plan,
        dias: Number(formSuscripcion.dias),
        estado: formSuscripcion.estado,
      });
      setEmpresas((prev) =>
        prev.map((emp) => (emp.id === suscripcionDe.id ? { ...emp, suscripcion: gestionada } : emp))
      );
      pushToast(`Suscripción de "${suscripcionDe.nombre}" actualizada.`);
      setSuscripcionDe(null);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo gestionar la suscripción'), 'error');
    } finally {
      setGuardando(false);
    }
  };

  const filtradas = empresas.filter((e) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return `${e.nombre} ${e.nit ?? ''} ${e.correo ?? ''}`.toLowerCase().includes(texto);
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Empresas de la plataforma" subtitulo={`${empresas.length} empresas registradas`} />

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, NIT o correo..."
          className="input pl-9"
        />
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtradas.length === 0 ? (
          <EmptyState
            icono={Building2}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay empresas registradas todavía.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Empresa</th>
                  <th className="py-3 px-4 font-medium">NIT</th>
                  <th className="py-3 px-4 font-medium">Contacto</th>
                  <th className="py-3 px-4 font-medium">Plan</th>
                  <th className="py-3 px-4 font-medium">Suscripción</th>
                  <th className="py-3 px-4 font-medium text-center">Estado</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtradas.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                          style={{ backgroundColor: e.color_primario }}
                        >
                          {e.nombre.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-medium">{e.nombre}</p>
                          <p className="text-xs text-text-secondary">
                            Desde {new Date(e.fecha_creacion).toLocaleDateString('es-CO')}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-text-secondary">{e.nit ?? '—'}</td>
                    <td className="py-3 px-4 text-text-secondary">
                      {e.correo ?? '—'}
                      {e.telefono && <span className="block text-xs">{e.telefono}</span>}
                    </td>
                    <td className="py-3 px-4">
                      {e.suscripcion ? <Badge valor={e.suscripcion.plan} /> : <span className="text-text-secondary">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      {e.suscripcion ? (
                        <div className="flex flex-col gap-1">
                          <Badge valor={e.suscripcion.estado} />
                          <span className="text-xs text-text-secondary">
                            {e.suscripcion.vigente
                              ? `${e.suscripcion.diasRestantes} días restantes`
                              : `Venció ${new Date(e.suscripcion.fechaFin).toLocaleDateString('es-CO')}`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">Sin suscripción</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${e.activa ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                        {e.activa ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => abrirGestion(e)}
                        className="p-1.5 text-text-secondary hover:text-accent transition-colors"
                        title="Gestionar suscripción"
                      >
                        <CreditCard size={16} />
                      </button>
                      <button
                        onClick={() => alternarEstado(e)}
                        className={`p-1.5 transition-colors ${e.activa ? 'text-text-secondary hover:text-danger' : 'text-text-secondary hover:text-success'}`}
                        title={e.activa ? 'Suspender empresa' : 'Activar empresa'}
                      >
                        <Power size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        abierto={suscripcionDe !== null}
        onCerrar={() => setSuscripcionDe(null)}
        titulo={`Suscripción de ${suscripcionDe?.nombre ?? ''}`}
        tamanio="max-w-md"
      >
        <form onSubmit={guardarSuscripcion} className="space-y-4">
          <div>
            <label className="label">Plan</label>
            <select
              value={formSuscripcion.plan}
              onChange={(e) => setFormSuscripcion((f) => ({ ...f, plan: e.target.value }))}
              className="input"
            >
              <option value="BASICO">Básico</option>
              <option value="PRO">Pro</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          <div>
            <label className="label">Días de vigencia</label>
            <input
              type="number"
              min="0"
              max="3650"
              value={formSuscripcion.dias}
              onChange={(e) => setFormSuscripcion((f) => ({ ...f, dias: e.target.value }))}
              className="input"
              required
            />
            <p className="mt-1 text-xs text-text-secondary">
              La vigencia se calcula desde hoy (o desde la fecha vigente si sigue activa).
            </p>
          </div>

          <div>
            <label className="label">Estado</label>
            <select
              value={formSuscripcion.estado}
              onChange={(e) => setFormSuscripcion((f) => ({ ...f, estado: e.target.value }))}
              className="input"
            >
              <option value="ACTIVA">Activa</option>
              <option value="VENCIDA">Vencida (bloquea el acceso)</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>

          {suscripcionDe?.suscripcion && (
            <p className="text-xs text-text-secondary">
              Vigencia actual:{' '}
              {suscripcionDe.suscripcion.vigente
                ? `${suscripcionDe.suscripcion.diasRestantes} días restantes`
                : `venció el ${new Date(suscripcionDe.suscripcion.fechaFin).toLocaleDateString('es-CO')}`}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setSuscripcionDe(null)} className="btn btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar suscripción'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
