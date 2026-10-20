"""Rutas de Servicio (catálogo de servicios y mano de obra)."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import empresa_filtro, gestion, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.servicio import ServicioCreate, ServicioResponse, ServicioUpdate
from app.services import servicio_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/servicios", tags=["Servicios"])


@router.get(
    "",
    response_model=list[ServicioResponse],
    summary="Listar servicios del catálogo",
)
def listar_servicios(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
    solo_activos: bool = Query(False, description="Solo servicios activos"),
) -> list[ServicioResponse]:
    return servicio_service.listar_servicios(
        db, empresa_filtro(usuario), solo_activos=solo_activos
    )


@router.get(
    "/{servicio_id}",
    response_model=ServicioResponse,
    summary="Obtener servicio por id",
)
def obtener_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ServicioResponse:
    return servicio_service.obtener_servicio(
        db, empresa_filtro(usuario), servicio_id
    )


@router.post(
    "",
    response_model=ServicioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear servicio (ADMIN/GERENTE)",
)
def crear_servicio(
    payload: ServicioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> ServicioResponse:
    creado = servicio_service.crear_servicio(db, usuario.empresa_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CREAR_SERVICIO",
        entidad="Servicio",
        entidad_id=creado.id,
        detalle=f"{creado.nombre} · {creado.precio}",
    )
    return creado


@router.put(
    "/{servicio_id}",
    response_model=ServicioResponse,
    summary="Actualizar servicio (ADMIN/GERENTE)",
)
def actualizar_servicio(
    servicio_id: int,
    payload: ServicioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> ServicioResponse:
    return servicio_service.actualizar_servicio(
        db, usuario.empresa_id, servicio_id, payload
    )


@router.delete(
    "/{servicio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar servicio (ADMIN/GERENTE)",
)
def eliminar_servicio(
    servicio_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> Response:
    servicio_service.eliminar_servicio(db, usuario.empresa_id, servicio_id)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="ELIMINAR_SERVICIO",
        entidad="Servicio",
        entidad_id=servicio_id,
        detalle="Servicio eliminado del catálogo",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
