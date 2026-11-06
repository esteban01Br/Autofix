"""Rutas de Reportes (productividad y resumen)."""

from datetime import date, datetime, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.routers.deps import admin, empresa_filtro
from app.database import get_db
from app.models.usuario import Usuario
from app.services import reporte_service, productividad_service

router = APIRouter(prefix="/api/reportes", tags=["Reportes"])


@router.get(
    "/ventas-mensuales",
    summary="Facturación por mes (últimos N meses)",
    description=(
        "Serie mensual de facturación para gráficas: total facturado y "
        "cantidad de facturas por mes. Incluye los meses sin facturas (0)."
    ),
)
def ventas_mensuales(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    meses: int = Query(12, ge=1, le=24, description="Cantidad de meses (máx. 24)"),
) -> list[dict]:
    return reporte_service.ventas_mensuales(db, empresa_filtro(usuario), meses=meses)


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
    "/productividad-periodo",
    summary="Resumen de productividad por periodo (solo ADMIN)",
    description=(
        "Resumen diario, semanal, quincenal o mensual de la empresa, por rol y "
        "por empleado, comparado con el periodo anterior. Solo el administrador."
    ),
)
def productividad_periodo(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    periodo: str = Query("diario", pattern="^(diario|semanal|quincenal|mensual)$"),
    fecha: date | None = Query(None, description="Cualquier día del periodo (por defecto, hoy)"),
) -> dict:
    return productividad_service.resumen_periodo(
        db, usuario.empresa_id, periodo, fecha or productividad_service.hoy_local()
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


@router.get(
    "/productividad-periodo/pdf",
    summary="Descargar resumen de productividad en PDF",
)
def productividad_periodo_pdf(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(admin),
    periodo: str = Query("diario", pattern="^(diario|semanal|quincenal|mensual)$"),
    fecha: date | None = Query(None, description="Cualquier día del periodo (por defecto, hoy)"),
) -> dict:
    from app.services.productividad_service import resumen_periodo, hoy_local
    from app.services.productividad_pdf_service import resumen_periodo_pdf as generar_pdf

    resumen_data = resumen_periodo(
        db, usuario.empresa_id, periodo, fecha or hoy_local()
    )

    # Obtener empresa para el encabezado (simplificado: usar primera empresa activa)
    from app.services.empresa_service import listar as listar_empresas
    empresas = listar_empresas(db)
    empresa = empresas[0] if empresas else None

    pdf_bytes = generar_pdf(resumen_data, periodo, fecha or hoy_local(), empresa)

    return {"archivo_bytes": pdf_bytes, "content_type": "application/pdf"}