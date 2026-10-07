"""CRUD de Empresa."""

from sqlalchemy import func, select

from app.models.empresa import Empresa


def get_by_nit(db, nit: str) -> Empresa | None:
    stmt = select(Empresa).where(Empresa.nit == nit.strip()).limit(1)
    return db.scalars(stmt).first()


def get_by_nombre_ci(db, nombre: str) -> Empresa | None:
    stmt = (
        select(Empresa)
        .where(func.lower(Empresa.nombre) == nombre.strip().lower())
        .limit(1)
    )
    return db.scalars(stmt).first()


def listar_todas(db) -> list[Empresa]:
    stmt = select(Empresa).order_by(Empresa.id.asc())
    return list(db.scalars(stmt).all())
