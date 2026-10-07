"""Rutas de Vehículo."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.vehiculo import VehiculoCreate, VehiculoResponse, VehiculoUpdate
from app.services import vehiculo_service

router = APIRouter(prefix="/api/vehiculos", tags=["Vehículos"])


@router.post(
    "",
    response_model=VehiculoResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear vehículo",
)
def crear_vehiculo(
    payload: VehiculoCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> VehiculoResponse:
    return vehiculo_service.crear_vehiculo(db, usuario.empresa_id, payload)


@router.get(
    "",
    response_model=list[VehiculoResponse],
    summary="Listar vehículos (con filtros, orden y paginación)",
)
def listar_vehiculos(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    placa: str | None = Query(None),
    marca: str | None = Query(None),
    cliente_id: int | None = Query(None),
    orden: str | None = Query(
        None,
        description="Campo de orden: id, placa, marca, modelo, anio, kilometraje",
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[VehiculoResponse]:
    items, total = vehiculo_service.listar_vehiculos(
        db,
        empresa_filtro(usuario),
        placa=placa,
        marca=marca,
        cliente_id=cliente_id,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{vehiculo_id}",
    response_model=VehiculoResponse,
    summary="Obtener vehículo por id",
)
def obtener_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> VehiculoResponse:
    return vehiculo_service.obtener_vehiculo(db, empresa_filtro(usuario), vehiculo_id)


@router.put(
    "/{vehiculo_id}",
    response_model=VehiculoResponse,
    summary="Actualizar vehículo",
)
def actualizar_vehiculo(
    vehiculo_id: int,
    payload: VehiculoUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> VehiculoResponse:
    return vehiculo_service.actualizar_vehiculo(db, empresa_filtro(usuario), vehiculo_id, payload)


@router.delete(
    "/{vehiculo_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar vehículo",
)
def eliminar_vehiculo(
    vehiculo_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    vehiculo_service.eliminar_vehiculo(db, empresa_filtro(usuario), vehiculo_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
