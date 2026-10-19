"""Modelo Pago (abonos y pagos de facturas)."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EstadoPagoFactura, MetodoPago
from app.utils import ahora_utc


class Pago(Base):
    __tablename__ = "pagos"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    factura_id: Mapped[int] = mapped_column(
        ForeignKey("facturas.id"), nullable=False, index=True
    )
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )
    usuario_id: Mapped[int | None] = mapped_column(
        ForeignKey("usuarios.id"), nullable=True, index=True
    )
    monto: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    metodo: Mapped[MetodoPago] = mapped_column(
        Enum(MetodoPago, name="metodo_pago"), nullable=False, default=MetodoPago.EFECTIVO
    )
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=ahora_utc)

    factura = relationship("Factura", back_populates="pagos")
    usuario = relationship("Usuario")

    def __repr__(self) -> str:
        return f"<Pago {self.id}: factura {self.factura_id} · {self.monto}>"
