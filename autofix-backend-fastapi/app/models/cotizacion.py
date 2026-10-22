"""Modelo Cotización (propuesta de precio previa a la orden)."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EstadoCotizacion
from app.utils import ahora_utc


class Cotizacion(Base):
    __tablename__ = "cotizaciones"
    __table_args__ = (
        UniqueConstraint("empresa_id", "numero", name="uq_cotizaciones_empresa_numero"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Consecutivo por empresa: COT-0001, COT-0002...
    numero: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    fecha: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=ahora_utc)
    # Días de vigencia de la propuesta (por defecto 15).
    validez_dias: Mapped[int] = mapped_column(Integer, nullable=False, default=15)
    estado: Mapped[EstadoCotizacion] = mapped_column(
        Enum(EstadoCotizacion, name="estado_cotizacion"),
        nullable=False,
        default=EstadoCotizacion.BORRADOR,
        index=True,
    )
    observaciones: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    # Totales calculados al momento de enviar (subtotal + IVA).
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    iva: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)
    total: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    vehiculo_id: Mapped[int | None] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=True, index=True
    )
    cliente_id: Mapped[int | None] = mapped_column(
        ForeignKey("clientes.id"), nullable=True, index=True
    )
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )
    # Orden generada al aprobar la cotización (si se convirtió).
    orden_trabajo_id: Mapped[int | None] = mapped_column(
        ForeignKey("ordenes_trabajo.id"), nullable=True, unique=True, index=True
    )

    vehiculo = relationship("Vehiculo")
    cliente = relationship("Cliente")
    orden_trabajo = relationship("OrdenTrabajo")
    detalles = relationship(
        "DetalleCotizacion",
        back_populates="cotizacion",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Cotizacion {self.numero}: {self.estado}>"
