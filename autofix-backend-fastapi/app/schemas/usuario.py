"""Esquemas de Usuario."""

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, model_validator

from app.models.enums import Rol


class UsuarioCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    correo: EmailStr = Field(max_length=150)
    contrasena: str = Field(min_length=8, max_length=128)
    telefono: str | None = Field(default=None, max_length=20)
    rol: Rol


class UsuarioUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=100)
    apellido: str | None = Field(default=None, min_length=1, max_length=100)
    correo: EmailStr | None = Field(default=None, max_length=150)
    contrasena: str | None = Field(default=None, min_length=8, max_length=128)
    telefono: str | None = Field(default=None, max_length=20)
    rol: Rol | None = None
    activo: bool | None = None

    @model_validator(mode="after")
    def al_menos_un_campo(self) -> "UsuarioUpdate":
        campos = [
            self.nombre,
            self.apellido,
            self.correo,
            self.contrasena,
            self.telefono,
            self.rol,
            self.activo,
        ]
        if all(c is None for c in campos):
            raise ValueError("Debe proporcionar al menos un campo a actualizar")
        return self


class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    correo: EmailStr
    telefono: str | None = None
    rol: Rol
    activo: bool
    debeCambiarContrasena: bool = False
    fechaCreacion: datetime


class CambioContrasenaRequest(BaseModel):
    contrasena_actual: str = Field(min_length=1, max_length=128)
    contrasena_nueva: str = Field(min_length=8, max_length=128)