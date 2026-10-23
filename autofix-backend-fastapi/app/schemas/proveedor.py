"""Esquemas de Proveedor."""

from pydantic import BaseModel, Field


class ProveedorCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    nit: str | None = Field(default=None, max_length=20)
    contacto: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=20)
    correo: str | None = Field(default=None, max_length=150)
    direccion: str | None = Field(default=None, max_length=200)
    activo: bool = True


class ProveedorUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    nit: str | None = Field(default=None, max_length=20)
    contacto: str | None = Field(default=None, max_length=150)
    telefono: str | None = Field(default=None, max_length=20)
    correo: str | None = Field(default=None, max_length=150)
    direccion: str | None = Field(default=None, max_length=200)
    activo: bool | None = None


class ProveedorResponse(BaseModel):
    id: int
    nombre: str
    nit: str | None = None
    contacto: str | None = None
    telefono: str | None = None
    correo: str | None = None
    direccion: str | None = None
    activo: bool = True
    repuestosAsociados: int = 0
