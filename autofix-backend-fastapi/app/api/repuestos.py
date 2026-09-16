"""Rutas de Repuesto."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import admin, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.repuesto import (
    AjusteStockRequest,
    RepuestoCreate,
    RepuestoResponse,
    RepuestoUpdate,
)
from app.services import repuesto_service

router = APIRouter(prefix="/api/repuestos", tags=["Repuestos"])


@router.post(
    "",
    response_model=RepuestoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear repuesto",
    dependencies=[Depends(admin)],
)
def crear_repuesto(payload: RepuestoCreate, db: Session = Depends(get_db)) -> RepuestoResponse:
    return repuesto_service.crear_repuesto(db, payload)


@router.get(
    "",
    response_model=list[RepuestoResponse],
    summary="Listar repuestos (con filtros, orden y paginación)",
)
def listar_repuestos(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    _usuario: Usuario = Depends(get_current_user),
    busqueda: str | None = Query(None, description="Filtra por nombre o descripción"),
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
    "/{repuesto_id}",
    response_model=RepuestoResponse,
    summary="Obtener repuesto por id",
)
def obtener_repuesto(
    repuesto_id: int,
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(get_current_user),
) -> RepuestoResponse:
    return repuesto_service.obtener_repuesto(db, repuesto_id)


@router.put(
    "/{repuesto_id}",
    response_model=RepuestoResponse,
    summary="Actualizar repuesto",
    dependencies=[Depends(admin)],
)
def actualizar_repuesto(
    repuesto_id: int,
    payload: RepuestoUpdate,
    db: Session = Depends(get_db),
) -> RepuestoResponse:
    return repuesto_service.actualizar_repuesto(db, repuesto_id, payload)


@router.patch(
    "/{repuesto_id}/stock",
    response_model=RepuestoResponse,
    summary="Ajustar stock (entrada o salida manual)",
    dependencies=[Depends(admin)],
)
def ajustar_stock(
    repuesto_id: int,
    payload: AjusteStockRequest,
    db: Session = Depends(get_db),
) -> RepuestoResponse:
    return repuesto_service.ajustar_stock(db, repuesto_id, payload.cantidad)


@router.delete(
    "/{repuesto_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar repuesto",
    dependencies=[Depends(admin)],
)
def eliminar_repuesto(repuesto_id: int, db: Session = Depends(get_db)) -> Response:
    repuesto_service.eliminar_repuesto(db, repuesto_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)