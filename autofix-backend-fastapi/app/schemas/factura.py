"""Esquemas de Factura."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


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