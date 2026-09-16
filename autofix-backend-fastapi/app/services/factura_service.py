"""Lógica de negocio de Factura.

La factura se genera a partir de los detalles de la orden:
subtotal = suma(precio_unitario * cantidad); iva = 19%; total = subtotal + iva.
"""

from datetime import datetime
from decimal import Decimal

from fastapi import HTTPException

from app.crud import factura as crud_factura
from app.crud import base as crud_base
from app.models.factura import Factura
from app.models.orden_trabajo import OrdenTrabajo
from app.schemas.factura import FacturaCreate, FacturaResponse
from app.services.base import resolver_orden

IVA = Decimal("0.19")


def to_response(factura: Factura) -> FacturaResponse:
    orden = factura.orden_trabajo
    cliente_nombre = None
    vehiculo_placa = None
    if orden is not None:
        vehiculo_placa = orden.vehiculo.placa if orden.vehiculo else None
        if orden.vehiculo is not None and orden.vehiculo.cliente is not None:
            usuario = orden.vehiculo.cliente.usuario
            cliente_nombre = f"{usuario.nombre} {usuario.apellido}"

    return FacturaResponse(
        id=factura.id,
        fecha=factura.fecha,
        subtotal=factura.subtotal,
        iva=factura.iva,
        total=factura.total,
        ordenTrabajoId=factura.orden_trabajo_id,
        vehiculoPlaca=vehiculo_placa,
        clienteNombre=cliente_nombre,
    )


def crear_factura(db, payload: FacturaCreate) -> FacturaResponse:
    if crud_factura.exists_orden(db, payload.ordenTrabajoId):
        raise HTTPException(status_code=409, detail="La orden ya tiene una factura.")

    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, payload.ordenTrabajoId, "Orden de trabajo no encontrada."
    )

    subtotal = sum(
        (d.precio_unitario * d.cantidad) for d in orden.detalles
    )
    subtotal = Decimal(subtotal)
    iva = (subtotal * IVA).quantize(Decimal("0.01"))
    total = (subtotal + iva).quantize(Decimal("0.01"))

    factura = Factura(
        orden_trabajo_id=orden.id,
        subtotal=subtotal,
        iva=iva,
        total=total,
    )
    crud_base.crear(db, factura)
    return to_response(factura)


def listar_facturas(
    db,
    *,
    desde=None,
    hasta=None,
    orden_trabajo_id: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[FacturaResponse], int]:
    filtros = crud_factura.construir_filtros(
        desde=desde, hasta=hasta, orden_trabajo_id=orden_trabajo_id
    )
    col, dir_resuelta = resolver_orden(crud_factura.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    facturas = crud_base.listar(
        db,
        Factura,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Factura, filtros=filtros)
    return [to_response(f) for f in facturas], total


def obtener_factura(db, factura_id: int) -> FacturaResponse:
    factura = crud_base.obtener_o_404(db, Factura, factura_id, "Factura no encontrada.")
    return to_response(factura)


def eliminar_factura(db, factura_id: int) -> None:
    factura = crud_base.obtener_o_404(db, Factura, factura_id, "Factura no encontrada.")
    crud_base.eliminar(db, factura)