"""Rutas de Repuesto."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.repuesto import (
    AjusteStockRequest,
    RepuestoCreate,
    RepuestoResponse,
    RepuestoUpdate,
)
from app.services import repuesto_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/repuestos", tags=["Repuestos"])


@router.post(
    "",
    response_model=RepuestoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear repuesto",
)
def crear_repuesto(
    payload: RepuestoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> RepuestoResponse:
    creado = repuesto_service.crear_repuesto(db, usuario.empresa_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CREAR_REPUESTO",
        entidad="Repuesto",
        entidad_id=creado.id,
        detalle=f"{creado.nombre} · stock {creado.stock} · {creado.precio}",
    )
    return creado


@router.get(
    "",
    response_model=list[RepuestoResponse],
    summary="Listar repuestos (con filtros, orden y paginación)",
)
def listar_repuestos(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    busqueda: str | None = Query(None, description="Filtra por nombre, código o descripción"),
    stock_min: int | None = Query(None, ge=0),
    stock_max: int | None = Query(None, ge=0),
    orden: str | None = Query(
        None, description="Campo de orden: id, nombre, stock, precio"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[RepuestoResponse]:
    items, total = repuesto_service.listar_repuestos(
        db,
        empresa_filtro(usuario),
        busqueda=busqueda,
        stock_min=stock_min,
        stock_max=stock_max,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/por-codigo/{codigo}",
    response_model=RepuestoResponse,
    summary="Buscar repuesto por código de barras (de tu empresa)",
    description="Usado por el escáner: devuelve 404 si el código no está registrado.",
)
def buscar_por_codigo(
    codigo: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> RepuestoResponse:
    return repuesto_service.obtener_por_codigo(db, empresa_filtro(usuario), codigo)


@router.get(
    "/{repuesto_id}",
    response_model=RepuestoResponse,
    summary="Obtener repuesto por id",
)
def obtener_repuesto(
    repuesto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> RepuestoResponse:
    return repuesto_service.obtener_repuesto(db, empresa_filtro(usuario), repuesto_id)


@router.put(
    "/{repuesto_id}",
    response_model=RepuestoResponse,
    summary="Actualizar repuesto",
)
def actualizar_repuesto(
    repuesto_id: int,
    payload: RepuestoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> RepuestoResponse:
    return repuesto_service.actualizar_repuesto(db, empresa_filtro(usuario), repuesto_id, payload)


@router.patch(
    "/{repuesto_id}/stock",
    response_model=RepuestoResponse,
    summary="Ajustar stock (entrada o salida manual)",
)
def ajustar_stock(
    repuesto_id: int,
    payload: AjusteStockRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> RepuestoResponse:
    return repuesto_service.ajustar_stock(db, empresa_filtro(usuario), repuesto_id, payload.cantidad)


@router.delete(
    "/{repuesto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar repuesto",
)
def eliminar_repuesto(
    repuesto_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    repuesto_service.eliminar_repuesto(db, empresa_filtro(usuario), repuesto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
