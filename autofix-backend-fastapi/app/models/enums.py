"""Enumerados del dominio de AutoFix."""

from enum import Enum


class Rol(str, Enum):
    SUPERADMIN = "SUPERADMIN"  # Dueño de la plataforma: ve todas las empresas
    ADMIN = "ADMIN"
    GERENTE = "GERENTE"      # Gerente de sucursal: gestiona su sucursal
    ASESOR = "ASESOR"        # Asesor de servicio: clientes, vehículos, citas
    MECANICO = "MECANICO"
    BODEGUERO = "BODEGUERO"  # Bodeguero: inventario y stock
    CAJERO = "CAJERO"        # Cajero: facturación y pagos
    CLIENTE = "CLIENTE"


class EstadoCita(str, Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"
    FINALIZADA = "FINALIZADA"


class EstadoOrden(str, Enum):
    RECIBIDO = "RECIBIDO"
    DIAGNOSTICO = "DIAGNOSTICO"
    EN_REPARACION = "EN_REPARACION"
    ESPERANDO_REPUESTOS = "ESPERANDO_REPUESTOS"
    LISTO = "LISTO"
    ENTREGADO = "ENTREGADO"


class EstadoCotizacion(str, Enum):
    """Ciclo de vida de una cotización.

    BORRADOR → ENVIADA → APROBADA / RECHAZADA / VENCIDA.
    """

    BORRADOR = "BORRADOR"
    ENVIADA = "ENVIADA"
    APROBADA = "APROBADA"
    RECHAZADA = "RECHAZADA"
    VENCIDA = "VENCIDA"


class MetodoPago(str, Enum):
    """Método de pago de un abono/pago de factura."""

    EFECTIVO = "EFECTIVO"
    TARJETA = "TARJETA"
    TRANSFERENCIA = "TRANSFERENCIA"
    OTRO = "OTRO"


class EstadoPagoFactura(str, Enum):
    """Estado de pago de una factura: PENDIENTE, PARCIAL, PAGADA."""

    PENDIENTE = "PENDIENTE"
    PARCIAL = "PARCIAL"
    PAGADA = "PAGADA"


class PlanSuscripcion(str, Enum):
    """Planes de suscripción del SaaS (catálogo del portal)."""

    BASICO = "BASICO"
    PRO = "PRO"
    PREMIUM = "PREMIUM"


class EstadoSuscripcion(str, Enum):
    """Estado de la suscripción de una empresa."""

    ACTIVA = "ACTIVA"
    VENCIDA = "VENCIDA"
    CANCELADA = "CANCELADA"