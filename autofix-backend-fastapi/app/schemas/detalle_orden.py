"""Esquemas de DetalleOrden."""

from decimal import Decimal

from pydantic import BaseModel, Field


class DetalleOrdenCreate(BaseModel):
    repuestoId: int
    cantidad: int = Field(ge=1)


class DetalleOrdenUpdate(BaseModel):
    repuestoId: int | None = None
    cantidad: int | None = Field(default=None, ge=1)


class DetalleOrdenResponse(BaseModel):
    id: int
    repuestoId: int
    repuestoNombre: str
    cantidad: int
    precioUnitario: Decimal
    subtotalLinea: Decimal