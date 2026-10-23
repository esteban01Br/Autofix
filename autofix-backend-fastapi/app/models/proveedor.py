"""Modelo Proveedor (fuente de compra de repuestos)."""

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Proveedor(Base):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    nit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Persona de contacto en el proveedor.
    contacto: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    correo: Mapped[str | None] = mapped_column(String(150), nullable=True)
    direccion: Mapped[str | None] = mapped_column(String(200), nullable=True)
    # Un proveedor se desactiva en lugar de eliminarlo si tiene repuestos.
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )

    repuestos = relationship("Repuesto", back_populates="proveedor")

    def __repr__(self) -> str:
        return f"<Proveedor {self.id}: {self.nombre}>"
