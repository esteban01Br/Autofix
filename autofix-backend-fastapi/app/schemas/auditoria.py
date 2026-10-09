"""Esquemas de Auditoria."""

from datetime import datetime

from pydantic import BaseModel


class AuditoriaResponse(BaseModel):
    id: int
    empresaId: int | None = None
    usuarioId: int | None = None
    accion: str
    entidad: str | None = None
    entidadId: int | None = None
    detalle: str | None = None
    fecha: datetime
