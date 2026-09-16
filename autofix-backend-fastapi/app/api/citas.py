"""Rutas de Cita."""

from datetime import date

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.api.deps import admin, get_current_user
from app.database import get_db
from app.models.enums import EstadoCita
from app.models.usuario import Usuario
from app.schemas.cita import CitaCreate, CitaEstadoRequest, CitaResponse, CitaUpdate
from app.services import cita_service

router = APIRouter(prefix="/api/citas", tags=["Citas"])


@router.post(
    "",
    response_model=CitaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cita",
    dependencies=[Depends(admin)],
)
def crear_cita(payload: CitaCreate, db: Session = Depends(get_db)) -> CitaResponse:
    return cita_service.crear_cita(db, payload)


@router.get(
    "",
    response_model=list[CitaResponse],
    summary="Listar citas (con filtros, orden y paginación)",
)
def listar_citas(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    _usuario: Usuario = Depends(get_current_user),
    estado: EstadoCita | None = Query(None),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
    vehiculo_id: int | None = Query(None),
    orden: str | None = Query(
        None, description="Campo de orden: id, fecha, hora, estado"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[CitaResponse]:
    items, total = cita_service.listar_citas(
        db,
        estado=estado,
        desde=desde,
        hasta=hasta,
        vehiculo_id=vehiculo_id,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{cita_id}",
    response_model=CitaResponse,
    summary="Obtener cita por id",
)
def obtener_cita(
    cita_id: int,
    db: Session = Depends(get_db),
    _usuario: Usuario = Depends(get_current_user),
) -> CitaResponse:
    return cita_service.obtener_cita(db, cita_id)


@router.put(
    "/{cita_id}",
    response_model=CitaResponse,
    summary="Actualizar cita",
    dependencies=[Depends(admin)],
)
def actualizar_cita(
    cita_id: int,
    payload: CitaUpdate,
    db: Session = Depends(get_db),
) -> CitaResponse:
    return cita_service.actualizar_cita(db, cita_id, payload)


@router.patch(
    "/{cita_id}/estado",
    response_model=CitaResponse,
    summary="Cambiar estado de la cita",
    dependencies=[Depends(admin)],
)
def cambiar_estado_cita(
    cita_id: int,
    payload: CitaEstadoRequest,
    db: Session = Depends(get_db),
) -> CitaResponse:
    return cita_service.cambiar_estado(db, cita_id, payload.estado)


@router.delete(
    "/{cita_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cita",
    dependencies=[Depends(admin)],
)
def eliminar_cita(cita_id: int, db: Session = Depends(get_db)) -> Response:
    cita_service.eliminar_cita(db, cita_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)