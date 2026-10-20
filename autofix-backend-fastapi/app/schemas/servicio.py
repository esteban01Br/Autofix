"""Esquemas de Servicio."""

from decimal import Decimal

from pydantic import BaseModel, Field


class ServicioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    duracion_minutos: int | None = Field(default=None, ge=0, le=1440)
    activo: bool = True


class ServicioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    descripcion: str | None = Field(default=None, max_length=500)
    precio: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    duracion_minutos: int | None = Field(default=None, ge=0, le=1440)
    activo: bool | None = None


class ServicioResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None
    precio: Decimal
    duracionMinutos: int | None = None
    activo: bool = True
