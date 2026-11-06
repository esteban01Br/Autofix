"""Rutas de exportación de datos (CSV/ZIP) para los clientes de una empresa."""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.limiter import limiter
from app.models.usuario import Usuario
from app.routers.deps import admin
from app.services import exportar_service
from app.services.auditoria_service import registrar as auditar

router = APIRouter(prefix="/api/exportar", tags=["Exportación"])

_ZONA_COLOMBIA = timezone(timedelta(hours=-5))


def _empresa_del_usuario(usuario: Usuario) -> int:
    """Un ADMIN solo puede exportar los datos de su propia empresa."""
    if usuario.empresa_id is None:
        raise HTTPException(
            status_code=403,
            detail="Tu usuario no está asociado a una empresa.",
        )
    return usuario.empresa_id


def _detalle(entidad: str, desde: date | None, hasta: date | None) -> str:
    partes = [f"Entidad: {entidad}"]
    if desde is not None:
        partes.append(f"desde={desde.isoformat()}")
    if hasta is not None:
        partes.append(f"hasta={hasta.isoformat()}")
    return "; ".join(partes)


@router.get(
    "/todo",
    summary="Descargar todos los datos de la empresa (ZIP de CSV)",
    description="Genera un ZIP con un CSV por entidad. Solo ADMIN, siempre "
    "limitado a su propia empresa.",
)
@limiter.limit("10/minute")
def exportar_todo(
    request: Request,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    desde: date | None = Query(None, description="Fecha inicial (AAAA-MM-DD)"),
    hasta: date | None = Query(None, description="Fecha final (AAAA-MM-DD)"),
) -> StreamingResponse:
    empresa_id = _empresa_del_usuario(usuario)
    auditar(
        db,
        empresa_id=empresa_id,
        usuario_id=usuario.id,
        accion="EXPORTAR_DATOS",
        entidad="todo",
        detalle=_detalle("todo", desde, hasta),
    )
    contenido = exportar_service.generar_zip(empresa_id, desde, hasta)
    hoy = datetime.now(_ZONA_COLOMBIA).date().isoformat()
    return StreamingResponse(
        iter([contenido]),
        media_type="application/zip",
        headers={
            "Content-Disposition": (
                f'attachment; filename="autofix_datos_{hoy}.zip"'
            )
        },
    )


@router.get(
    "/{entidad}",
    summary="Exportar una entidad a CSV",
    description="Entidades: clientes, vehiculos, citas, ordenes, repuestos, "
    "facturas. Solo ADMIN y siempre filtrado por su empresa.",
)
@limiter.limit("10/minute")
def exportar_entidad(
    request: Request,
    entidad: str,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    desde: date | None = Query(None, description="Fecha inicial (AAAA-MM-DD)"),
    hasta: date | None = Query(None, description="Fecha final (AAAA-MM-DD)"),
) -> StreamingResponse:
    if entidad not in exportar_service.ENTIDADES:
        raise HTTPException(
            status_code=404,
            detail=(
                "Entidad no válida. Usa: "
                + ", ".join(exportar_service.ENTIDADES)
            ),
        )
    empresa_id = _empresa_del_usuario(usuario)
    auditar(
        db,
        empresa_id=empresa_id,
        usuario_id=usuario.id,
        accion="EXPORTAR_DATOS",
        entidad=entidad,
        detalle=_detalle(entidad, desde, hasta),
    )
    return StreamingResponse(
        exportar_service.generar_csv(entidad, empresa_id, desde, hasta),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": (
                f'attachment; filename="{exportar_service.nombre_archivo(entidad)}"'
            )
        },
    )
