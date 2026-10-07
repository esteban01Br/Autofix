"""Rutas de Orden de Trabajo."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.enums import EstadoOrden
from app.models.usuario import Usuario
from app.schemas.orden_trabajo import (
    AsignarMecanicoRequest,
    OrdenTrabajoCreate,
    OrdenTrabajoEstadoRequest,
    OrdenTrabajoResponse,
    OrdenTrabajoUpdate,
)
from app.services import orden_trabajo_service

router = APIRouter(prefix="/api/ordenes", tags=["Órdenes de Trabajo"])


@router.post(
    "",
    response_model=OrdenTrabajoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear orden de trabajo",
)
def crear_orden(
    payload: OrdenTrabajoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> OrdenTrabajoResponse:
    return orden_trabajo_service.crear_orden(db, usuario.empresa_id, payload)


@router.get(
    "",
    response_model=list[OrdenTrabajoResponse],
    summary="Listar órdenes (con filtros, orden y paginación)",
)
def listar_ordenes(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    estado: EstadoOrden | None = Query(None),
    vehiculo_id: int | None = Query(None),
    mecanico_id: int | None = Query(None),
    desde: date | None = Query(None, description="Fecha de ingreso desde (YYYY-MM-DD)"),
    hasta: date | None = Query(None, description="Fecha de ingreso hasta (YYYY-MM-DD)"),
    orden: str | None = Query(
        None, description="Campo de orden: id, fecha_ingreso, fecha_salida, estado"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[OrdenTrabajoResponse]:
    desde_dt = datetime.combine(desde, time.min) if desde else None
    hasta_dt = datetime.combine(hasta, time.max) if hasta else None
    items, total = orden_trabajo_service.listar_ordenes(
        db,
        empresa_filtro(usuario),
        estado=estado,
        vehiculo_id=vehiculo_id,
        mecanico_id=mecanico_id,
        desde=desde_dt,
        hasta=hasta_dt,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{orden_id}",
    response_model=OrdenTrabajoResponse,
    summary="Obtener orden de trabajo por id",
)
def obtener_orden(
    orden_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> OrdenTrabajoResponse:
    return orden_trabajo_service.obtener_orden(db, empresa_filtro(usuario), orden_id)


@router.put(
    "/{orden_id}",
    response_model=OrdenTrabajoResponse,
    summary="Actualizar orden de trabajo",
)
def actualizar_orden(
    orden_id: int,
    payload: OrdenTrabajoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> OrdenTrabajoResponse:
    return orden_trabajo_service.actualizar_orden(db, empresa_filtro(usuario), orden_id, payload)


@router.patch(
    "/{orden_id}/estado",
    response_model=OrdenTrabajoResponse,
    summary="Cambiar estado de la orden",
    description="Al pasar a ENTREGADO se registra la fecha de salida automáticamente.",
)
def cambiar_estado_orden(
    orden_id: int,
    payload: OrdenTrabajoEstadoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> OrdenTrabajoResponse:
    return orden_trabajo_service.cambiar_estado(db, empresa_filtro(usuario), orden_id, payload.estado)


@router.patch(
    "/{orden_id}/mecanico",
    response_model=OrdenTrabajoResponse,
    summary="Asignar mecánico a la orden",
)
def asignar_mecanico(
    orden_id: int,
    payload: AsignarMecanicoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> OrdenTrabajoResponse:
    return orden_trabajo_service.asignar_mecanico(db, empresa_filtro(usuario), orden_id, payload.mecanicoId)


@router.delete(
    "/{orden_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar orden de trabajo",
)
def eliminar_orden(
    orden_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    orden_trabajo_service.eliminar_orden(db, empresa_filtro(usuario), orden_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
