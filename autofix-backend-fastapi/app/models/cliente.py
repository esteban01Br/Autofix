"""Modelo Cliente."""

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    usuario_id: Mapped[int] = mapped_column(
        ForeignKey("usuarios.id"), unique=True, nullable=False, index=True
    )
    direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    usuario = relationship("Usuario", back_populates="cliente")
    vehiculos = relationship(
        "Vehiculo",
        back_populates="cliente",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Cliente {self.id}: usuario_id={self.usuario_id}>"