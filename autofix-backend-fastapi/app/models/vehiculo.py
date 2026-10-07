"""Modelo Vehículo."""

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Vehiculo(Base):
    __tablename__ = "vehiculos"
    # La placa es única POR EMPRESA: el mismo carro puede visitar varios talleres.
    __table_args__ = (
        UniqueConstraint("empresa_id", "placa", name="uq_vehiculos_empresa_placa"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    placa: Mapped[str] = mapped_column(String(10), nullable=False, index=True)
    marca: Mapped[str] = mapped_column(String(50), nullable=False)
    modelo: Mapped[str] = mapped_column(String(50), nullable=False)
    anio: Mapped[int | None] = mapped_column(Integer, nullable=True)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    kilometraje: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("clientes.id"), nullable=False, index=True
    )
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    cliente = relationship("Cliente", back_populates="vehiculos")
    citas = relationship(
        "Cita", back_populates="vehiculo", cascade="all, delete-orphan"
    )
    ordenes = relationship(
        "OrdenTrabajo", back_populates="vehiculo", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Vehiculo {self.placa}>"