"""Rutas de Auditoria (solo ADMIN y SUPERADMIN)."""

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, superadmin
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.auditoria import AuditoriaResponse
from app.services import auditoria_service

router = APIRouter(prefix="/api/auditoria", tags=["Auditoría"])


@router.get(
    "",
    response_model=list[AuditoriaResponse],
    summary="Historial de auditoría",
)
def listar_auditoria(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(admin),
    accion: str | None = Query(None, description="Filtra por acción"),
    usuario_id: int | None = Query(None, description="Filtra por usuario"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> list[AuditoriaResponse]:
    items, total = auditoria_service.listar(
        db,
        empresa_filtro(usuario),
        accion=accion,
        usuario_id=usuario_id,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items
