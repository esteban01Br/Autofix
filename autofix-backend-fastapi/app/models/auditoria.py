"""Modelo Auditoria: registro de acciones relevantes (quién hizo qué y cuándo)."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.utils import ahora_utc


class Auditoria(Base):
    __tablename__ = "auditoria"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    empresa_id: Mapped[int | None] = mapped_column(
        ForeignKey("empresas.id"), nullable=True, index=True
    )
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True, index=True
    )
    accion: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # Ej: CREAR_CLIENTE, ELIMINAR_REPUESTO, FACTURAR, CAMBIO_ESTADO_ORDEN
    entidad: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entidad_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    detalle: Mapped[str | None] = mapped_column(Text, nullable=True)
    fecha: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc, index=True
    )

    def __repr__(self) -> str:
        return f"<Auditoria {self.id}: {self.accion} {self.entidad}#{self.entidad_id}>"
