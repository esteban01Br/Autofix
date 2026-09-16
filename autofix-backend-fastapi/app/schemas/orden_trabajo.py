"""Esquemas de OrdenTrabajo."""

from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import EstadoOrden
from app.schemas.detalle_orden import DetalleOrdenResponse
from app.schemas.mecanico import MecanicoResumen


class OrdenTrabajoCreate(BaseModel):
    vehiculoId: int
    mecanicoId: int | None = None
    diagnostico: str | None = Field(default=None, max_length=1000)
    observaciones: str | None = Field(default=None, max_length=1000)


class OrdenTrabajoUpdate(BaseModel):
    vehiculoId: int | None = None
    mecanicoId: int | None = None
    diagnostico: str | None = Field(default=None, max_length=1000)
    observaciones: str | None = Field(default=None, max_length=1000)


class OrdenTrabajoEstadoRequest(BaseModel):
    estado: EstadoOrden


class AsignarMecanicoRequest(BaseModel):
    mecanicoId: int


class OrdenTrabajoResponse(BaseModel):
    id: int
    fechaIngreso: datetime
    fechaSalida: datetime | None = None
    estado: EstadoOrden
    diagnostico: str | None = None
    observaciones: str | None = None
    mecanico: MecanicoResumen | None = None
    vehiculoId: int
    vehiculoPlaca: str | None = None
    detalles: list[DetalleOrdenResponse] = []
    tieneFactura: bool = False