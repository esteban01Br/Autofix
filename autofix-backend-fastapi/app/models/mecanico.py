"""Modelo Mecánico."""

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Mecanico(Base):
    __tablename__ = "mecanicos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), unique=True, nullable=False, index=True
    )
    especialidad: Mapped[str | None] = mapped_column(String(100), nullable=True)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    usuario = relationship("Usuario", back_populates="mecanico")
    ordenes = relationship("OrdenTrabajo", back_populates="mecanico")

    def __repr__(self) -> str:
        return f"<Mecanico {self.id}: usuario_id={self.usuario_id}>"