"""Modelo Suscripción (plan contratado por una empresa del SaaS).

Una empresa tiene como máximo una suscripción vigente (unique en
empresa_id); renovarla actualiza ese registro. La vigencia se calcula
con ``fecha_fin`` (más ``estado`` para cancelaciones/soporte).
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, UniqueConstraint
from sqlalchemy import Enum as SQLEnum  # noqa: N812 — alias para no chocar con el Enum de Python
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.enums import EstadoSuscripcion, PlanSuscripcion
from app.utils import ahora_utc


class Suscripcion(Base):
    __tablename__ = "suscripciones"
    __table_args__ = (
        UniqueConstraint("empresa_id", name="uq_suscripciones_empresa"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    empresa_id: Mapped[int] = mapped_column(
        ForeignKey("empresas.id"), nullable=False, index=True
    )
    plan: Mapped[PlanSuscripcion] = mapped_column(
        SQLEnum(PlanSuscripcion, name="plan_suscripcion"),
        nullable=False,
        default=PlanSuscripcion.BASICO,
    )
    estado: Mapped[EstadoSuscripcion] = mapped_column(
        SQLEnum(EstadoSuscripcion, name="estado_suscripcion"),
        nullable=False,
        default=EstadoSuscripcion.ACTIVA,
    )
    fecha_inicio: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc
    )
    fecha_fin: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # Valor simulado de la compra (COP); la pasarela real llega después.
    monto: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False, default=Decimal("0")
    )
    fecha_creacion: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=ahora_utc
    )

    def __repr__(self) -> str:
        return f"<Suscripcion {self.id}: empresa {self.empresa_id} {self.plan.value}>"
