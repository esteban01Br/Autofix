"""Esquemas de Cotizacion y sus líneas."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.enums import EstadoCotizacion


class DetalleCotizacionCreate(BaseModel):
    """Línea de cotización: repuesto, servicio o concepto libre.

    Debe venir exactamente una fuente. El precio se toma del repuesto o
    del servicio del catálogo; para los conceptos libres se indica en
    ``precioUnitario``. La cotización no descuenta stock.
    """

    repuestoId: int | None = None
    servicioId: int | None = None
    concepto: str | None = Field(default=None, max_length=300)
    precioUnitario: Decimal | None = Field(default=None, ge=0)
    cantidad: int = Field(default=1, ge=1)

    @model_validator(mode="after")
    def _una_fuente(self):
        fuentes = [self.repuestoId, self.servicioId, self.concepto]
        if sum(1 for f in fuentes if f is not None) != 1:
            raise ValueError(
                "Cada línea debe tener repuestoId, servicioId o concepto (uno solo)."
            )
        if self.concepto is not None and self.precioUnitario is None:
            raise ValueError(
                "Las líneas con concepto libre requieren precioUnitario."
            )
        return self


class DetalleCotizacionResponse(BaseModel):
    id: int
    repuestoId: int | None = None
    servicioId: int | None = None
    concepto: str | None = None
    descripcion: str
    cantidad: int
    precioUnitario: Decimal
    subtotalLinea: Decimal


class CotizacionCreate(BaseModel):
    vehiculoId: int | None = None
    clienteId: int | None = None
    observaciones: str | None = Field(default=None, max_length=1000)
    validezDias: int = Field(default=15, ge=1, le=120)
    detalles: list[DetalleCotizacionCreate] = Field(min_length=1)


class CotizacionUpdate(BaseModel):
    """Edición de una cotización aún no enviada (BORRADOR)."""

    vehiculoId: int | None = None
    clienteId: int | None = None
    observaciones: str | None = Field(default=None, max_length=1000)
    validezDias: int | None = Field(default=None, ge=1, le=120)
    detalles: list[DetalleCotizacionCreate] | None = None


class CotizacionEstadoRequest(BaseModel):
    estado: EstadoCotizacion


class CotizacionResponse(BaseModel):
    id: int
    numero: str
    fecha: datetime
    validezDias: int
    estado: EstadoCotizacion
    observaciones: str | None = None
    subtotal: Decimal
    iva: Decimal
    total: Decimal
    vehiculoId: int | None = None
    vehiculoPlaca: str | None = None
    clienteId: int | None = None
    clienteNombre: str | None = None
    detalles: list[DetalleCotizacionResponse] = []
    ordenTrabajoId: int | None = None
