"""Rutas de Suscripción (planes, estado y renovación del SaaS)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.routers.deps import get_current_user, gestion, superadmin
from app.database import get_db
from app.models.empresa import Empresa
from app.models.usuario import Usuario
from app.schemas.suscripcion import (
    PlanInfo,
    SuscripcionGestionRequest,
    SuscripcionResponse,
)
from app.services import suscripcion_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/suscripciones", tags=["Suscripciones"])


@router.get(
    "/planes",
    response_model=list[PlanInfo],
    summary="Catálogo público de planes",
    description="Ruta pública: planes y precios que muestra el portal de ventas.",
)
def listar_planes() -> list[PlanInfo]:
    return suscripcion_service.listar_planes()


@router.get(
    "/actual",
    response_model=SuscripcionResponse | None,
    summary="Suscripción de mi empresa",
)
def suscripcion_actual(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> SuscripcionResponse | None:
    suscripcion = suscripcion_service.obtener(db, usuario.empresa_id)
    if suscripcion is None:
        return None
    return suscripcion_service.to_response(suscripcion)


@router.post(
    "/renovar",
    response_model=SuscripcionResponse,
    summary="Renovar la suscripción de mi empresa (ADMIN/GERENTE)",
)
def renovar_suscripcion(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> SuscripcionResponse:
    suscripcion = suscripcion_service.renovar(db, usuario.empresa_id)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="RENOVAR_SUSCRIPCION",
        entidad="Suscripcion",
        entidad_id=suscripcion.id,
        detalle=f"Plan {suscripcion.plan.value} hasta {suscripcion.fecha_fin:%Y-%m-%d}",
    )
    return suscripcion


@router.post(
    "/empresas/{empresa_id}",
    response_model=SuscripcionResponse,
    summary="Crear o ajustar la suscripción de una empresa (SUPERADMIN)",
    description="Soporte simulado: permite activar, renovar o marcar "
    "vencida/cancelada la suscripción de cualquier empresa.",
)
def gestionar_suscripcion(
    empresa_id: int,
    payload: SuscripcionGestionRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(superadmin),
) -> SuscripcionResponse:
    empresa = db.get(Empresa, empresa_id)
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")

    suscripcion = suscripcion_service.aplicar(
        db,
        empresa_id,
        plan=payload.plan,
        dias=payload.dias,
        fecha_fin=payload.fecha_fin,
        estado=payload.estado,
    )
    db.commit()

    auditar(
        db,
        empresa_id=empresa_id,
        usuario_id=usuario.id,
        accion="GESTIONAR_SUSCRIPCION",
        entidad="Suscripcion",
        entidad_id=suscripcion.id,
        detalle=(
            f"Plan {suscripcion.plan.value} · {suscripcion.estado.value}"
            f" · hasta {suscripcion.fecha_fin:%Y-%m-%d}"
        ),
    )
    return suscripcion_service.to_response(suscripcion)
