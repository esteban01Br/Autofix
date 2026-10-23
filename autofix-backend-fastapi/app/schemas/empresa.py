"""Esquemas de Empresa (multiempresa)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import PlanSuscripcion
from app.schemas.suscripcion import SuscripcionResumen


class EmpresaRegistroRequest(BaseModel):
    """Registro público: crea la empresa y su usuario administrador."""

    # Datos de la empresa
    nombre_empresa: str = Field(min_length=2, max_length=150)
    nit: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    telefono_empresa: str | None = Field(default=None, max_length=20)

    # Plan contratado en el portal de ventas (compra simulada por ahora).
    plan: PlanSuscripcion = PlanSuscripcion.BASICO

    # Datos del administrador (dueño del taller)
    nombre: str = Field(min_length=1, max_length=100)
    apellido: str = Field(min_length=1, max_length=100)
    correo: EmailStr
    contrasena: str = Field(min_length=8, max_length=128)

    @field_validator("correo")
    @classmethod
    def normalizar_correo(cls, valor: str) -> str:
        return valor.strip().lower()


class EmpresaUpdate(BaseModel):
    """Datos que el ADMIN de la empresa puede actualizar (marca y contacto)."""

    nombre: str | None = Field(default=None, min_length=2, max_length=150)
    nit: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    telefono: str | None = Field(default=None, max_length=20)
    correo: str | None = Field(default=None, max_length=150)
    logo_url: str | None = Field(default=None, max_length=500)
    color_primario: str | None = Field(
        default=None, pattern="^#[0-9a-fA-F]{6}$", description="Color hex #RRGGBB"
    )
    color_secundario: str | None = Field(
        default=None, pattern="^#[0-9a-fA-F]{6}$", description="Color hex #RRGGBB"
    )
    iva_porcentaje: Decimal | None = Field(
        default=None, ge=0, le=100, max_digits=5, decimal_places=2
    )


class EmpresaResponse(BaseModel):
    id: int
    nombre: str
    nit: str | None = None
    direccion: str | None = None
    telefono: str | None = None
    correo: str | None = None
    logo_url: str | None = None
    color_primario: str
    color_secundario: str
    iva_porcentaje: Decimal
    consecutivo_factura: int
    activa: bool
    fecha_creacion: datetime
    # URL confidencial de acceso de la empresa (portal /acceso/{slug})
    slug: str | None = None
    # Solo se popula en el panel SUPERADMIN (listado de empresas).
    suscripcion: SuscripcionResumen | None = None


class EmpresaPublicaResponse(BaseModel):
    """Datos públicos mínimos para brandear la página de acceso de una empresa."""

    slug: str
    nombre: str
    logo_url: str | None = None
    color_primario: str
    color_secundario: str


class EmpresaRegistroResponse(BaseModel):
    empresa: EmpresaResponse
    token: str
    token_type: str = "bearer"
