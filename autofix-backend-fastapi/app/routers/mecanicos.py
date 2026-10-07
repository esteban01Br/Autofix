"""Rutas de Mecánico."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.mecanico import MecanicoCreate, MecanicoResponse, MecanicoUpdate
from app.services import mecanico_service

router = APIRouter(prefix="/api/mecanicos", tags=["Mecánicos"])


@router.post(
    "",
    response_model=MecanicoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear mecánico",
)
def crear_mecanico(
    payload: MecanicoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> MecanicoResponse:
    return mecanico_service.crear_mecanico(db, usuario.empresa_id, payload)


@router.get(
    "",
    response_model=list[MecanicoResponse],
    summary="Listar mecánicos (con filtros, orden y paginación)",
)
def listar_mecanicos(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    busqueda: str | None = Query(None, description="Filtra por nombre, apellido, correo o especialidad"),
    especialidad: str | None = Query(None),
    orden: str | None = Query(
        None, description="Campo de orden: id, especialidad, nombre, apellido, correo"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[MecanicoResponse]:
    items, total = mecanico_service.listar_mecanicos(
        db,
        empresa_filtro(usuario),
        busqueda=busqueda,
        especialidad=especialidad,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{mecanico_id}",
    response_model=MecanicoResponse,
    summary="Obtener mecánico por id",
)
def obtener_mecanico(
    mecanico_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> MecanicoResponse:
    return mecanico_service.obtener_mecanico(db, empresa_filtro(usuario), mecanico_id)


@router.put(
    "/{mecanico_id}",
    response_model=MecanicoResponse,
    summary="Actualizar mecánico",
)
def actualizar_mecanico(
    mecanico_id: int,
    payload: MecanicoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> MecanicoResponse:
    return mecanico_service.actualizar_mecanico(db, empresa_filtro(usuario), mecanico_id, payload)


@router.delete(
    "/{mecanico_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar mecánico",
)
def eliminar_mecanico(
    mecanico_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    mecanico_service.eliminar_mecanico(db, empresa_filtro(usuario), mecanico_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
