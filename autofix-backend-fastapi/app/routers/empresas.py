"""Rutas de Empresa (multiempresa)."""

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, get_current_user, superadmin
from app.database import get_db
from app.limiter import limiter
from app.models.usuario import Usuario
from app.schemas.empresa import (
    EmpresaRegistroRequest,
    EmpresaRegistroResponse,
    EmpresaResponse,
    EmpresaUpdate,
)
from app.services import empresa_service

router = APIRouter(prefix="/api/empresas", tags=["Empresas"])


@router.post(
    "/registro",
    response_model=EmpresaRegistroResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una empresa nueva",
    description="Crea la empresa, su sucursal principal y el dueño como "
    "usuario ADMIN. Devuelve el token ya autenticado. Ruta pública.",
)
@limiter.limit("3/minute")
def registrar_empresa(
    request: Request, payload: EmpresaRegistroRequest, db: Session = Depends(get_db)
) -> EmpresaRegistroResponse:
    return empresa_service.registrar_empresa(db, payload)


@router.get(
    "",
    response_model=list[EmpresaResponse],
    summary="Listar todas las empresas (SUPERADMIN)",
)
def listar_empresas(
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(superadmin),
) -> list[EmpresaResponse]:
    return empresa_service.listar_empresas(db)


@router.get(
    "/actual",
    response_model=EmpresaResponse,
    summary="Datos de mi empresa",
)
def obtener_actual(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> EmpresaResponse:
    return empresa_service.obtener_actual(db, usuario.empresa_id)


@router.put(
    "/actual",
    response_model=EmpresaResponse,
    summary="Actualizar marca y datos de mi empresa (ADMIN)",
)
def actualizar_actual(
    payload: EmpresaUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> EmpresaResponse:
    return empresa_service.actualizar_actual(db, usuario.empresa_id, payload)


@router.patch(
    "/{empresa_id}/estado",
    response_model=EmpresaResponse,
    summary="Activar o suspender una empresa (SUPERADMIN)",
)
def cambiar_estado(
    empresa_id: int,
    activa: bool = Query(..., description="true = activa, false = suspendida"),
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(superadmin),
) -> EmpresaResponse:
    return empresa_service.cambiar_estado(db, empresa_id, activa)
