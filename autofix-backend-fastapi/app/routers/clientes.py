"""Rutas de Cliente."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from app.services import cliente_service

router = APIRouter(prefix="/api/clientes", tags=["Clientes"])


@router.post(
    "",
    response_model=ClienteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear cliente",
)
def crear_cliente(
    payload: ClienteCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> ClienteResponse:
    return cliente_service.crear_cliente(db, usuario.empresa_id, payload)


@router.get(
    "",
    response_model=list[ClienteResponse],
    summary="Listar clientes (con filtros, orden y paginación)",
)
def listar_clientes(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    busqueda: str | None = Query(None, description="Filtra por nombre, apellido, correo o dirección"),
    orden: str | None = Query(
        None, description="Campo de orden: id, direccion, nombre, apellido, correo"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[ClienteResponse]:
    items, total = cliente_service.listar_clientes(
        db,
        empresa_filtro(usuario),
        busqueda=busqueda,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{cliente_id}",
    response_model=ClienteResponse,
    summary="Obtener cliente por id",
)
def obtener_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ClienteResponse:
    return cliente_service.obtener_cliente(db, empresa_filtro(usuario), cliente_id)


@router.put(
    "/{cliente_id}",
    response_model=ClienteResponse,
    summary="Actualizar cliente",
)
def actualizar_cliente(
    cliente_id: int,
    payload: ClienteUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> ClienteResponse:
    return cliente_service.actualizar_cliente(db, empresa_filtro(usuario), cliente_id, payload)


@router.delete(
    "/{cliente_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar cliente",
)
def eliminar_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    cliente_service.eliminar_cliente(db, empresa_filtro(usuario), cliente_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
