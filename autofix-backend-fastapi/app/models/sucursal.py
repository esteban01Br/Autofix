"""Modelo Sucursal (jerarquía: Empresa → Sucursales → Empleados).

La tabla ya existe desde la Fase 1; la asignación de empleados y
operación por sucursal se implementa en la Fase 2.
"""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Sucursal(Base):
    __tablename__ = "sucursales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False)
    direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    activa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    empresa = relationship("Empresa", back_populates="sucursales")
    usuarios = relationship("Usuario", back_populates="sucursal")

    def __repr__(self) -> str:
        return f"<Sucursal {self.id}: {self.nombre}>"
