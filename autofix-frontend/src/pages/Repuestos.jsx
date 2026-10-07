import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Package, ArrowDownToLine, ArrowUpFromLine, ScanBarcode } from 'lucide-react';
import { listarRepuestos, crearRepuesto, actualizarRepuesto, ajustarStockRepuesto, eliminarRepuesto, buscarPorCodigo } from '../services/repuestoService';
import { useToast } from '../context/ToastContext';
import { extraerMensajeError, formatearMoneda } from '../lib/utils';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import EscanerCodigo from '../components/EscanerCodigo';

const estadoInicial = { nombre: '', descripcion: '', codigo_barras: '', stock: 0, precio: '' };
const stockInicial = { cantidad: 1, tipo: 'entrada' };

export default function Repuestos() {
  const [repuestos, setRepuestos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(estadoInicial);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [eliminarId, setEliminarId] = useState(null);
  const [ajuste, setAjuste] = useState(null);
  const [stockForm, setStockForm] = useState(stockInicial);
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [modoEscaneo, setModoEscaneo] = useState('buscar'); // 'buscar' | 'formulario'
  const { pushToast } = useToast();

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await listarRepuestos({ busqueda: busqueda || undefined });
      setRepuestos(datos);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudieron cargar los repuestos'), 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(cargar, 250);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const abrirCrear = () => {
    setEditando(null);
    setFormulario(estadoInicial);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEditar = (r) => {
    setEditando(r);
    setFormulario({
      nombre: r.nombre,
      descripcion: r.descripcion ?? '',
      codigo_barras: r.codigo_barras ?? '',
      stock: r.stock,
      precio: String(r.precio),
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirEscaner = (modo) => {
    setModoEscaneo(modo);
    setEscanerAbierto(true);
  };

  /* Flujo principal del escáner: si el código ya existe se ofrece ajustar
     el stock; si es nuevo, se abre el formulario con el código listo. */
  const alDetectarCodigo = async (codigo) => {
    setEscanerAbierto(false);

    if (modoEscaneo === 'formulario') {
      setFormulario((f) => ({ ...f, codigo_barras: codigo }));
      pushToast(`Código capturado: ${codigo}`);
      return;
    }

    try {
      const existente = await buscarPorCodigo(codigo);
      pushToast(`"${existente.nombre}" ya está registrado · ajusta su stock si llegó mercancía.`);
      abrirAjuste(existente);
    } catch (err) {
      if (err.response?.status === 404) {
        setEditando(null);
        setFormulario({ ...estadoInicial, codigo_barras: codigo });
        setErrorForm('');
        setModalAbierto(true);
        pushToast('Código nuevo: completa los datos para registrar el repuesto.');
      } else {
        pushToast(extraerMensajeError(err, 'No se pudo buscar el código'), 'error');
      }
    }
  };

  const abrirAjuste = (r) => {
    setAjuste(r);
    setStockForm(stockInicial);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setFormulario((f) => ({ ...f, [name]: value }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    setErrorForm('');
    try {
      const datos = {
        nombre: formulario.nombre.trim(),
        descripcion: formulario.descripcion || null,
        codigo_barras: formulario.codigo_barras.trim() || null,
        stock: Number(formulario.stock),
        precio: String(formulario.precio),
      };
      if (editando) {
        await actualizarRepuesto(editando.id, datos);
        pushToast('Repuesto actualizado correctamente.');
      } else {
        await crearRepuesto(datos);
        pushToast('Repuesto creado correctamente.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(extraerMensajeError(err, 'No se pudo guardar el repuesto'));
    } finally {
      setGuardando(false);
    }
  };

  const guardarAjuste = async (e) => {
    e.preventDefault();
    if (!ajuste) return;
    try {
      const cantidad = stockForm.tipo === 'salida' ? -Number(stockForm.cantidad) : Number(stockForm.cantidad);
      const actualizado = await ajustarStockRepuesto(ajuste.id, cantidad);
      setRepuestos((prev) => prev.map((r) => (r.id === ajuste.id ? actualizado : r)));
      pushToast(`Stock ajustado · ${stockForm.tipo === 'entrada' ? '+' : '−'}${Math.abs(cantidad)}`);
      setAjuste(null);
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo ajustar el stock'), 'error');
    }
  };

  const confirmarEliminar = async () => {
    try {
      await eliminarRepuesto(eliminarId);
      pushToast('Repuesto eliminado.');
      cargar();
    } catch (err) {
      pushToast(extraerMensajeError(err, 'No se pudo eliminar el repuesto'), 'error');
    }
  };

  const filtrados = repuestos.filter((r) => {
    const texto = busqueda.trim().toLowerCase();
    const coincideTexto = !texto || `${r.nombre} ${r.descripcion ?? ''}`.toLowerCase().includes(texto);
    const coincideStock =
      filtroStock === 'todos' ||
      (filtroStock === 'agotados' && r.stock === 0) ||
      (filtroStock === 'bajos' && r.stock > 0 && r.stock < 10) ||
      (filtroStock === 'ok' && r.stock >= 10);
    return coincideTexto && coincideStock;
  });

  return (
    <div className="space-y-6">
      <PageHeader titulo="Inventario de repuestos" subtitulo={`${repuestos.length} repuestos`}>
        <button onClick={() => abrirEscaner('buscar')} className="btn btn-ghost">
          <ScanBarcode size={16} /> Escanear
        </button>
        <button onClick={abrirCrear} className="btn btn-primary">
          <Plus size={16} /> Nuevo repuesto
        </button>
      </PageHeader>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="input pl-9"
          />
        </div>
        <select value={filtroStock} onChange={(e) => setFiltroStock(e.target.value)} className="input sm:w-48">
          <option value="todos">Todo el inventario</option>
          <option value="agotados">Agotados</option>
          <option value="bajos">Stock bajo (&lt; 10)</option>
          <option value="ok">Stock suficiente</option>
        </select>
      </div>

      <div className="card overflow-hidden animate-fade-in">
        {cargando ? (
          <div className="flex items-center justify-center gap-3 py-20 text-text-secondary">
            <Spinner size={22} className="text-accent" /> Cargando...
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            icono={Package}
            mensaje={busqueda ? 'Sin resultados para tu búsqueda.' : 'No hay repuestos registrados.'}
            accionLabel="Crear repuesto"
            accionClick={abrirCrear}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-text-secondary border-b border-border bg-surface-hover/30">
                  <th className="py-3 px-4 font-medium">Repuesto</th>
                  <th className="py-3 px-4 font-medium">Descripción</th>
                  <th className="py-3 px-4 font-medium text-center">Stock</th>
                  <th className="py-3 px-4 font-medium text-right">Precio</th>
                  <th className="py-3 px-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-text-primary">
                {filtrados.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-surface-hover/40 transition-colors">
                    <td className="py-3 px-4 font-medium">
                      {r.nombre}
                      {r.codigo_barras && (
                        <span className="block text-xs font-mono text-text-secondary font-normal">
                          {r.codigo_barras}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-text-secondary max-w-xs truncate">{r.descripcion ?? '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`badge ${r.stock === 0 ? 'text-danger bg-danger/10' : r.stock < 10 ? 'text-warning bg-warning/10' : 'text-success bg-success/10'}`}>
                        {r.stock === 0 ? 'Agotado' : r.stock < 10 ? `${r.stock} · bajo` : r.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-accent">{formatearMoneda(r.precio)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button onClick={() => abrirAjuste(r)} className="p-1.5 text-text-secondary hover:text-success transition-colors" title="Ajustar stock">
                        <ArrowDownToLine size={16} />
                      </button>
                      <button onClick={() => abrirEditar(r)} className="p-1.5 text-text-secondary hover:text-accent transition-colors ml-1" title="Editar">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => setEliminarId(r.id)} className="p-1.5 text-text-secondary hover:text-danger transition-colors ml-1" title="Eliminar">
                        <Trash2 size={16} />
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
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        titulo={editando ? `Editar repuesto · ${editando.nombre}` : 'Nuevo repuesto'}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="label">Nombre *</label>
            <input name="nombre" value={formulario.nombre} onChange={manejarCambio} className="input" required maxLength={150} />
          </div>
          <div>
            <label className="label">Código de barras</label>
            <div className="flex gap-2">
              <input
                name="codigo_barras"
                value={formulario.codigo_barras}
                onChange={manejarCambio}
                className="input font-mono flex-1"
                maxLength={50}
                placeholder="Ej: 7501234567890"
              />
              <button
                type="button"
                onClick={() => abrirEscaner('formulario')}
                className="btn btn-ghost shrink-0"
                title="Escanear con la cámara"
              >
                <ScanBarcode size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="label">Descripción</label>
            <textarea name="descripcion" value={formulario.descripcion} onChange={manejarCambio} className="input min-h-20 resize-y" maxLength={500} placeholder="Detalles del repuesto..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Stock *</label>
              <input name="stock" type="number" min="0" value={formulario.stock} onChange={manejarCambio} className="input" required />
            </div>
            <div>
              <label className="label">Precio unitario *</label>
              <input name="precio" type="number" min="0.01" step="0.01" value={formulario.precio} onChange={manejarCambio} className="input" required placeholder="0.00" />
            </div>
          </div>

          {errorForm && (
            <div className="p-3 rounded-lg bg-danger/10 border border-danger/30 text-sm text-danger animate-fade-in">{errorForm}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalAbierto(false)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear repuesto'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        abierto={ajuste !== null}
        onCerrar={() => setAjuste(null)}
        titulo={`Ajustar stock · ${ajuste?.nombre ?? ''}`}
        tamanio="max-w-sm"
      >
        <form onSubmit={guardarAjuste} className="space-y-4">
          <div className="flex items-center gap-3">
            <ArrowUpFromLine size={18} className={stockForm.tipo === 'salida' ? 'text-danger' : 'text-text-secondary'} />
            <span className="text-sm text-text-secondary">
              Stock actual: <span className="font-mono font-semibold text-text-primary">{ajuste?.stock}</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStockForm((s) => ({ ...s, tipo: 'entrada' }))}
              className={`btn ${stockForm.tipo === 'entrada' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Entrada +
            </button>
            <button
              type="button"
              onClick={() => setStockForm((s) => ({ ...s, tipo: 'salida' }))}
              className={`btn ${stockForm.tipo === 'salida' ? 'btn-danger' : 'btn-ghost'}`}
            >
              Salida −
            </button>
          </div>
          <div>
            <label className="label">Cantidad *</label>
            <input
              type="number"
              min="1"
              value={stockForm.cantidad}
              onChange={(e) => setStockForm((s) => ({ ...s, cantidad: e.target.value }))}
              className="input"
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAjuste(null)} className="btn btn-ghost">Cancelar</button>
            <button type="submit" className="btn btn-primary">Aplicar ajuste</button>
          </div>
        </form>
      </Modal>

      <EscanerCodigo
        abierto={escanerAbierto}
        onCerrar={() => setEscanerAbierto(false)}
        onDetectado={alDetectarCodigo}
      />

      <ConfirmDialog
        abierto={eliminarId !== null}
        onCerrar={() => setEliminarId(null)}
        onConfirmar={confirmarEliminar}
        titulo="Eliminar repuesto"
        mensaje="No se puede eliminar si está asociado a detalles de órdenes de trabajo."
      />
    </div>
  );
}