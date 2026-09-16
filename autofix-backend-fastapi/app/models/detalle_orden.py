"""Modelo DetalleOrden."""

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DetalleOrden(Base):
    __tablename__ = "detalle_orden"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    orden_trabajo_id: Mapped[int] = mapped_column(
        ForeignKey("ordenes_trabajo.id"), nullable=False, index=True
    )
    repuesto_id: Mapped[int] = mapped_column(
        ForeignKey("repuestos.id"), nullable=False, index=True
    )
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    orden_trabajo = relationship("OrdenTrabajo", back_populates="detalles")
    repuesto = relationship("Repuesto", back_populates="detalles")

    def __repr__(self) -> str:
        return f"<DetalleOrden {self.id}: repuesto_id={self.repuesto_id}>"