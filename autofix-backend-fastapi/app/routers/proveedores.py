"""Rutas de Proveedor."""

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import empresa_filtro, gestion, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.proveedor import (
    ProveedorCreate,
    ProveedorResponse,
    ProveedorUpdate,
)
from app.services import proveedor_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/proveedores", tags=["Proveedores"])


@router.get(
    "",
    response_model=list[ProveedorResponse],
    summary="Listar proveedores (con filtros y paginación)",
)
def listar_proveedores(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    activo: bool | None = Query(None, description="Filtra por activo"),
    busqueda: str | None = Query(
        None, description="Filtra por nombre, contacto, correo o NIT"
    ),
    orden: str | None = Query(None, description="Campo de orden: id, nombre, activo"),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[ProveedorResponse]:
    items, total = proveedor_service.listar_proveedores(
        db,
        empresa_filtro(usuario),
        activo=activo,
        busqueda=busqueda,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{proveedor_id}",
    response_model=ProveedorResponse,
    summary="Obtener proveedor por id",
)
def obtener_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> ProveedorResponse:
    return proveedor_service.obtener_proveedor(
        db, empresa_filtro(usuario), proveedor_id
    )


@router.post(
    "",
    response_model=ProveedorResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Crear proveedor (ADMIN/GERENTE)",
)
def crear_proveedor(
    payload: ProveedorCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> ProveedorResponse:
    creado = proveedor_service.crear_proveedor(db, usuario.empresa_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="CREAR_PROVEEDOR",
        entidad="Proveedor",
        entidad_id=creado.id,
        detalle=creado.nombre,
    )
    return creado


@router.put(
    "/{proveedor_id}",
    response_model=ProveedorResponse,
    summary="Actualizar proveedor (ADMIN/GERENTE)",
)
def actualizar_proveedor(
    proveedor_id: int,
    payload: ProveedorUpdate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> ProveedorResponse:
    actualizado = proveedor_service.actualizar_proveedor(
        db, empresa_filtro(usuario), proveedor_id, payload
    )
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="ACTUALIZAR_PROVEEDOR",
        entidad="Proveedor",
        entidad_id=actualizado.id,
        detalle=actualizado.nombre,
    )
    return actualizado


@router.delete(
    "/{proveedor_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar proveedor (ADMIN/GERENTE)",
    description=(
        "Solo se elimina si no tiene repuestos asociados; en ese caso "
        "se debe desactivar para conservar el historial."
    ),
)
def eliminar_proveedor(
    proveedor_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(gestion),
) -> Response:
    proveedor_service.eliminar_proveedor(db, empresa_filtro(usuario), proveedor_id)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="ELIMINAR_PROVEEDOR",
        entidad="Proveedor",
        entidad_id=proveedor_id,
        detalle="Proveedor eliminado",
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
