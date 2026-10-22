"""Rutas de Cotizacion."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.enums import EstadoCotizacion
from app.models.usuario import Usuario
from app.routers.deps import empresa_filtro, gestion, get_current_user
from app.schemas.cotizacion import (
    CotizacionCreate,
    CotizacionEstadoRequest,
    CotizacionResponse,
    CotizacionUpdate,
)
from app.schemas.orden_trabajo import OrdenTrabajoResponse
from app.services import cotizacion_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/cotizaciones", tags=["Cotizaciones"])


@router.post(
    "",
    response_model=CotizacionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cotización con sus líneas",
    description=(
        "Crea una cotización en BORRADOR con líneas de repuestos, servicios "
        "o conceptos libres. Calcula subtotal, IVA (según la empresa) y total. "
        "No descuenta stock."
    ),
)
def crear_cotizacion(
    payload: CotizacionCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> CotizacionResponse:
    creada = cotizacion_service.crear_cotizacion(db, usuario.empresa_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CREAR_COTIZACION",
        entidad="Cotizacion",
        entidad_id=creada.id,
        detalle=f"{creada.numero} · total {creada.total}",
    )
    return creada


@router.get(
    "",
    response_model=list[CotizacionResponse],
    summary="Listar cotizaciones (con filtros, orden y paginación)",
)
def listar_cotizaciones(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    estado: EstadoCotizacion | None = Query(None),
    vehiculo_id: int | None = Query(None),
    cliente_id: int | None = Query(None),
    desde: date | None = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    hasta: date | None = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    orden: str | None = Query(
        None, description="Campo de orden: id, numero, fecha, total, estado"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[CotizacionResponse]:
    desde_dt = datetime.combine(desde, time.min) if desde else None
    hasta_dt = datetime.combine(hasta, time.max) if hasta else None
    items, total = cotizacion_service.listar_cotizaciones(
        db,
        empresa_filtro(usuario),
        estado=estado,
        vehiculo_id=vehiculo_id,
        cliente_id=cliente_id,
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
    "/{cotizacion_id}",
    response_model=CotizacionResponse,
    summary="Obtener cotización por id",
)
def obtener_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> CotizacionResponse:
    return cotizacion_service.obtener_cotizacion(
        db, empresa_filtro(usuario), cotizacion_id
    )


@router.put(
    "/{cotizacion_id}",
    response_model=CotizacionResponse,
    summary="Editar cotización en BORRADOR",
)
def actualizar_cotizacion(
    cotizacion_id: int,
    payload: CotizacionUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> CotizacionResponse:
    actualizada = cotizacion_service.actualizar_cotizacion(
        db, empresa_filtro(usuario), cotizacion_id, payload
    )
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="ACTUALIZAR_COTIZACION",
        entidad="Cotizacion",
        entidad_id=actualizada.id,
        detalle=actualizada.numero,
    )
    return actualizada


@router.patch(
    "/{cotizacion_id}/estado",
    response_model=CotizacionResponse,
    summary="Cambiar estado de la cotización",
    description=(
        "Transiciones válidas: BORRADOR→ENVIADA; "
        "ENVIADA→APROBADA/RECHAZADA/VENCIDA."
    ),
)
def cambiar_estado(
    cotizacion_id: int,
    payload: CotizacionEstadoRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> CotizacionResponse:
    actualizada = cotizacion_service.cambiar_estado(
        db, empresa_filtro(usuario), cotizacion_id, payload.estado
    )
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CAMBIAR_ESTADO_COTIZACION",
        entidad="Cotizacion",
        entidad_id=actualizada.id,
        detalle=f"{actualizada.numero} → {actualizada.estado.value}",
    )
    return actualizada


@router.post(
    "/{cotizacion_id}/convertir",
    response_model=OrdenTrabajoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Convertir cotización aprobada en orden de trabajo",
    description=(
        "Crea una OrdenTrabajo a partir de una cotización APROBADA. Los "
        "repuestos pasan a detalles de la orden (descuentan stock con "
        "validación de disponibilidad)."
    ),
)
def convertir_a_orden(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> OrdenTrabajoResponse:
    from app.services import orden_trabajo_service

    orden = cotizacion_service.convertir_a_orden(
        db, empresa_filtro(usuario), cotizacion_id
    )
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CONVERTIR_COTIZACION",
        entidad="OrdenTrabajo",
        entidad_id=orden.id,
        detalle=f"Cotización #{cotizacion_id} → orden #{orden.id}",
    )
    return orden_trabajo_service.to_response(orden)


@router.delete(
    "/{cotizacion_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cotización (BORRADOR o RECHAZADA)",
)
def eliminar_cotizacion(
    cotizacion_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> Response:
    cotizacion_service.eliminar_cotizacion(
        db, empresa_filtro(usuario), cotizacion_id
    )
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="ELIMINAR_COTIZACION",
        entidad="Cotizacion",
        entidad_id=cotizacion_id,
        detalle="Cotización eliminada",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
