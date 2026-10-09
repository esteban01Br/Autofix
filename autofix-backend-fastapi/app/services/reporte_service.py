"""Lógica de negocio de Reportes (productividad por empleado)."""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import func, select

from app.crud import base as crud_base
from app.models.empresa import Empresa
from app.models.factura import Factura
from app.models.mecanico import Mecanico
from app.models.orden_trabajo import OrdenTrabajo
from app.models.usuario import Usuario
from app.services.base import verificar_empresa


def productividad_mecanicos(
    db,
    empresa_id: int | None,
    *,
    desde: datetime | None = None,
    hasta: datetime | None = None,
) -> list[dict]:
    """Órdenes entregadas por mecánico en un rango de fechas."""
    stmt = (
        select(
            Mecanico.id,
            Usuario.nombre,
            Usuario.apellido,
            func.count(OrdenTrabajo.id).label("ordenes"),
        )
        .join(Usuario, Mecanico.usuario_id == Usuario.id)
        .join(OrdenTrabajo, OrdenTrabajo.mecanico_id == Mecanico.id)
        .where(OrdenTrabajo.estado == "ENTREGADO")
    )
    if empresa_id is not None:
        stmt = stmt.where(Mecanico.empresa_id == empresa_id)
    if desde is not None:
        stmt = stmt.where(OrdenTrabajo.fecha_ingreso >= desde)
    if hasta is not None:
        stmt = stmt.where(OrdenTrabajo.fecha_ingreso <= hasta)
    stmt = stmt.group_by(Mecanico.id).order_by(func.count(OrdenTrabajo.id).desc())

    resultados = []
    for fila in db.execute(stmt).all():
        resultados.append(
            {
                "mecanicoId": fila[0],
                "nombre": f"{fila[1]} {fila[2]}",
                "ordenesEntregadas": fila[3],
            }
        )
    return resultados


def ventas_por_empleado(
    db,
    empresa_id: int | None,
    *,
    desde: datetime | None = None,
    hasta: datetime | None = None,
) -> list[dict]:
    """Total facturado por cajero (usuario que generó la factura)."""
    stmt = (
        select(
            Factura.empresa_id,
            func.count(Factura.id).label("facturas"),
            func.sum(Factura.total).label("total"),
        )
        .where(Factura.empresa_id.isnot(None))
    )
    if empresa_id is not None:
        stmt = stmt.where(Factura.empresa_id == empresa_id)
    if desde is not None:
        stmt = stmt.where(Factura.fecha >= desde)
    if hasta is not None:
        stmt = stmt.where(Factura.fecha <= hasta)
    stmt = stmt.group_by(Factura.empresa_id)

    resultados = []
    for fila in db.execute(stmt).all():
        resultados.append(
            {
                "empresaId": fila[0],
                "facturasEmitidas": fila[1],
                "totalFacturado": float(fila[2] or 0),
            }
        )
    return resultados


def resumen_empresa(db, empresa_id: int | None) -> dict:
    """Resumen general de una empresa: conteos de entidades."""
    if empresa_id is None:
        return {}

    empresa = crud_base.obtener_o_404(db, Empresa, empresa_id, "Empresa no encontrada.")
    verificar_empresa(empresa, empresa_id, "Empresa no encontrada.")

    return {
        "empresaId": empresa_id,
        "nombreEmpresa": empresa.nombre,
        "totalUsuarios": crud_base.contar(db, Usuario, filtros=[Usuario.empresa_id == empresa_id]),
        "totalMecanicos": crud_base.contar(db, Mecanico, filtros=[Mecanico.empresa_id == empresa_id]),
        "totalOrdenes": crud_base.contar(db, OrdenTrabajo, filtros=[OrdenTrabajo.empresa_id == empresa_id]),
        "totalFacturas": crud_base.contar(db, Factura, filtros=[Factura.empresa_id == empresa_id]),
    }
