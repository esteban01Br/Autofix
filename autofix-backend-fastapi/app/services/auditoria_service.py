"""Lógica de negocio de Auditoria."""

from app.crud import auditoria as crud_auditoria
from app.models.auditoria import Auditoria
from app.schemas.auditoria import AuditoriaResponse


def to_response(registro: Auditoria) -> AuditoriaResponse:
    return AuditoriaResponse(
        id=registro.id,
        empresaId=registro.empresa_id,
        usuarioId=registro.usuario_id,
        accion=registro.accion,
        entidad=registro.entidad,
        entidadId=registro.entidad_id,
        detalle=registro.detalle,
        fecha=registro.fecha,
    )


def registrar(
    db,
    *,
    empresa_id: int | None,
    usuario_id: int | None,
    accion: str,
    entidad: str | None = None,
    entidad_id: int | None = None,
    detalle: str | None = None,
) -> None:
    """Registra una acción en la auditoría (no lanza errores: es best-effort)."""
    try:
        crud_auditoria.registrar(
            db,
            empresa_id=empresa_id,
            usuario_id=usuario_id,
            accion=accion,
            entidad=entidad,
            entidad_id=entidad_id,
            detalle=detalle,
        )
    except Exception:
        # La auditoría nunca debe romper la operación principal
        db.rollback()


def listar(
    db,
    empresa_id: int | None,
    *,
    accion: str | None = None,
    usuario_id: int | None = None,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[AuditoriaResponse], int]:
    items, total = crud_auditoria.listar(
        db, empresa_id, accion=accion, usuario_id=usuario_id, limit=limit, offset=offset
    )
    return [to_response(r) for r in items], total
