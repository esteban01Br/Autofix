"""Modelo Factura."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils import ahora_utc


class Factura(Base):
    __tablename__ = "facturas"
    __table_args__ = (
        UniqueConstraint("empresa_id", "numero", name="uq_facturas_empresa_numero"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Consecutivo por empresa: FAC-0001, FAC-0002... (único por empresa)
    numero: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=ahora_utc)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    iva: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    orden_trabajo_id: Mapped[int] = mapped_column(
        ForeignKey("ordenes_trabajo.id"), unique=True, nullable=False, index=True
    )
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    orden_trabajo = relationship("OrdenTrabajo", back_populates="factura")

    def __repr__(self) -> str:
        return f"<Factura {self.id}: total={self.total}>"