"""Esquemas de Vehículo (incluye el resumen usado dentro de Cliente)."""

from pydantic import BaseModel, Field


class VehiculoResumen(BaseModel):
    id: int
    placa: str
    marca: str
    modelo: str


class VehiculoCreate(BaseModel):
    placa: str = Field(min_length=1, max_length=10)
    marca: str = Field(min_length=1, max_length=50)
    modelo: str = Field(min_length=1, max_length=50)
    anio: int | None = Field(default=None, ge=1950)
    color: str | None = Field(default=None, max_length=30)
    kilometraje: int | None = Field(default=None, ge=0)
    fotos: list[str] | None = Field(default=None, description="URLs de fotos del vehículo")
    clienteId: int


class VehiculoUpdate(BaseModel):
    placa: str | None = Field(default=None, min_length=1, max_length=10)
    marca: str | None = Field(default=None, min_length=1, max_length=50)
    modelo: str | None = Field(default=None, min_length=1, max_length=50)
    anio: int | None = Field(default=None, ge=1950)
    color: str | None = Field(default=None, max_length=30)
    kilometraje: int | None = Field(default=None, ge=0)
    fotos: list[str] | None = Field(default=None, description="URLs de fotos del vehículo")
    clienteId: int | None = None


class VehiculoResponse(BaseModel):
    id: int
    placa: str
    marca: str
    modelo: str
    anio: int | None = None
    color: str | None = None
    kilometraje: int | None = None
    fotos: list[str] | None = None
    clienteId: int
    clienteNombre: str | None = None