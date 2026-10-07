"""Modelo Usuario."""

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.enums import Rol
from app.utils import ahora_utc


class Usuario(Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nombre: Mapped[str] = mapped_column(String(100), nullable=False)
    apellido: Mapped[str] = mapped_column(String(100), nullable=False)
    correo: Mapped[str] = mapped_column(
        String(150), unique=True, nullable=False, index=True
    )
    contrasena: Mapped[str] = mapped_column(String(255), nullable=False)
    telefono: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rol: Mapped[Rol] = mapped_column(
        Enum(Rol, name="rol"), nullable=False, default=Rol.CLIENTE
    )
    activo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    # Empresa a la que pertenece (NULL solo para SUPERADMIN de plataforma)
    empresa_id: Mapped[int | None] = mapped_column(
        ForeignKey("empresas.id"), nullable=True, index=True
    )
    # Sucursal asignada (Fase 2); por ahora opcional
    sucursal_id: Mapped[int | None] = mapped_column(
        ForeignKey("sucursales.id"), nullable=True, index=True
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc
    )
    fecha_actualizacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc, onupdate=ahora_utc
    )

    empresa = relationship("Empresa", back_populates="usuarios")
    sucursal = relationship("Sucursal", back_populates="usuarios")
    cliente = relationship(
        "Cliente", back_populates="usuario", uselist=False, cascade="all, delete-orphan"
    )
    mecanico = relationship(
        "Mecanico",
        back_populates="usuario",
        uselist=False,
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Usuario {self.id}: {self.correo}>"