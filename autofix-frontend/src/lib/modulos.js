import {
  BarChart3,
  Building2,
  Calendar,
  Car,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Receipt,
  ShieldCheck,
  Store,
  Truck,
  UserCog,
  Users,
  Wrench,
} from 'lucide-react';

const TODOS = [
  'SUPERADMIN',
  'ADMIN',
  'GERENTE',
  'ASESOR',
  'MECANICO',
  'BODEGUERO',
  'CAJERO',
  'CLIENTE',
];

/**
 * Catálogo único de módulos de la app.
 * Lo usan el sidebar, el buscador del encabezado y el panel de módulos.
 */
export const MODULOS = [
  {
    titulo: 'General',
    descripcion: 'Vista general y configuración del taller',
    items: [
      {
        to: '/dashboard',
        label: 'Panel',
        icon: LayoutDashboard,
        roles: TODOS,
        desc: 'Vista general del taller',
        claves: ['inicio', 'dashboard', 'resumen', 'métricas', 'panel'],
      },
      {
        to: '/empresas',
        label: 'Empresas',
        icon: Building2,
        roles: ['SUPERADMIN'],
        desc: 'Gestión multi-empresa',
        claves: ['empresa', 'sucursal', 'tenant', 'clientes saas'],
      },
      {
        to: '/mi-empresa',
        label: 'Mi empresa',
        icon: Store,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Configuración de taller',
        claves: ['marca', 'logo', 'colores', 'datos del taller', 'configuración'],
      },
    ],
  },
  {
    titulo: 'Operación',
    descripcion: 'Clientes, vehículos y trabajo diario',
    items: [
      {
        to: '/clientes',
        label: 'Clientes',
        icon: UserCog,
        roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO'],
        desc: 'Base de clientes',
        claves: ['cliente', 'contacto', 'propietario', 'personas'],
      },
      {
        to: '/vehiculos',
        label: 'Vehículos',
        icon: Car,
        roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'],
        desc: 'Registro de vehículos',
        claves: ['vehículo', 'carro', 'auto', 'placa', 'marca', 'modelo'],
      },
      {
        to: '/citas',
        label: 'Citas',
        icon: Calendar,
        roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO', 'CLIENTE'],
        desc: 'Agenda del taller',
        claves: ['cita', 'agenda', 'calendario', 'turno', 'reserva'],
      },
      {
        to: '/ordenes',
        label: 'Órdenes',
        icon: Wrench,
        roles: ['ADMIN', 'GERENTE', 'ASESOR', 'MECANICO'],
        desc: 'Órdenes de trabajo',
        claves: ['orden', 'trabajo', 'reparación', 'taller', 'servicio'],
      },
      {
        to: '/mis-ordenes',
        label: 'Mis órdenes',
        icon: Wrench,
        roles: ['MECANICO'],
        desc: 'Órdenes asignadas',
        claves: ['orden', 'asignadas', 'mecánico', 'trabajo'],
      },
      {
        to: '/repuestos',
        label: 'Repuestos',
        icon: Package,
        roles: ['ADMIN', 'GERENTE', 'BODEGUERO', 'MECANICO'],
        desc: 'Inventario de repuestos',
        claves: ['repuesto', 'inventario', 'stock', 'bodega', 'producto'],
      },
      {
        to: '/proveedores',
        label: 'Proveedores',
        icon: Truck,
        roles: ['ADMIN', 'GERENTE', 'BODEGUERO'],
        desc: 'Proveedores',
        claves: ['proveedor', 'compra', 'distribuidor', 'suministro'],
      },
      {
        to: '/servicios',
        label: 'Servicios',
        icon: ClipboardList,
        roles: ['ADMIN', 'GERENTE', 'ASESOR'],
        desc: 'Catálogo de servicios',
        claves: ['servicio', 'catálogo', 'mano de obra', 'precio', 'tarifa'],
      },
      {
        to: '/cotizaciones',
        label: 'Cotizaciones',
        icon: FileText,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Presupuestos',
        claves: ['cotización', 'presupuesto', 'propuesta', 'precio'],
      },
    ],
  },
  {
    titulo: 'Equipo',
    descripcion: 'Personas e indicadores del taller',
    items: [
      {
        to: '/usuarios',
        label: 'Usuarios',
        icon: Users,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Gestión de usuarios',
        claves: ['usuario', 'equipo', 'roles', 'permisos', 'empleados'],
      },
      {
        to: '/mecanicos',
        label: 'Mecánicos',
        icon: Wrench,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Equipo mecánico',
        claves: ['mecánico', 'técnico', 'especialidad', 'equipo'],
      },
      {
        to: '/productividad',
        label: 'Productividad',
        icon: BarChart3,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Indicadores',
        claves: ['productividad', 'indicadores', 'reportes', 'estadísticas'],
      },
    ],
  },
  {
    titulo: 'Administración',
    descripcion: 'Cobros y trazabilidad',
    items: [
      {
        to: '/facturas',
        label: 'Facturas',
        icon: Receipt,
        roles: ['ADMIN', 'GERENTE', 'CAJERO'],
        desc: 'Facturación y cobros',
        claves: ['factura', 'cobro', 'pago', 'cartera', 'recibo'],
      },
      {
        to: '/auditoria',
        label: 'Auditoría',
        icon: ShieldCheck,
        roles: ['ADMIN', 'GERENTE'],
        desc: 'Trazabilidad',
        claves: ['auditoría', 'historial', 'logs', 'movimientos', 'trazabilidad'],
      },
    ],
  },
];

const normalizar = (texto) =>
  (texto || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

/** Módulos visibles para un rol, conservando el agrupamiento. */
export const modulosVisibles = (rol) =>
  MODULOS.map((seccion) => ({
    ...seccion,
    items: seccion.items.filter((item) => item.roles.includes(rol)),
  })).filter((seccion) => seccion.items.length > 0);

/** Lista plana (con la sección a la que pertenece cada módulo). */
export const todosLosModulos = (rol) =>
  modulosVisibles(rol).flatMap((seccion) =>
    seccion.items.map((item) => ({ ...item, seccion: seccion.titulo })),
  );

/** Busca módulos por etiqueta, descripción o palabras clave. */
export const buscarModulos = (rol, consulta) => {
  const texto = normalizar(consulta).trim();
  if (!texto) return todosLosModulos(rol);
  return todosLosModulos(rol).filter((item) => {
    const contenido = normalizar(
      [item.label, item.desc, item.seccion, ...(item.claves || [])].join(' '),
    );
    return texto.split(/\s+/).every((parte) => contenido.includes(parte));
  });
};
