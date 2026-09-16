"""CRUD de DetalleOrden: filtros y ordenamiento permitido."""

from app.models.detalle_orden import DetalleOrden


def construir_filtros(*, orden_id: int | None = None) -> list:
    filtros: list = []
    if orden_id is not None:
        filtros.append(DetalleOrden.orden_trabajo_id == orden_id)
    return filtros


COLUMNAS_ORDEN = {
    "id": DetalleOrden.id,
    "cantidad": DetalleOrden.cantidad,
    "precio_unitario": DetalleOrden.precio_unitario,
}