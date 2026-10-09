"""Modelo Repuesto."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Repuesto(Base):
    __tablename__ = "repuestos"
    __table_args__ = (
        UniqueConstraint("empresa_id", "codigo_barras", name="uq_repuestos_empresa_codigo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # El código de barras es único POR EMPRESA (índice compuesto abajo).
    codigo_barras: Mapped[str | None] = mapped_column(
        String(50), nullable=True, index=True
    )
    stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    stock_minimo: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    precio: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    detalles = relationship("DetalleOrden", back_populates="repuesto")

    def __repr__(self) -> str:
        return f"<Repuesto {self.id}: {self.nombre}>"