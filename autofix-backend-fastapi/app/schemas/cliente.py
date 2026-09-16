"""Esquemas de Cliente."""

from pydantic import BaseModel, Field

from app.schemas.usuario import UsuarioResponse
from app.schemas.vehiculo import VehiculoResumen


class ClienteCreate(BaseModel):
    usuarioId: int
    direccion: str | None = Field(default=None, max_length=200)


class ClienteUpdate(BaseModel):
    usuarioId: int | None = None
    direccion: str | None = Field(default=None, max_length=200)


class ClienteResponse(BaseModel):
    id: int
    usuario: UsuarioResponse
    direccion: str | None = None
    vehiculos: list[VehiculoResumen] = []