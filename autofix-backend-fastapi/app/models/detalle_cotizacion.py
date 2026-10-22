"""Modelo DetalleCotizacion (líneas de una cotización).

Una línea puede ser un repuesto del inventario, un servicio del catálogo
o un concepto libre escrito por el asesor. A diferencia de la orden, aquí
NO se descuenta stock: la cotización es una propuesta de precio.
"""

from decimal import Decimal

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class DetalleCotizacion(Base):
    __tablename__ = "detalle_cotizacion"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cotizacion_id: Mapped[int] = mapped_column(
        ForeignKey("cotizaciones.id"), nullable=False, index=True
    )
    repuesto_id: Mapped[int | None] = mapped_column(
        ForeignKey("repuestos.id"), nullable=True, index=True
    )
    servicio_id: Mapped[int | None] = mapped_column(
        ForeignKey("servicios.id"), nullable=True, index=True
    )
    # Descripción libre cuando no es ni un repuesto ni un servicio del catálogo.
    concepto: Mapped[str | None] = mapped_column(String(300), nullable=True)
    cantidad: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    cotizacion = relationship("Cotizacion", back_populates="detalles")
    repuesto = relationship("Repuesto")
    servicio = relationship("Servicio")

    def __repr__(self) -> str:
        return f"<DetalleCotizacion {self.id}: x{self.cantidad}>"
