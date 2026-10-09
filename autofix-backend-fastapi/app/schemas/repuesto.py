"""Esquemas de Repuesto."""

from decimal import Decimal

from pydantic import BaseModel, Field


class RepuestoCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=150)
    descripcion: str | None = Field(default=None, max_length=500)
    codigo_barras: str | None = Field(default=None, min_length=4, max_length=50)
    stock: int = Field(ge=0)
    stock_minimo: int = Field(default=0, ge=0)
    precio: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class RepuestoUpdate(BaseModel):
    nombre: str | None = Field(default=None, min_length=1, max_length=150)
    descripcion: str | None = Field(default=None, max_length=500)
    codigo_barras: str | None = Field(default=None, min_length=4, max_length=50)
    stock: int | None = Field(default=None, ge=0)
    stock_minimo: int | None = Field(default=None, ge=0)
    precio: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)


class AjusteStockRequest(BaseModel):
    cantidad: int


class RepuestoResponse(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None
    codigo_barras: str | None = None
    stock: int
    stockMinimo: int = 0
    precio: Decimal
