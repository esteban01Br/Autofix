"""Rutas de Detalle de Orden (repuestos de una orden de trabajo)."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empleado, empresa_filtro
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.detalle_orden import (
    DetalleOrdenCreate,
    DetalleOrdenResponse,
    DetalleOrdenUpdate,
)
from app.services import detalle_orden_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/detalles", tags=["Detalles de Orden"])


@router.post(
    "/orden/{orden_id}",
    response_model=DetalleOrdenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Agregar repuesto a una orden",
    description="Valida el stock y lo descuenta automáticamente.",
)
def crear_detalle(
    orden_id: int,
    payload: DetalleOrdenCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> DetalleOrdenResponse:
    creado = detalle_orden_service.crear_detalle(db, empresa_filtro(usuario), orden_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="AGREGAR_DETALLE_ORDEN",
        entidad="DetalleOrden",
        entidad_id=creado.id,
        detalle=f"Repuesto agregado a la orden: {creado.repuestoId}",
    )
    return creado


@router.get(
    "",
    response_model=list[DetalleOrdenResponse],
    summary="Listar detalles (filtro por orden, orden y paginación)",
)
def listar_detalles(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(empleado),
    orden_id: int | None = Query(None, description="Filtra por orden de trabajo"),
    orden: str | None = Query(
        None, description="Campo de orden: id, cantidad, precio_unitario"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[DetalleOrdenResponse]:
    items, total = detalle_orden_service.listar_detalles(
        db,
        empresa_filtro(usuario),
        orden_id=orden_id,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/orden/{orden_id}",
    response_model=list[DetalleOrdenResponse],
    summary="Listar detalles de una orden específica",
)
def listar_detalles_por_orden(
    orden_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(empleado),
) -> list[DetalleOrdenResponse]:
    return detalle_orden_service.listar_por_orden(db, empresa_filtro(usuario), orden_id)


@router.get(
    "/{detalle_id}",
    response_model=DetalleOrdenResponse,
    summary="Obtener detalle por id",
)
def obtener_detalle(
    detalle_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(empleado),
) -> DetalleOrdenResponse:
    return detalle_orden_service.obtener_detalle(db, empresa_filtro(usuario), detalle_id)


@router.put(
    "/{detalle_id}",
    response_model=DetalleOrdenResponse,
    summary="Actualizar detalle",
)
def actualizar_detalle(
    detalle_id: int,
    payload: DetalleOrdenUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> DetalleOrdenResponse:
    return detalle_orden_service.actualizar_detalle(db, empresa_filtro(usuario), detalle_id, payload)


@router.delete(
    "/{detalle_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar detalle (devuelve el stock del repuesto)",
)
def eliminar_detalle(
    detalle_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    detalle_orden_service.eliminar_detalle(db, empresa_filtro(usuario), detalle_id)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="QUITAR_DETALLE_ORDEN",
        entidad="DetalleOrden",
        entidad_id=detalle_id,
        detalle=f"Detalle de orden eliminado (id: {detalle_id}), stock del repuesto devuelto",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
