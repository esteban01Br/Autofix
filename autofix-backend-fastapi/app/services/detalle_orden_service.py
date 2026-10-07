"""Lógica de negocio de DetalleOrden (líneas de repuestos de una orden).

Reglas de negocio:
- Al agregar un repuesto a una orden se valida el stock y se descuenta.
- Al eliminar un detalle se devuelve el stock.
- El precio unitario se toma del repuesto en el momento de la operación.
"""

from decimal import Decimal

from fastapi import HTTPException

from app.crud import detalle_orden as crud_detalle
from app.crud import base as crud_base
from app.models.detalle_orden import DetalleOrden
from app.models.orden_trabajo import OrdenTrabajo
from app.models.repuesto import Repuesto
from app.schemas.detalle_orden import (
    DetalleOrdenCreate,
    DetalleOrdenResponse,
    DetalleOrdenUpdate,
)
from app.services.base import resolver_orden, verificar_empresa


def to_response(detalle: DetalleOrden) -> DetalleOrdenResponse:
    subtotal_linea = detalle.precio_unitario * detalle.cantidad
    return DetalleOrdenResponse(
        id=detalle.id,
        repuestoId=detalle.repuesto_id,
        repuestoNombre=detalle.repuesto.nombre if detalle.repuesto else None,
        cantidad=detalle.cantidad,
        precioUnitario=detalle.precio_unitario,
        subtotalLinea=subtotal_linea,
    )


def crear_detalle(db, empresa_id: int | None, orden_id: int, payload: DetalleOrdenCreate) -> DetalleOrdenResponse:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )
    verificar_empresa(orden, empresa_id, "Orden de trabajo no encontrada.")
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, payload.repuestoId, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")

    if repuesto.stock < payload.cantidad:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {repuesto.stock}.",
        )

    detalle = DetalleOrden(
        orden_trabajo_id=orden.id,
        repuesto_id=repuesto.id,
        cantidad=payload.cantidad,
        precio_unitario=repuesto.precio,
    )

    repuesto.stock -= payload.cantidad

    db.add(detalle)
    db.commit()
    db.refresh(detalle)
    return to_response(detalle)


def listar_detalles(
    db,
    empresa_id: int | None,
    *,
    orden_id: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[DetalleOrdenResponse], int]:
    filtros = crud_detalle.construir_filtros(orden_id=orden_id)
    if empresa_id is not None:
        # DetalleOrden no tiene empresa_id propio: se filtra por su orden.
        filtros.append(DetalleOrden.orden_trabajo.has(OrdenTrabajo.empresa_id == empresa_id))
    col, dir_resuelta = resolver_orden(crud_detalle.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    detalles = crud_base.listar(
        db,
        DetalleOrden,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, DetalleOrden, filtros=filtros)
    return [to_response(d) for d in detalles], total


def listar_por_orden(db, empresa_id: int | None, orden_id: int) -> list[DetalleOrdenResponse]:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )
    verificar_empresa(orden, empresa_id, "Orden de trabajo no encontrada.")
    return [to_response(d) for d in orden.detalles]


def _obtener_verificado(db, empresa_id: int | None, detalle_id: int) -> DetalleOrden:
    detalle = crud_base.obtener_o_404(
        db, DetalleOrden, detalle_id, "Detalle no encontrado."
    )
    verificar_empresa(detalle.orden_trabajo, empresa_id, "Detalle no encontrado.")
    return detalle


def obtener_detalle(db, empresa_id: int | None, detalle_id: int) -> DetalleOrdenResponse:
    return to_response(_obtener_verificado(db, empresa_id, detalle_id))


def actualizar_detalle(db, empresa_id: int | None, detalle_id: int, payload: DetalleOrdenUpdate) -> DetalleOrdenResponse:
    detalle = _obtener_verificado(db, empresa_id, detalle_id)

    datos = payload.model_dump(exclude_unset=True)

    repuesto_actual = detalle.repuesto
    cantidad_actual = detalle.cantidad
    nuevo_repuesto_id = datos.get("repuestoId", detalle.repuesto_id)
    nueva_cantidad = datos.get("cantidad", detalle.cantidad)

    repuesto_nuevo = crud_base.obtener_o_404(
        db, Repuesto, nuevo_repuesto_id, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto_nuevo, empresa_id, "Repuesto no encontrado.")

    # Efectivo disponible: si es el mismo repuesto, el stock actual ya
    # tiene descontada la cantidad_actual (que aún sigue en la línea).
    if repuesto_actual is not None and repuesto_actual.id == repuesto_nuevo.id:
        disponible = repuesto_nuevo.stock + cantidad_actual
    else:
        disponible = repuesto_nuevo.stock

    if nueva_cantidad > disponible:
        raise HTTPException(
            status_code=400,
            detail=f"Stock insuficiente. Disponible: {disponible}.",
        )

    # Si cambia el repuesto: se devuelve el stock del anterior y
    # se descuenta del nuevo. Si es el mismo, se ajusta la diferencia.
    if repuesto_actual is not None and repuesto_actual.id != repuesto_nuevo.id:
        repuesto_actual.stock += cantidad_actual
        repuesto_nuevo.stock -= nueva_cantidad
    elif repuesto_actual is not None:
        repuesto_nuevo.stock = repuesto_nuevo.stock + cantidad_actual - nueva_cantidad
    else:
        repuesto_nuevo.stock -= nueva_cantidad

    detalle.repuesto_id = repuesto_nuevo.id
    detalle.precio_unitario = repuesto_nuevo.precio
    detalle.cantidad = nueva_cantidad

    crud_base.actualizar(db, detalle)
    return to_response(detalle)


def eliminar_detalle(db, empresa_id: int | None, detalle_id: int) -> None:
    detalle = _obtener_verificado(db, empresa_id, detalle_id)

    # Se devuelve el stock del repuesto al eliminar la línea.
    repuesto = detalle.repuesto
    if repuesto is not None:
        repuesto.stock += detalle.cantidad

    db.delete(detalle)
    db.commit()