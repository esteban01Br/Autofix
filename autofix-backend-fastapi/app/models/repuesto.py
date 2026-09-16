"""Modelo Repuesto."""

from decimal import Decimal

from sqlalchemy import Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Repuesto(Base):
    __tablename__ = "repuestos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    detalles = relationship("DetalleOrden", back_populates="repuesto")

    def __repr__(self) -> str:
        return f"<Repuesto {self.id}: {self.nombre}>"