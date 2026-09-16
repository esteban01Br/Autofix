"""CRUD de Vehículo: consultas, filtros y ordenamiento permitido."""

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.vehiculo import Vehiculo


def get_by_placa(db, placa: str) -> Vehiculo | None:
    return buscar_por_columna(db, Vehiculo, Vehiculo.placa, placa.strip().upper())


def exists_placa(db, placa: str) -> bool:
    return existe_por_columna(db, Vehiculo, Vehiculo.placa, placa.strip().upper())


def construir_filtros(
    *,
    placa: str | None = None,
    marca: str | None = None,
    cliente_id: int | None = None,
) -> list:
    filtros: list = []
    if placa:
        filtros.append(Vehiculo.placa.ilike(f"%{placa.strip()}%"))
    if marca:
        filtros.append(Vehiculo.marca.ilike(f"%{marca.strip()}%"))
    if cliente_id is not None:
        filtros.append(Vehiculo.cliente_id == cliente_id)
    return filtros


COLUMNAS_ORDEN = {
    "id": Vehiculo.id,
    "placa": Vehiculo.placa,
    "marca": Vehiculo.marca,
    "modelo": Vehiculo.modelo,
    "anio": Vehiculo.anio,
    "kilometraje": Vehiculo.kilometraje,
}