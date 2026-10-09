"""Rutas de Factura."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro, get_current_user
from app.database import get_db
from app.models.usuario import Usuario
from app.schemas.factura import FacturaCreate, FacturaResponse
from app.services import factura_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/facturas", tags=["Facturas"])


@router.post(
    "",
    response_model=FacturaResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generar factura de una orden",
    description="Calcula subtotal, IVA (según la empresa) y total a partir de "
    "los detalles de la orden, con consecutivo FAC-0001 por empresa.",
)
def crear_factura(
    payload: FacturaCreate,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> FacturaResponse:
    creada = factura_service.crear_factura(db, usuario.empresa_id, payload)
    auditar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="FACTURAR",
        entidad="Factura",
        entidad_id=creada.id,
        detalle=f"{creada.numero} · total {creada.total}",
    )
    return creada


@router.get(
    "",
    response_model=list[FacturaResponse],
    summary="Listar facturas (con filtros, orden y paginación)",
)
def listar_facturas(
    db: Session = Depends(get_db),
    resp: Response = Response(),
    usuario: Usuario = Depends(get_current_user),
    desde: date | None = Query(None, description="Fecha desde (YYYY-MM-DD)"),
    hasta: date | None = Query(None, description="Fecha hasta (YYYY-MM-DD)"),
    orden_trabajo_id: int | None = Query(None),
    orden: str | None = Query(
        None, description="Campo de orden: id, numero, fecha, subtotal, iva, total"
    ),
    direccion: str = Query("asc", pattern="^(asc|desc)$"),
    limit: int | None = Query(None, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[FacturaResponse]:
    desde_dt = datetime.combine(desde, time.min) if desde else None
    hasta_dt = datetime.combine(hasta, time.max) if hasta else None
    items, total = factura_service.listar_facturas(
        db,
        empresa_filtro(usuario),
        desde=desde_dt,
        hasta=hasta_dt,
        orden_trabajo_id=orden_trabajo_id,
        orden=orden,
        direccion=direccion,
        limit=limit,
        offset=offset,
    )
    resp.headers["X-Total-Count"] = str(total)
    return items


@router.get(
    "/{factura_id}",
    response_model=FacturaResponse,
    summary="Obtener factura por id",
)
def obtener_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> FacturaResponse:
    return factura_service.obtener_factura(db, empresa_filtro(usuario), factura_id)


@router.delete(
    "/{factura_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Eliminar factura",
)
def eliminar_factura(
    factura_id: int,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> Response:
    factura_service.eliminar_factura(db, empresa_filtro(usuario), factura_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
