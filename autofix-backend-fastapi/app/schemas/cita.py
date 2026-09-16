"""Esquemas de Cita."""

from datetime import date, time

from pydantic import BaseModel, Field, model_validator

from app.models.enums import EstadoCita


class CitaCreate(BaseModel):
    fecha: date
    hora: time
    descripcion: str | None = Field(default=None, max_length=500)
    vehiculoId: int

    @model_validator(mode="after")
    def fecha_no_pasada(self) -> "CitaCreate":
        from datetime import date as date_cls

        if self.fecha < date_cls.today():
            raise ValueError("La fecha no puede ser en el pasado")
        return self


class CitaUpdate(BaseModel):
    fecha: date | None = None
    hora: time | None = None
    descripcion: str | None = Field(default=None, max_length=500)
    vehiculoId: int | None = None

    @model_validator(mode="after")
    def fecha_no_pasada(self) -> "CitaUpdate":
        from datetime import date as date_cls

        if self.fecha is not None and self.fecha < date_cls.today():
            raise ValueError("La fecha no puede ser en el pasado")
        return self


class CitaEstadoRequest(BaseModel):
    estado: EstadoCita


class CitaResponse(BaseModel):
    id: int
    fecha: date
    hora: time
    estado: EstadoCita
    descripcion: str | None = None
    vehiculoId: int
    vehiculoPlaca: str | None = None
    clienteNombre: str | None = None