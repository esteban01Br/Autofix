"""Modelo Cita."""

from datetime import date, time

from sqlalchemy import Date, Enum, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import EstadoCita


class Cita(Base):
    __tablename__ = "citas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    hora: Mapped[time] = mapped_column(Time, nullable=False)
    estado: Mapped[EstadoCita] = mapped_column(
        Enum(EstadoCita, name="estado_cita"),
        nullable=False,
        default=EstadoCita.PENDIENTE,
    )
    descripcion: Mapped[str | None] = mapped_column(String(500), nullable=True)
    vehiculo_id: Mapped[int] = mapped_column(
        ForeignKey("vehiculos.id"), nullable=False, index=True
    )

    vehiculo = relationship("Vehiculo", back_populates="citas")

    def __repr__(self) -> str:
        return f"<Cita {self.id}: {self.fecha} {self.hora}>"