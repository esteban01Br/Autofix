"""CRUD de Factura: consultas, filtros y ordenamiento permitido."""

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.factura import Factura


def get_by_orden_id(db, orden_trabajo_id: int) -> Factura | None:
    return buscar_por_columna(db, Factura, Factura.orden_trabajo_id, orden_trabajo_id)


def exists_orden(db, orden_trabajo_id: int) -> bool:
    return existe_por_columna(db, Factura, Factura.orden_trabajo_id, orden_trabajo_id)


def construir_filtros(*, desde=None, hasta=None, orden_trabajo_id: int | None = None) -> list:
    filtros: list = []
    if desde is not None:
        filtros.append(Factura.fecha >= desde)
    if hasta is not None:
        filtros.append(Factura.fecha <= hasta)
    if orden_trabajo_id is not None:
        filtros.append(Factura.orden_trabajo_id == orden_trabajo_id)
    return filtros


COLUMNAS_ORDEN = {
    "id": Factura.id,
    "fecha": Factura.fecha,
    "subtotal": Factura.subtotal,
    "iva": Factura.iva,
    "total": Factura.total,
}