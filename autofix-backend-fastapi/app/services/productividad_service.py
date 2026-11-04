"""Resumen de productividad por periodo: diario, semanal, quincenal y mensual.

Solo cuenta la actividad de UNA empresa (aislamiento multiempresa) y se
muestra por empresa, por rol y por empleado. Compara contra el periodo
inmediatamente anterior del mismo tipo.

Las fechas se guardan en UTC (naive); los periodos se calculan con la hora
de Colombia (UTC-5, sin horario de verano). La agregación por día se hace
en Python para que funcione igual en SQLite (pruebas) y PostgreSQL.
"""

from collections import defaultdict
from calendar import monthrange
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import func, select

from app.models.auditoria import Auditoria
from app.models.enums import EstadoOrden, Rol
from app.models.factura import Factura
from app.models.mecanico import Mecanico
from app.models.orden_trabajo import OrdenTrabajo
from app.models.pago import Pago
from app.models.usuario import Usuario

ZONA_LOCAL = timezone(timedelta(hours=-5))  # Colombia
PERIODOS = ("diario", "semanal", "quincenal", "mensual")


def hoy_local() -> date:
    return datetime.now(ZONA_LOCAL).date()


def rango_periodo(periodo: str, fecha: date) -> tuple[date, date]:
    """Primer y último día (inclusive) del periodo que contiene `fecha`."""
    if periodo == "diario":
        return fecha, fecha
    if periodo == "semanal":  # lunes a domingo
        inicio = fecha - timedelta(days=fecha.weekday())
        return inicio, inicio + timedelta(days=6)
    ultimo_dia = monthrange(fecha.year, fecha.month)[1]
    if periodo == "quincenal":  # 1-15 y 16-fin de mes
        if fecha.day <= 15:
            return fecha.replace(day=1), fecha.replace(day=15)
        return fecha.replace(day=16), fecha.replace(day=ultimo_dia)
    if periodo == "mensual":
        return fecha.replace(day=1), fecha.replace(day=ultimo_dia)
    raise ValueError(f"Periodo no válido: {periodo}")


def rango_anterior(periodo: str, desde: date) -> tuple[date, date]:
    """Periodo del mismo tipo inmediatamente anterior al que empieza en `desde`."""
    return rango_periodo(periodo, desde - timedelta(days=1))


def _a_utc(dia: date) -> datetime:
    """Medianoche local de `dia`, expresada como UTC naive."""
    return datetime.combine(dia, time.min) - ZONA_LOCAL.utcoffset(None)


def _dia_local(momento: datetime) -> date:
    return momento.replace(tzinfo=timezone.utc).astimezone(ZONA_LOCAL).date()


def _ventana(desde: date, hasta: date) -> tuple[datetime, datetime]:
    """Ventana [inicio, fin) en UTC naive para consultas."""
    return _a_utc(desde), _a_utc(hasta + timedelta(days=1))


def _variacion(actual: float, anterior: float) -> float | None:
    if not anterior:
        return None
    return round((actual - anterior) / anterior * 100, 1)


def _metricas_empresa(db, empresa_id: int, desde: date, hasta: date) -> dict:
    ini, fin = _ventana(desde, hasta)

    ordenes_creadas = db.scalar(
        select(func.count(OrdenTrabajo.id)).where(
            OrdenTrabajo.empresa_id == empresa_id,
            OrdenTrabajo.fecha_ingreso >= ini,
            OrdenTrabajo.fecha_ingreso < fin,
        )
    )
    ordenes_entregadas = db.scalar(
        select(func.count(OrdenTrabajo.id)).where(
            OrdenTrabajo.empresa_id == empresa_id,
            OrdenTrabajo.estado == EstadoOrden.ENTREGADO,
            OrdenTrabajo.fecha_salida >= ini,
            OrdenTrabajo.fecha_salida < fin,
        )
    )
    facturas, facturado = db.execute(
        select(func.count(Factura.id), func.coalesce(func.sum(Factura.total), 0)).where(
            Factura.empresa_id == empresa_id,
            Factura.fecha >= ini,
            Factura.fecha < fin,
        )
    ).one()
    cobrado = db.scalar(
        select(func.coalesce(func.sum(Pago.monto), 0)).where(
            Pago.empresa_id == empresa_id, Pago.fecha >= ini, Pago.fecha < fin
        )
    )
    acciones = db.scalar(
        select(func.count(Auditoria.id)).where(
            Auditoria.empresa_id == empresa_id,
            Auditoria.fecha >= ini,
            Auditoria.fecha < fin,
        )
    )
    return {
        "ordenesCreadas": int(ordenes_creadas or 0),
        "ordenesEntregadas": int(ordenes_entregadas or 0),
        "facturasEmitidas": int(facturas or 0),
        "totalFacturado": float(facturado or 0),
        "totalCobrado": float(cobrado or 0),
        "acciones": int(acciones or 0),
    }


def _serie_diaria(db, empresa_id: int, desde: date, hasta: date) -> list[dict]:
    """Una fila por día del periodo (incluye días sin actividad) para graficar."""
    ini, fin = _ventana(desde, hasta)
    dias: dict[date, dict] = {}
    dia = desde
    while dia <= hasta:
        dias[dia] = {
            "fecha": dia.isoformat(),
            "ordenesCreadas": 0,
            "ordenesEntregadas": 0,
            "totalFacturado": 0.0,
            "acciones": 0,
        }
        dia += timedelta(days=1)

    for (momento,) in db.execute(
        select(OrdenTrabajo.fecha_ingreso).where(
            OrdenTrabajo.empresa_id == empresa_id,
            OrdenTrabajo.fecha_ingreso >= ini,
            OrdenTrabajo.fecha_ingreso < fin,
        )
    ):
        dias[_dia_local(momento)]["ordenesCreadas"] += 1
    for (momento,) in db.execute(
        select(OrdenTrabajo.fecha_salida).where(
            OrdenTrabajo.empresa_id == empresa_id,
            OrdenTrabajo.estado == EstadoOrden.ENTREGADO,
            OrdenTrabajo.fecha_salida >= ini,
            OrdenTrabajo.fecha_salida < fin,
        )
    ):
        dias[_dia_local(momento)]["ordenesEntregadas"] += 1
    for momento, total in db.execute(
        select(Factura.fecha, Factura.total).where(
            Factura.empresa_id == empresa_id, Factura.fecha >= ini, Factura.fecha < fin
        )
    ):
        dias[_dia_local(momento)]["totalFacturado"] += float(total or 0)
    for (momento,) in db.execute(
        select(Auditoria.fecha).where(
            Auditoria.empresa_id == empresa_id,
            Auditoria.fecha >= ini,
            Auditoria.fecha < fin,
        )
    ):
        dias[_dia_local(momento)]["acciones"] += 1
    return list(dias.values())


def _metricas_por_usuario(db, empresa_id: int, desde: date, hasta: date) -> list[dict]:
    """Actividad de cada empleado (todos los roles excepto CLIENTE)."""
    ini, fin = _ventana(desde, hasta)

    acciones: dict[int, dict[str, int]] = defaultdict(dict)
    for usuario_id, accion, cantidad in db.execute(
        select(Auditoria.usuario_id, Auditoria.accion, func.count(Auditoria.id))
        .where(
            Auditoria.empresa_id == empresa_id,
            Auditoria.usuario_id.isnot(None),
            Auditoria.fecha >= ini,
            Auditoria.fecha < fin,
        )
        .group_by(Auditoria.usuario_id, Auditoria.accion)
    ):
        acciones[usuario_id][accion] = int(cantidad)

    entregadas: dict[int, int] = {
        usuario_id: int(cantidad)
        for usuario_id, cantidad in db.execute(
            select(Mecanico.usuario_id, func.count(OrdenTrabajo.id))
            .join(OrdenTrabajo, OrdenTrabajo.mecanico_id == Mecanico.id)
            .where(
                OrdenTrabajo.empresa_id == empresa_id,
                OrdenTrabajo.estado == EstadoOrden.ENTREGADO,
                OrdenTrabajo.fecha_salida >= ini,
                OrdenTrabajo.fecha_salida < fin,
            )
            .group_by(Mecanico.usuario_id)
        )
    }

    cobros: dict[int, tuple[int, float]] = {
        usuario_id: (int(cantidad), float(total or 0))
        for usuario_id, cantidad, total in db.execute(
            select(Pago.usuario_id, func.count(Pago.id), func.sum(Pago.monto))
            .where(
                Pago.empresa_id == empresa_id,
                Pago.usuario_id.isnot(None),
                Pago.fecha >= ini,
                Pago.fecha < fin,
            )
            .group_by(Pago.usuario_id)
        )
    }

    empleados = db.scalars(
        select(Usuario)
        .where(
            Usuario.empresa_id == empresa_id,
            Usuario.activo.is_(True),
            Usuario.rol != Rol.CLIENTE,
        )
        .order_by(Usuario.nombre, Usuario.apellido)
    ).all()

    filas = []
    for u in empleados:
        detalle = acciones.get(u.id, {})
        pagos, cobrado = cobros.get(u.id, (0, 0.0))
        filas.append(
            {
                "usuarioId": u.id,
                "nombre": f"{u.nombre} {u.apellido}",
                "rol": u.rol.value,
                "acciones": sum(detalle.values()),
                "detalleAcciones": detalle,
                "ordenesEntregadas": entregadas.get(u.id, 0),
                "pagosRegistrados": pagos,
                "totalCobrado": cobrado,
            }
        )
    return filas


def _metricas_por_rol(usuarios: list[dict]) -> list[dict]:
    roles: dict[str, dict] = {}
    for u in usuarios:
        fila = roles.setdefault(
            u["rol"],
            {
                "rol": u["rol"],
                "empleados": 0,
                "acciones": 0,
                "ordenesEntregadas": 0,
                "pagosRegistrados": 0,
                "totalCobrado": 0.0,
            },
        )
        fila["empleados"] += 1
        fila["acciones"] += u["acciones"]
        fila["ordenesEntregadas"] += u["ordenesEntregadas"]
        fila["pagosRegistrados"] += u["pagosRegistrados"]
        fila["totalCobrado"] += u["totalCobrado"]
    for fila in roles.values():
        fila["accionesPorEmpleado"] = round(fila["acciones"] / fila["empleados"], 1)
    return sorted(roles.values(), key=lambda f: f["acciones"], reverse=True)


def resumen_periodo(db, empresa_id: int, periodo: str, fecha: date) -> dict:
    desde, hasta = rango_periodo(periodo, fecha)
    ant_desde, ant_hasta = rango_anterior(periodo, desde)

    actual = _metricas_empresa(db, empresa_id, desde, hasta)
    anterior = _metricas_empresa(db, empresa_id, ant_desde, ant_hasta)
    usuarios = _metricas_por_usuario(db, empresa_id, desde, hasta)

    return {
        "periodo": periodo,
        "desde": desde.isoformat(),
        "hasta": hasta.isoformat(),
        "anterior": {"desde": ant_desde.isoformat(), "hasta": ant_hasta.isoformat()},
        "empresa": {
            "actual": actual,
            "anterior": anterior,
            "variacionPct": {
                clave: _variacion(actual[clave], anterior[clave]) for clave in actual
            },
        },
        "roles": _metricas_por_rol(usuarios),
        "usuarios": usuarios,
        "serie": _serie_diaria(db, empresa_id, desde, hasta),
    }