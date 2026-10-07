"""Modelo Empresa (tenant de la plataforma multiempresa).

Cada empresa (taller) tiene sus datos completamente aislados:
usuarios, clientes, vehículos, citas, órdenes, repuestos y facturas.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils import ahora_utc


class Empresa(Base):
    __tablename__ = "empresas"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    nit: Mapped[str | None] = mapped_column(String(20), unique=True, nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(150), nullable=True)

    # Marca propia (branding)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    color_primario: Mapped[str] = mapped_column(
        String(7), nullable=False, default="#f59e0b"
    )
    color_secundario: Mapped[str] = mapped_column(
        String(7), nullable=False, default="#1f2937"
    )

    # Configuración de facturación
    iva_porcentaje: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), nullable=False, default=Decimal("19.00")
    )
    consecutivo_factura: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0
    )

    activa: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc
    )

    sucursales = relationship(
        "Sucursal", back_populates="empresa", cascade="all, delete-orphan"
    )
    usuarios = relationship("Usuario", back_populates="empresa")

    def __repr__(self) -> str:
        return f"<Empresa {self.id}: {self.nombre}>"
