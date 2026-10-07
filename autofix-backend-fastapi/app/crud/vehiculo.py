"""CRUD de Vehículo: consultas, filtros y ordenamiento permitido."""

from sqlalchemy import select

from app.models.vehiculo import Vehiculo


def get_by_placa(db, placa: str, empresa_id: int | None = None) -> Vehiculo | None:
    """Búsqueda por placa exacta, opcionalmente limitada a una empresa."""
    stmt = select(Vehiculo).where(Vehiculo.placa == placa.strip().upper())
    if empresa_id is not None:
        stmt = stmt.where(Vehiculo.empresa_id == empresa_id)
    stmt = stmt.limit(1)
    return db.scalars(stmt).first()


def exists_placa(db, placa: str, empresa_id: int | None = None) -> bool:
    return get_by_placa(db, placa, empresa_id) is not None


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