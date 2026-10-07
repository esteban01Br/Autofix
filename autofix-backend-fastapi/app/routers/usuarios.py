"""Rutas de Usuario (solo administradores)."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro
from app.database import get_db
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.services import usuario_service

router = APIRouter(
    prefix="/api/usuarios",
    tags=["Usuarios"],
    responses={401: {"description": "No autenticado"}},
)


@router.post(
    "",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear usuario",
)
def crear_usuario(
    payload: UsuarioCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> UsuarioResponse:
    return usuario_service.crear_usuario(db, usuario.empresa_id, payload)


@router.get(
    "",
    response_model=list[UsuarioResponse],
    summary="Listar usuarios (con filtros, orden y paginación)",
)
def listar_usuarios(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(admin),
    busqueda: str | None = Query(None, description="Filtra por nombre, apellido o correo"),
    rol: Rol | None = Query(None, description="Filtra por rol (ADMIN, MECANICO, CLIENTE)"),
    activo: bool | None = Query(None, description="Filtra por estado activo/inactivo"),
    orden: str | None = Query(
        None,
        description=(
            "Campo por el que ordenar: id, nombre, apellido, correo, rol, activo, "
            "fecha_creacion"
        ),
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[UsuarioResponse]:
    items, total = usuario_service.listar_usuarios(
        db,
        empresa_filtro(usuario),
        busqueda=busqueda,
        rol=rol,
        activo=activo,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{usuario_id}",
    response_model=UsuarioResponse,
    summary="Obtener usuario por id",
)
def obtener_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> UsuarioResponse:
    return usuario_service.obtener_usuario(db, empresa_filtro(usuario), usuario_id)


@router.put(
    "/{usuario_id}",
    response_model=UsuarioResponse,
    summary="Actualizar usuario",
)
def actualizar_usuario(
    usuario_id: int,
    payload: UsuarioUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> UsuarioResponse:
    return usuario_service.actualizar_usuario(db, empresa_filtro(usuario), usuario_id, payload)


@router.delete(
    "/{usuario_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar usuario",
)
def eliminar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    usuario_service.eliminar_usuario(db, empresa_filtro(usuario), usuario_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
