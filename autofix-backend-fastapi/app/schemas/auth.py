"""Esquemas de autenticación."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    correo: EmailStr = Field(description="Correo electrónico del usuario")
    contrasena: str = Field(min_length=1, max_length=128, description="Contraseña")


class RegisterRequest(BaseModel):
    nombre: str = Field(min_length=1, max_length=100, description="Nombre")
    apellido: str = Field(min_length=1, max_length=100, description="Apellido")
    correo: EmailStr = Field(description="Correo electrónico")
    contrasena: str = Field(
        min_length=8, max_length=128, description="Contraseña (mínimo 8 caracteres)"
    )
    telefono: str | None = Field(default=None, max_length=20)


class TokenResponse(BaseModel):
    token: str = Field(description="Token JWT de acceso")
    token_type: str = "bearer"