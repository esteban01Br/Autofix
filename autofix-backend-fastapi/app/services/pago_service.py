"""Lógica de negocio de Pago (abonos y pagos de facturas).

Un abono parcial marca la factura como PARCIAL; cuando el acumulado
alcanza el total queda PAGADA. No se admiten pagos que superen el saldo.
"""

from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select

from app.crud import base as crud_base
from app.models.enums import EstadoPagoFactura
from app.models.factura import Factura
from app.models.pago import Pago
from app.models.usuario import Usuario
from app.schemas.pago import PagoCreate, PagoResponse
from app.services.base import verificar_empresa


def to_response(pago: Pago) -> PagoResponse:
    nombre = None
    if pago.usuario is not None:
        nombre = f"{pago.usuario.nombre} {pago.usuario.apellido}"
    return PagoResponse(
        id=pago.id,
        facturaId=pago.factura_id,
        monto=pago.monto,
        metodo=pago.metodo,
        fecha=pago.fecha,
        usuarioNombre=nombre,
    )


def _factura_segura(db, empresa_id: int | None, factura_id: int) -> Factura:
    factura = crud_base.obtener_o_404(
        db, Factura, factura_id, "Factura no encontrada."
    )
    verificar_empresa(factura, empresa_id, "Factura no encontrada.")
    return factura


def registrar_pago(
    db,
    empresa_id: int | None,
    usuario: Usuario,
    factura_id: int,
    payload: PagoCreate,
) -> PagoResponse:
    """Registra un abono/pago y actualiza el estado de la factura."""
    factura = _factura_segura(db, empresa_id, factura_id)

    pagado = Decimal(factura.monto_pagado or 0)
    saldo = (Decimal(factura.total) - pagado).quantize(Decimal("0.01"))
    monto = Decimal(payload.monto).quantize(Decimal("0.01"))

    if monto > saldo:
        raise HTTPException(
            status_code=409,
            detail=f"El pago ({monto}) excede el saldo pendiente ({saldo}).",
        )

    pago = Pago(
        factura_id=factura.id,
        empresa_id=factura.empresa_id,
        usuario_id=usuario.id,
        monto=monto,
        metodo=payload.metodo,
    )
    crud_base.crear(db, pago)

    nuevo_pagado = pagado + monto
    factura.monto_pagado = nuevo_pagado
    if nuevo_pagado >= Decimal(factura.total):
        factura.estado_pago = EstadoPagoFactura.PAGADA
    else:
        factura.estado_pago = EstadoPagoFactura.PARCIAL
    crud_base.actualizar(db, factura)

    return to_response(pago)


def listar_pagos(
    db, empresa_id: int | None, factura_id: int
) -> list[PagoResponse]:
    """Historial de pagos de una factura (verifica aislamiento antes)."""
    factura = _factura_segura(db, empresa_id, factura_id)
    pagos = db.scalars(
        select(Pago)
        .where(Pago.factura_id == factura.id)
        .order_by(Pago.fecha.desc())
    ).all()
    return [to_response(p) for p in pagos]
