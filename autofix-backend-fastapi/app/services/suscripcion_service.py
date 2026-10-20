"""Lógica de negocio de Suscripción (planes y acceso al SaaS).

La compra es SIMULADA por ahora (sin pasarela real): al registrar una
empresa se crea su suscripción con 12 meses de vigencia. El login se
bloquea (403) cuando la suscripción de la empresa está vencida.
"""

from datetime import timedelta, timezone
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select

from app.crud import base as crud_base
from app.models.enums import EstadoSuscripcion, PlanSuscripcion, Rol
from app.models.suscripcion import Suscripcion
from app.models.usuario import Usuario
from app.schemas.suscripcion import PlanInfo, SuscripcionResponse
from app.utils import ahora_utc

# Catálogo publicado en el portal de ventas (precios en COP).
PLANES: list[dict] = [
    {
        "id": PlanSuscripcion.BASICO,
        "nombre": "Básico",
        "precioMensual": 99000,
        "precioAnual": 1188000,
        "destacado": False,
        "caracteristicas": [
            "Panel de control y agenda de citas",
            "Clientes, vehículos y órdenes de trabajo",
            "Facturación y control de pagos",
            "Inventario de repuestos",
            "1 sucursal",
        ],
    },
    {
        "id": PlanSuscripcion.PRO,
        "nombre": "Profesional",
        "precioMensual": 179000,
        "precioAnual": 2148000,
        "destacado": True,
        "caracteristicas": [
            "Todo lo del plan Básico",
            "Usuarios y roles ilimitados",
            "Varias sucursales",
            "Reportes y productividad del taller",
            "Cotizaciones y alertas de stock",
            "Soporte prioritario",
        ],
    },
    {
        "id": PlanSuscripcion.PREMIUM,
        "nombre": "Premium",
        "precioMensual": 299000,
        "precioAnual": 3588000,
        "destacado": False,
        "caracteristicas": [
            "Todo lo del plan Profesional",
            "Catálogo de servicios y mano de obra",
            "Fotos del vehículo y proveedores",
            "API e integraciones",
            "Acompañamiento dedicado",
        ],
    },
]

DIAS_POR_DEFECTO = 365  # La compra simulada contrata 12 meses.


def _info_de_plan(plan: PlanSuscripcion) -> dict:
    return next(p for p in PLANES if p["id"] == plan)


def listar_planes() -> list[PlanInfo]:
    return [PlanInfo(**p) for p in PLANES]


def obtener(db, empresa_id: int | None) -> Suscripcion | None:
    """Última suscripción de la empresa (una sola por empresa)."""
    if empresa_id is None:
        return None
    stmt = (
        select(Suscripcion)
        .where(Suscripcion.empresa_id == empresa_id)
        .order_by(Suscripcion.id.desc())
        .limit(1)
    )
    return db.scalars(stmt).first()


def es_vigente(suscripcion: Suscripcion) -> bool:
    return (
        suscripcion.estado == EstadoSuscripcion.ACTIVA
        and suscripcion.fecha_fin > ahora_utc()
    )


def _naive_utc(fecha):
    """Normaliza una fecha opcional a 'naive' UTC (formato de las columnas)."""
    if fecha.tzinfo is None:
        return fecha
    return fecha.astimezone(timezone.utc).replace(tzinfo=None)


def aplicar(
    db,
    empresa_id: int,
    *,
    plan: PlanSuscripcion = PlanSuscripcion.BASICO,
    dias: int = DIAS_POR_DEFECTO,
    fecha_fin=None,
    estado: EstadoSuscripcion = EstadoSuscripcion.ACTIVA,
) -> Suscripcion:
    """Crea o actualiza la suscripción de la empresa (sin commit).

    El commit lo hace el caller (permite usarlo dentro del registro de
    empresa, que hace un único commit al final).
    """
    info = _info_de_plan(plan)
    fin = _naive_utc(fecha_fin) if fecha_fin else ahora_utc() + timedelta(days=dias)

    suscripcion = obtener(db, empresa_id)
    if suscripcion is None:
        suscripcion = Suscripcion(
            empresa_id=empresa_id,
            plan=plan,
            estado=estado,
            fecha_inicio=ahora_utc(),
            fecha_fin=fin,
            monto=Decimal(info["precioAnual"]),
        )
        db.add(suscripcion)
    else:
        suscripcion.plan = plan
        suscripcion.estado = estado
        suscripcion.fecha_inicio = ahora_utc()
        suscripcion.fecha_fin = fin
        suscripcion.monto = Decimal(info["precioAnual"])
    db.flush()
    return suscripcion


def renovar(db, empresa_id: int, dias: int = DIAS_POR_DEFECTO) -> SuscripcionResponse:
    """Renueva (o crea) la suscripción: extiende desde la fecha vigente o desde hoy."""
    suscripcion = obtener(db, empresa_id)
    if suscripcion is None:
        suscripcion = aplicar(db, empresa_id, dias=dias)
    else:
        base = suscripcion.fecha_fin if es_vigente(suscripcion) else ahora_utc()
        suscripcion.fecha_fin = base + timedelta(days=dias)
        suscripcion.estado = EstadoSuscripcion.ACTIVA
        db.flush()
    crud_base.actualizar(db, suscripcion)
    return to_response(suscripcion)


def verificar_acceso(db, usuario: Usuario) -> None:
    """Bloquea el login si la suscripción de la empresa está vencida (403)."""
    if usuario.empresa_id is None or usuario.rol == Rol.SUPERADMIN:
        return

    suscripcion = obtener(db, usuario.empresa_id)
    if suscripcion is None:
        return  # Empresas legadas sin registro: sin bloqueo (la migración las completa).

    if not es_vigente(suscripcion):
        raise HTTPException(
            status_code=403,
            detail={
                "codigo": "SUSCRIPCION_VENCIDA",
                "mensaje": (
                    "La suscripción de tu empresa está vencida. "
                    "Renueva desde el portal o contacta a soporte."
                ),
            },
        )


def to_response(suscripcion: Suscripcion) -> SuscripcionResponse:
    restantes = int(
        max(0, (suscripcion.fecha_fin - ahora_utc()).total_seconds()) // 86400
    )
    return SuscripcionResponse(
        id=suscripcion.id,
        empresaId=suscripcion.empresa_id,
        plan=suscripcion.plan,
        estado=suscripcion.estado,
        fechaInicio=suscripcion.fecha_inicio,
        fechaFin=suscripcion.fecha_fin,
        monto=suscripcion.monto,
        vigente=es_vigente(suscripcion),
        diasRestantes=restantes,
    )
