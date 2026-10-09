"""Rutas de Reportes (productividad y resumen)."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro
from app.database import get_db
from app.models.usuario import Usuario
from app.services import reporte_service

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get(
    "/productividad",
    summary="Productividad por mecánico (órdenes entregadas)",
)
def productividad(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    desde: date | None = Query(None),
    hasta: date | None = Query(None),
) -> list[dict]:
    desde_dt = datetime.combine(desde, time.min) if desde else None
    hasta_dt = datetime.combine(hasta, time.max) if hasta else None
    return reporte_service.productividad_mecanicos(
        db, usuario.empresa_id, desde=desde_dt, hasta=hasta_dt
    )


@router.get(
    "/resumen",
    summary="Resumen general de la empresa",
)
def resumen(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
) -> dict:
    return reporte_service.resumen_empresa(db, usuario.empresa_id)
