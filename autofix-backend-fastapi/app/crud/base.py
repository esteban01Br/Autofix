"""Operaciones CRUD genéricas sobre modelos."""

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session


def obtener(db: Session, model, obj_id: int):
    """Devuelve la entidad por id o None."""
    return db.get(model, obj_id)


def obtener_o_404(db: Session, model, obj_id: int, mensaje: str = "Recurso no encontrado"):
    """Devuelve la entidad por id o lanza 404."""
    obj = db.get(model, obj_id)
    if obj is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=mensaje)
    return obj


def listar(
    db: Session,
    model,
    *,
    filtros: list | None = None,
    orden_col=None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
):
    stmt = select(model)
    if filtros:
        stmt = stmt.where(*filtros)
    if orden_col is not None:
        stmt = stmt.order_by(orden_col.desc() if direccion == "desc" else orden_col.asc())
    stmt = stmt.offset(offset or 0)
    if limit is not None:
        stmt = stmt.limit(limit)
    return list(db.scalars(stmt).all())


def contar(db: Session, model, *, filtros: list | None = None) -> int:
    stmt = select(func.count()).select_from(model)
    if filtros:
        stmt = stmt.where(*filtros)
    return int(db.scalar(stmt) or 0)


def crear(db: Session, instancia):
    db.add(instancia)
    db.commit()
    db.refresh(instancia)
    return instancia


def actualizar(db: Session, instancia):
    db.commit()
    db.refresh(instancia)
    return instancia


def eliminar(db: Session, instancia) -> None:
    db.delete(instancia)
    db.commit()


def buscar_por_columna(db: Session, model, columna, valor):
    stmt = select(model).where(columna == valor).limit(1)
    return db.scalars(stmt).first()


def existe_por_columna(db: Session, model, columna, valor) -> bool:
    stmt = select(model.id).where(columna == valor).limit(1)
    return db.scalars(stmt).first() is not None