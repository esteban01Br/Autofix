"""Lógica de negocio de OrdenTrabajo."""

from fastapi import HTTPException

from app.crud import orden_trabajo as crud_orden
from app.crud import base as crud_base
from app.models.enums import EstadoOrden
from app.models.mecanico import Mecanico
from app.models.orden_trabajo import OrdenTrabajo
from app.models.vehiculo import Vehiculo
from app.schemas.mecanico import MecanicoResumen
from app.schemas.orden_trabajo import (
    OrdenTrabajoCreate,
    OrdenTrabajoResponse,
    OrdenTrabajoUpdate,
)
from app.services import detalle_orden_service
from app.services.base import resolver_orden
from app.utils import ahora_utc


def to_response(orden: OrdenTrabajo) -> OrdenTrabajoResponse:
    mecanico_resumen = None
    if orden.mecanico is not None:
        m = orden.mecanico
        mecanico_resumen = MecanicoResumen(
            id=m.id,
            nombreCompleto=(
                f"{m.usuario.nombre} {m.usuario.apellido}" if m.usuario else None
            ),
            especialidad=m.especialidad,
        )

    return OrdenTrabajoResponse(
        id=orden.id,
        fechaIngreso=orden.fecha_ingreso,
        fechaSalida=orden.fecha_salida,
        estado=orden.estado,
        diagnostico=orden.diagnostico,
        observaciones=orden.observaciones,
        mecanico=mecanico_resumen,
        vehiculoId=orden.vehiculo_id,
        vehiculoPlaca=orden.vehiculo.placa if orden.vehiculo else None,
        detalles=[detalle_orden_service.to_response(d) for d in orden.detalles],
        tieneFactura=orden.factura is not None,
    )


def crear_orden(db, payload: OrdenTrabajoCreate) -> OrdenTrabajoResponse:
    crud_base.obtener_o_404(db, Vehiculo, payload.vehiculoId, "Vehículo no encontrado.")

    mecanico_id = payload.mecanicoId
    if mecanico_id is not None:
        crud_base.obtener_o_404(
            db, Mecanico, mecanico_id, "Mecánico no encontrado."
        )

    orden = OrdenTrabajo(
        vehiculo_id=payload.vehiculoId,
        mecanico_id=mecanico_id,
        diagnostico=payload.diagnostico,
        observaciones=payload.observaciones,
        estado=EstadoOrden.RECIBIDO,
    )
    crud_base.crear(db, orden)
    return to_response(orden)


def listar_ordenes(
    db,
    *,
    estado=None,
    vehiculo_id: int | None = None,
    mecanico_id: int | None = None,
    desde=None,
    hasta=None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[OrdenTrabajoResponse], int]:
    filtros = crud_orden.construir_filtros(
        estado=estado,
        vehiculo_id=vehiculo_id,
        mecanico_id=mecanico_id,
        desde=desde,
        hasta=hasta,
    )
    col, dir_resuelta = resolver_orden(crud_orden.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    ordenes = crud_base.listar(
        db,
        OrdenTrabajo,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, OrdenTrabajo, filtros=filtros)
    return [to_response(o) for o in ordenes], total


def obtener_orden(db, orden_id: int) -> OrdenTrabajoResponse:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )
    return to_response(orden)


def actualizar_orden(db, orden_id: int, payload: OrdenTrabajoUpdate) -> OrdenTrabajoResponse:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )

    datos = payload.model_dump(exclude_unset=True)

    if "vehiculoId" in datos:
        crud_base.obtener_o_404(db, Vehiculo, datos["vehiculoId"], "Vehículo no encontrado.")
        orden.vehiculo_id = datos["vehiculoId"]

    if "mecanicoId" in datos:
        if datos["mecanicoId"] is None:
            orden.mecanico_id = None
        else:
            crud_base.obtener_o_404(
                db, Mecanico, datos["mecanicoId"], "Mecánico no encontrado."
            )
            orden.mecanico_id = datos["mecanicoId"]

    for campo in ("diagnostico", "observaciones"):
        if campo in datos:
            setattr(orden, campo, datos[campo])

    crud_base.actualizar(db, orden)
    return to_response(orden)


def cambiar_estado(db, orden_id: int, estado: EstadoOrden) -> OrdenTrabajoResponse:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )
    orden.estado = estado
    # Al entregar se registra la fecha de salida automáticamente.
    if estado == EstadoOrden.ENTREGADO and orden.fecha_salida is None:
        orden.fecha_salida = ahora_utc()
    crud_base.actualizar(db, orden)
    return to_response(orden)


def asignar_mecanico(db, orden_id: int, mecanico_id: int) -> OrdenTrabajoResponse:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )
    crud_base.obtener_o_404(db, Mecanico, mecanico_id, "Mecánico no encontrado.")
    orden.mecanico_id = mecanico_id
    crud_base.actualizar(db, orden)
    return to_response(orden)


def eliminar_orden(db, orden_id: int) -> None:
    orden = crud_base.obtener_o_404(
        db, OrdenTrabajo, orden_id, "Orden de trabajo no encontrada."
    )

    if orden.factura is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: la orden tiene una factura asociada.",
        )

    # Se devuelve el stock de los repuestos usados.
    for detalle in orden.detalles:
        if detalle.repuesto is not None:
            detalle.repuesto.stock += detalle.cantidad

    db.delete(orden)
    db.commit()