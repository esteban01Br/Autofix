"""CRUD de Cotizacion: filtros y ordenamiento permitido."""

from app.models.enums import EstadoCotizacion
from app.models.cotizacion import Cotizacion


def construir_filtros(
    *,
    estado: EstadoCotizacion | None = None,
    vehiculo_id: int | None = None,
    cliente_id: int | None = None,
    desde=None,
    hasta=None,
) -> list:
    filtros: list = []
    if estado is not None:
        filtros.append(Cotizacion.estado == estado)
    if vehiculo_id is not None:
        filtros.append(Cotizacion.vehiculo_id == vehiculo_id)
    if cliente_id is not None:
        filtros.append(Cotizacion.cliente_id == cliente_id)
    if desde is not None:
        filtros.append(Cotizacion.fecha >= desde)
    if hasta is not None:
        filtros.append(Cotizacion.fecha <= hasta)
    return filtros


COLUMNAS_ORDEN = {
    "id": Cotizacion.id,
    "numero": Cotizacion.numero,
    "fecha": Cotizacion.fecha,
    "total": Cotizacion.total,
    "estado": Cotizacion.estado,
}
