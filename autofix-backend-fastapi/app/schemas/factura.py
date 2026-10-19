"""Esquemas de Factura."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import EstadoPagoFactura


class FacturaCreate(BaseModel):
    ordenTrabajoId: int


class FacturaResponse(BaseModel):
    id: int
    numero: str
    fecha: datetime
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    ordenTrabajoId: int
    vehiculoPlaca: str | None = None
    clienteNombre: str | None = None
    # Control de pagos (Fase 3): PENDIENTE, PARCIAL, PAGADA
    estadoPago: EstadoPagoFactura = EstadoPagoFactura.PENDIENTE
    montoPagado: Decimal = Decimal("0")
    saldo: Decimal = Decimal("0")