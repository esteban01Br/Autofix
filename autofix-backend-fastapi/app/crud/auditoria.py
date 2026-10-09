"""CRUD de Auditoria."""

from sqlalchemy import select

from app.models.auditoria import Auditoria


def registrar(
    db,
    *,
    empresa_id: int | None,
    usuario_id: int | None,
    accion: str,
    entidad: str | None = None,
    entidad_id: int | None = None,
    detalle: str | None = None,
) -> Auditoria:
    """Registra una acción en la auditoría."""
    registro = Auditoria(
        empresa_id=empresa_id,
        usuario_id=usuario_id,
        accion=accion,
        entidad=entidad,
        entidad_id=entidad_id,
        detalle=detalle,
    )
    db.add(registro)
    db.commit()
    db.refresh(registro)
    return registro


def listar(
    db,
    empresa_id: int | None,
    *,
    accion: str | None = None,
    usuario_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[Auditoria], int]:
    stmt = select(Auditoria)
    if empresa_id is not None:
        stmt = stmt.where(Auditoria.empresa_id == empresa_id)
    if accion:
        stmt = stmt.where(Auditoria.accion == accion)
    if usuario_id is not None:
        stmt = stmt.where(Auditoria.usuario_id == usuario_id)
    stmt = stmt.order_by(Auditoria.fecha.desc()).limit(limit).offset(offset)
    items = list(db.scalars(stmt).all())

    count_stmt = select(Auditoria)
    if empresa_id is not None:
        count_stmt = count_stmt.where(Auditoria.empresa_id == empresa_id)
    if accion:
        count_stmt = count_stmt.where(Auditoria.accion == accion)
    if usuario_id is not None:
        count_stmt = count_stmt.where(Auditoria.usuario_id == usuario_id)
    total = int(db.scalar(count_stmt) or 0)
    return items, total
