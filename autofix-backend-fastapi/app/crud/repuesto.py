"""CRUD de Repuesto: consultas, filtros y ordenamiento permitido."""

from sqlalchemy import func, or_, select

from app.crud.base import buscar_por_columna, existe_por_columna
from app.models.repuesto import Repuesto


def get_by_nombre_ci(db, nombre: str, empresa_id: int | None = None) -> Repuesto | None:
    """Búsqueda por nombre (insensible a mayúsculas), opcionalmente por empresa."""
    termino = nombre.strip()
    stmt = select(Repuesto).where(func.lower(Repuesto.nombre) == termino.lower())
    if empresa_id is not None:
        stmt = stmt.where(Repuesto.empresa_id == empresa_id)
    stmt = stmt.limit(1)
    return db.scalars(stmt).first()


def exists_nombre_ci(db, nombre: str, empresa_id: int | None = None) -> bool:
    return get_by_nombre_ci(db, nombre, empresa_id) is not None


def get_by_codigo(db, codigo: str, empresa_id: int | None = None) -> Repuesto | None:
    """Busca un repuesto por su código de barras exacto.

    Con empresa_id se limita a esa empresa (aislamiento); None busca global
    (solo SUPERADMIN).
    """
    stmt = select(Repuesto).where(Repuesto.codigo_barras == codigo.strip())
    if empresa_id is not None:
        stmt = stmt.where(Repuesto.empresa_id == empresa_id)
    stmt = stmt.limit(1)
    return db.scalars(stmt).first()


def construir_filtros(
    *,
    busqueda: str | None = None,
    stock_min: int | None = None,
    stock_max: int | None = None,
) -> list:
    filtros: list = []
    if busqueda:
        termino = f"%{busqueda.strip()}%"
        filtros.append(
            or_(
                Repuesto.nombre.ilike(termino),
                Repuesto.codigo_barras.ilike(termino),
            )
        )
    if stock_min is not None:
        filtros.append(Repuesto.stock >= stock_min)
    if stock_max is not None:
        filtros.append(Repuesto.stock <= stock_max)
    return filtros


COLUMNAS_ORDEN = {
    "id": Repuesto.id,
    "nombre": Repuesto.nombre,
    "stock": Repuesto.stock,
    "precio": Repuesto.precio,
}