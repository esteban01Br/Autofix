"""Esquemas de Pago (abonos y pagos de facturas)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import MetodoPago


class PagoCreate(BaseModel):
    monto: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    metodo: MetodoPago = MetodoPago.EFECTIVO


class PagoResponse(BaseModel):
    id: int
    facturaId: int
    monto: Decimal
    metodo: MetodoPago
    fecha: datetime
    usuarioNombre: str | None = None
