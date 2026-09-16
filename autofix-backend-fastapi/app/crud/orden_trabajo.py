"""CRUD de OrdenTrabajo: filtros y ordenamiento permitido."""

from app.models.enums import EstadoOrden
from app.models.orden_trabajo import OrdenTrabajo


def construir_filtros(
    *,
    estado: EstadoOrden | None = None,
    vehiculo_id: int | None = None,
    mecanico_id: int | None = None,
    desde=None,
    hasta=None,
) -> list:
    filtros: list = []
    if estado is not None:
        filtros.append(OrdenTrabajo.estado == estado)
    if vehiculo_id is not None:
        filtros.append(OrdenTrabajo.vehiculo_id == vehiculo_id)
    if mecanico_id is not None:
        filtros.append(OrdenTrabajo.mecanico_id == mecanico_id)
    if desde is not None:
        filtros.append(OrdenTrabajo.fecha_ingreso >= desde)
    if hasta is not None:
        filtros.append(OrdenTrabajo.fecha_ingreso <= hasta)
    return filtros


COLUMNAS_ORDEN = {
    "id": OrdenTrabajo.id,
    "fecha_ingreso": OrdenTrabajo.fecha_ingreso,
    "fecha_salida": OrdenTrabajo.fecha_salida,
    "estado": OrdenTrabajo.estado,
}