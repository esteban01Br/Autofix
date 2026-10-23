"""CRUD de Proveedor: filtros y ordenamiento permitido."""

from sqlalchemy import func, or_, select

from app.models.proveedor import Proveedor
from app.models.repuesto import Repuesto


def construir_filtros(
    *,
    activo: bool | None = None,
    busqueda: str | None = None,
) -> list:
    filtros: list = []
    if activo is not None:
        filtros.append(Proveedor.activo == activo)
    if busqueda:
        termino = f"%{busqueda.strip().lower()}%"
        filtros.append(
            or_(
                func.lower(Proveedor.nombre).like(termino),
                func.lower(Proveedor.contacto).like(termino),
                func.lower(Proveedor.correo).like(termino),
                func.lower(Proveedor.nit).like(termino),
            )
        )
    return filtros


def get_by_nombre_ci(db, nombre: str, empresa_id: int) -> Proveedor | None:
    """Busca un proveedor por nombre (case-insensitive) dentro de la empresa."""
    stmt = (
        select(Proveedor)
        .where(
            Proveedor.empresa_id == empresa_id,
            func.lower(Proveedor.nombre) == nombre.strip().lower(),
        )
        .limit(1)
    )
    return db.scalar(stmt)


def contar_repuestos(db, proveedor_id: int) -> int:
    """Cuenta los repuestos asociados al proveedor."""
    return int(
        db.scalar(
            select(func.count(Repuesto.id)).where(Repuesto.proveedor_id == proveedor_id)
        )
        or 0
    )


COLUMNAS_ORDEN = {
    "id": Proveedor.id,
    "nombre": Proveedor.nombre,
    "activo": Proveedor.activo,
}
