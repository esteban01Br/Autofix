"""Esquemas de autenticación."""

from pydantic import BaseModel, EmailStr, Field, field_validator


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

    @field_validator("nombre", "apellido")
    @classmethod
    def sin_solo_espacios(cls, valor: str) -> str:
        if not valor.strip():
            raise ValueError("No puede contener solo espacios")
        return valor.strip()

    @field_validator("correo")
    @classmethod
    def normalizar_correo(cls, valor: str) -> str:
        return valor.strip().lower()

    @field_validator("contrasena")
    @classmethod
    def contrasena_segura(cls, valor: str) -> str:
        if valor.islower() and valor.isalpha():
            raise ValueError("Debe contener al menos una mayúscula o un número")
        return valor


class TokenResponse(BaseModel):
    token: str = Field(description="Token JWT de acceso")
    token_type: str = "bearer"