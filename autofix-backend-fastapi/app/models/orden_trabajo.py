"""Modelo OrdenTrabajo."""

from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EstadoOrden
from app.utils import ahora_utc


class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    fecha_ingreso: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc
    )
    fecha_salida: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    estado: Mapped[EstadoOrden] = mapped_column(
        Enum(EstadoOrden, name="estado_orden"),
        nullable=False,
        default=EstadoOrden.RECIBIDO,
        index=True,
    )
    diagnostico: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    observaciones: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    mecanico_id: Mapped[int | None] = mapped_column(
        ForeignKey("mecanicos.id"), nullable=True, index=True
    )
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False, index=True
    )

    mecanico = relationship("Mecanico", back_populates="ordenes")
    vehiculo = relationship("Vehiculo", back_populates="ordenes")
    detalles = relationship(
        "DetalleOrden",
        back_populates="orden_trabajo",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    factura = relationship(
        "Factura",
        back_populates="orden_trabajo",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<OrdenTrabajo {self.id}: {self.estado}>"