"""CRUD de Usuario: consultas, filtros y ordenamiento permitido."""

from sqlalchemy import or_

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.enums import Rol
from app.models.usuario import Usuario


def get_by_correo(db, correo: str) -> Usuario | None:
    correo_lower = correo.strip().lower()
    return buscar_por_columna(db, Usuario, Usuario.correo, correo_lower)


def exists_correo(db, correo: str) -> bool:
    correo_lower = correo.strip().lower()
    return existe_por_columna(db, Usuario, Usuario.correo, correo_lower)


def construir_filtros(*, busqueda: str | None = None, rol: Rol | None = None, activo: bool | None = None) -> list:
    filtros: list = []
    if busqueda:
        termino = f"%{busqueda.strip().lower()}%"
        filtros.append(
            or_(
                Usuario.nombre.ilike(termino),
                Usuario.apellido.ilike(termino),
                Usuario.correo.ilike(termino),
            )
        )
    if rol is not None:
        filtros.append(Usuario.rol == rol)
    if activo is not None:
        filtros.append(Usuario.activo == activo)
    return filtros


# Columnas permitidas para ordenar; evita ordenar por campos arbitrarios.
COLUMNAS_ORDEN = {
    "id": Usuario.id,
    "nombre": Usuario.nombre,
    "apellido": Usuario.apellido,
    "correo": Usuario.correo,
    "rol": Usuario.rol,
    "activo": Usuario.activo,
    "fecha_creacion": Usuario.fecha_creacion,
}