"""Esquemas de Mecánico."""

from pydantic import BaseModel, Field

from app.schemas.usuario import UsuarioResponse


class MecanicoCreate(BaseModel):
    usuarioId: int
    especialidad: str | None = Field(default=None, max_length=100)


class MecanicoUpdate(BaseModel):
    usuarioId: int | None = None
    especialidad: str | None = Field(default=None, max_length=100)


class MecanicoResponse(BaseModel):
    id: int
    usuario: UsuarioResponse
    especialidad: str | None = None


class MecanicoResumen(BaseModel):
    id: int
    nombreCompleto: str
    especialidad: str | None = None