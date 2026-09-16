"""CRUD de Cliente: consultas, filtros y ordenamiento permitido."""

from sqlalchemy import or_

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.cliente import Cliente
from app.models.usuario import Usuario


def get_by_usuario_id(db, usuario_id: int) -> Cliente | None:
    return buscar_por_columna(db, Cliente, Cliente.usuario_id, usuario_id)


def exists_usuario(db, usuario_id: int) -> bool:
    return existe_por_columna(db, Cliente, Cliente.usuario_id, usuario_id)


def construir_filtros(*, busqueda: str | None = None) -> list:
    filtros: list = []
    if busqueda:
        termino = f"%{busqueda.strip().lower()}%"
        filtros.append(
            or_(
                Usuario.nombre.ilike(termino),
                Usuario.apellido.ilike(termino),
                Usuario.correo.ilike(termino),
                Cliente.direccion.ilike(termino),
            )
        )
    return filtros


# Ordenar por id, dirección o un campo del usuario relacionado.
COLUMNAS_ORDEN = {
    "id": Cliente.id,
    "direccion": Cliente.direccion,
    "nombre": Usuario.nombre,
    "apellido": Usuario.apellido,
    "correo": Usuario.correo,
}