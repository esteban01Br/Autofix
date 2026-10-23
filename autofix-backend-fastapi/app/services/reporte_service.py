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
from app.utils import ahora_utc


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
    # PostgreSQL exige agrupar también las columnas de usuarios seleccionadas.
    stmt = stmt.group_by(Mecanico.id, Usuario.nombre, Usuario.apellido).order_by(
        func.count(OrdenTrabajo.id).desc()
    )

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


def ventas_mensuales(
    db,
    empresa_id: int | None,
    *,
    meses: int = 12,
) -> list[dict]:
    """Facturación de los últimos N meses (meses completos, incluido el actual).

    Devuelve una fila por mes (incluidos los meses sin facturas, con total 0),
    para poder dibujar una gráfica continua. La agregación se hace en Python
    para que funcione igual en SQLite (pruebas) y PostgreSQL (producción).
    """
    meses = max(1, min(meses, 24))
    ahora = ahora_utc()
    # Primer día del primer mes del rango.
    anioInicio = ahora.year
    mesInicio = ahora.month - (meses - 1)
    while mesInicio < 1:
        mesInicio += 12
        anioInicio -= 1
    desde = datetime(anioInicio, mesInicio, 1)

    stmt = select(Factura.fecha, Factura.total).where(Factura.fecha >= desde)
    if empresa_id is not None:
        stmt = stmt.where(Factura.empresa_id == empresa_id)

    acumulado: dict[tuple[int, int], dict] = {}
    for fecha, total in db.execute(stmt).all():
        clave = (fecha.year, fecha.month)
        fila = acumulado.setdefault(clave, {"facturas": 0, "total": Decimal("0")})
        fila["facturas"] += 1
        fila["total"] += Decimal(total or 0)

    resultado: list[dict] = []
    anio, mes = anioInicio, mesInicio
    for _ in range(meses):
        datos = acumulado.get((anio, mes), {"facturas": 0, "total": Decimal("0")})
        resultado.append(
            {
                "mes": f"{anio:04d}-{mes:02d}",
                "facturas": datos["facturas"],
                "total": float(datos["total"]),
            }
        )
        mes += 1
        if mes > 12:
            mes = 1
            anio += 1
    return resultado


def resumen_empresa(db, empresa_id: int | None) -> dict:
    """Resumen general de una empresa: conteos de entidades.

    La búsqueda ya es por el id de la empresa del usuario, así que
    obtener_o_404 garantiza la pertenencia (no aplica verificar_empresa:
    el modelo Empresa no tiene columna empresa_id).
    """
    if empresa_id is None:
        return {}

    empresa = crud_base.obtener_o_404(db, Empresa, empresa_id, "Empresa no encontrada.")

    return {
        "empresaId": empresa_id,
        "nombreEmpresa": empresa.nombre,
        "totalUsuarios": crud_base.contar(db, Usuario, filtros=[Usuario.empresa_id == empresa_id]),
        "totalMecanicos": crud_base.contar(db, Mecanico, filtros=[Mecanico.empresa_id == empresa_id]),
        "totalOrdenes": crud_base.contar(db, OrdenTrabajo, filtros=[OrdenTrabajo.empresa_id == empresa_id]),
        "totalFacturas": crud_base.contar(db, Factura, filtros=[Factura.empresa_id == empresa_id]),
    }
