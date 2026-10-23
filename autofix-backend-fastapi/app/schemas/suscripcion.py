"""Esquemas de Suscripción (planes, estado y gestión del SaaS)."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import EstadoSuscripcion, PlanSuscripcion


class PlanInfo(BaseModel):
    """Plan publicado en el portal de ventas (datos públicos, en COP)."""

    id: PlanSuscripcion
    nombre: str
    precioMensual: int
    precioAnual: int
    destacado: bool = False
    caracteristicas: list[str]


class SuscripcionResumen(BaseModel):
    """Resumen de la suscripción de una empresa (panel SUPERADMIN)."""

    plan: PlanSuscripcion
    estado: EstadoSuscripcion
    fechaFin: datetime
    vigente: bool
    diasRestantes: int


class SuscripcionResponse(BaseModel):
    id: int
    empresaId: int
    plan: PlanSuscripcion
    estado: EstadoSuscripcion
    fechaInicio: datetime
    fechaFin: datetime
    monto: Decimal
    vigente: bool
    diasRestantes: int


class SuscripcionGestionRequest(BaseModel):
    """Alta/ajuste de una suscripción (solo SUPERADMIN, soporte simulado)."""

    plan: PlanSuscripcion = PlanSuscripcion.BASICO
    dias: int = Field(default=365, ge=0, le=3650)
    # Fecha manual para casos de soporte (p. ej. marcar vencida); si llega,
    # tiene prioridad sobre `dias`.
    fecha_fin: datetime | None = None
    estado: EstadoSuscripcion = EstadoSuscripcion.ACTIVA
