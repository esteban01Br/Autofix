"""CRUD de Mecánico: consultas, filtros y ordenamiento permitido."""

from sqlalchemy import or_

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.mecanico import Mecanico
from app.models.usuario import Usuario


def get_by_usuario_id(db, usuario_id: int) -> Mecanico | None:
    return buscar_por_columna(db, Mecanico, Mecanico.usuario_id, usuario_id)


def exists_usuario(db, usuario_id: int) -> bool:
    return existe_por_columna(db, Mecanico, Mecanico.usuario_id, usuario_id)


def construir_filtros(*, busqueda: str | None = None, especialidad: str | None = None) -> list:
    filtros: list = []
    if busqueda:
        termino = f"%{busqueda.strip().lower()}%"
        filtros.append(
            or_(
                Mecanico.usuario.has(Usuario.nombre.ilike(termino)),
                Mecanico.usuario.has(Usuario.apellido.ilike(termino)),
                Mecanico.usuario.has(Usuario.correo.ilike(termino)),
                Mecanico.especialidad.ilike(termino),
            )
        )
    if especialidad:
        filtros.append(Mecanico.especialidad.ilike(f"%{especialidad.strip()}%"))
    return filtros


COLUMNAS_ORDEN = {
    "id": Mecanico.id,
    "especialidad": Mecanico.especialidad,
    "nombre": Usuario.nombre,
    "apellido": Usuario.apellido,
    "correo": Usuario.correo,
}