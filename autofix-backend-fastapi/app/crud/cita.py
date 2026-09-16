"""CRUD de Cita: filtros y ordenamiento permitido."""

from app.models.cita import Cita
from app.models.enums import EstadoCita


def construir_filtros(
    *,
    estado: EstadoCita | None = None,
    desde=None,
    hasta=None,
    vehiculo_id: int | None = None,
) -> list:
    filtros: list = []
    if estado is not None:
        filtros.append(Cita.estado == estado)
    if desde is not None:
        filtros.append(Cita.fecha >= desde)
    if hasta is not None:
        filtros.append(Cita.fecha <= hasta)
    if vehiculo_id is not None:
        filtros.append(Cita.vehiculo_id == vehiculo_id)
    return filtros


COLUMNAS_ORDEN = {
    "id": Cita.id,
    "fecha": Cita.fecha,
    "hora": Cita.hora,
    "estado": Cita.estado,
}