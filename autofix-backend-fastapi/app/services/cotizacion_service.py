"""Lógica de negocio de Cotizacion.

La cotización es una propuesta de precio previa a la orden de trabajo:
- Las líneas pueden ser repuestos, servicios o conceptos libres.
- NO descuenta stock al crearse (solo la orden lo hace).
- Al aprobarse se convierte en una OrdenTrabajo, cuyos detalles de
  repuestos sí descuentan stock (con validación de disponibilidad).
- El consecutivo COT-0001 es por empresa.
"""

from datetime import timedelta
from decimal import Decimal

from fastapi import HTTPException
from sqlalchemy import select

from app.crud import base as crud_base
from app.crud import cotizacion as crud_cotizacion
from app.models.cliente import Cliente
from app.models.cotizacion import Cotizacion
from app.models.detalle_cotizacion import DetalleCotizacion
from app.models.empresa import Empresa
from app.models.enums import EstadoCotizacion, EstadoOrden
from app.models.orden_trabajo import OrdenTrabajo
from app.models.repuesto import Repuesto
from app.models.servicio import Servicio
from app.models.vehiculo import Vehiculo
from app.schemas.cotizacion import (
    CotizacionCreate,
    CotizacionResponse,
    CotizacionUpdate,
    DetalleCotizacionResponse,
)
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa
from app.utils import ahora_utc

IVA_POR_DEFECTO = Decimal("19.00")

# Transiciones de estado permitidas.
TRANSICIONES: dict[EstadoCotizacion, set[EstadoCotizacion]] = {
    EstadoCotizacion.BORRADOR: {EstadoCotizacion.ENVIADA},
    EstadoCotizacion.ENVIADA: {
        EstadoCotizacion.APROBADA,
        EstadoCotizacion.RECHAZADA,
        EstadoCotizacion.VENCIDA,
    },
    # Estados finales: no se transiciona desde ellos.
    EstadoCotizacion.APROBADA: set(),
    EstadoCotizacion.RECHAZADA: set(),
    EstadoCotizacion.VENCIDA: set(),
}


def _descripcion_linea(detalle: DetalleCotizacion) -> str:
    if detalle.repuesto is not None:
        return detalle.repuesto.nombre
    if detalle.servicio is not None:
        return detalle.servicio.nombre
    return detalle.concepto or ""


def to_response(cot: Cotizacion) -> CotizacionResponse:
    cliente_nombre = None
    if cot.cliente is not None and cot.cliente.usuario is not None:
        cliente_nombre = f"{cot.cliente.usuario.nombre} {cot.cliente.usuario.apellido}"

    lineas = []
    for d in cot.detalles:
        lineas.append(
            DetalleCotizacionResponse(
                id=d.id,
                repuestoId=d.repuesto_id,
                servicioId=d.servicio_id,
                concepto=d.concepto,
                descripcion=_descripcion_linea(d),
                cantidad=d.cantidad,
                precioUnitario=d.precio_unitario,
                subtotalLinea=d.precio_unitario * d.cantidad,
            )
        )

    return CotizacionResponse(
        id=cot.id,
        numero=cot.numero,
        fecha=cot.fecha,
        validezDias=cot.validez_dias,
        estado=cot.estado,
        observaciones=cot.observaciones,
        subtotal=cot.subtotal,
        iva=cot.iva,
        total=cot.total,
        vehiculoId=cot.vehiculo_id,
        vehiculoPlaca=cot.vehiculo.placa if cot.vehiculo else None,
        clienteId=cot.cliente_id,
        clienteNombre=cliente_nombre,
        detalles=lineas,
        ordenTrabajoId=cot.orden_trabajo_id,
    )


def _siguiente_numero(db, empresa_id: int) -> str:
    """Genera el consecutivo COT-0001... de la empresa (con bloqueo de fila)."""
    empresa = db.scalar(
        select(Empresa).where(Empresa.id == empresa_id).with_for_update()
    )
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")
    empresa.consecutivo_cotizacion += 1
    return f"COT-{empresa.consecutivo_cotizacion:04d}"


def _iva_empresa(db, empresa_id: int) -> Decimal:
    empresa = db.get(Empresa, empresa_id)
    return empresa.iva_porcentaje if empresa is not None else IVA_POR_DEFECTO


def _resolver_precio_linea(db, empresa_id: int | None, linea) -> tuple[int | None, int | None, str | None, Decimal]:
    """Valida la línea y devuelve (repuesto_id, servicio_id, concepto, precio).

    El precio se toma del repuesto o del servicio del catálogo; las
    líneas de concepto libre llevan el precio indicado en el payload.
    """
    if linea.repuestoId is not None:
        repuesto = crud_base.obtener_o_404(
            db, Repuesto, linea.repuestoId, "Repuesto no encontrado."
        )
        verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")
        return repuesto.id, None, None, repuesto.precio

    if linea.servicioId is not None:
        servicio = crud_base.obtener_o_404(
            db, Servicio, linea.servicioId, "Servicio no encontrado."
        )
        verificar_empresa(servicio, empresa_id, "Servicio no encontrado.")
        return None, servicio.id, None, servicio.precio

    # Concepto libre (validado por el esquema: requiere precioUnitario).
    return None, None, linea.concepto, Decimal(linea.precioUnitario)


def _crear_detalles(db, cotizacion: Cotizacion, empresa_id: int | None, lineas) -> None:
    for linea in lineas:
        repuesto_id, servicio_id, concepto, precio = _resolver_precio_linea(
            db, empresa_id, linea
        )
        db.add(
            DetalleCotizacion(
                cotizacion_id=cotizacion.id,
                repuesto_id=repuesto_id,
                servicio_id=servicio_id,
                concepto=concepto,
                cantidad=linea.cantidad,
                precio_unitario=precio,
            )
        )


def _recalcular_totales(db, cotizacion: Cotizacion, empresa_id: int) -> None:
    db.flush()
    db.refresh(cotizacion)
    subtotal = sum((d.precio_unitario * d.cantidad) for d in cotizacion.detalles)
    subtotal = Decimal(subtotal)
    iva = (subtotal * _iva_empresa(db, empresa_id) / Decimal("100")).quantize(
        Decimal("0.01")
    )
    cotizacion.subtotal = subtotal
    cotizacion.iva = iva
    cotizacion.total = (subtotal + iva).quantize(Decimal("0.01"))


def _validar_destinos(db, empresa_id: int | None, vehiculo_id, cliente_id) -> None:
    if vehiculo_id is not None:
        vehiculo = crud_base.obtener_o_404(
            db, Vehiculo, vehiculo_id, "Vehículo no encontrado."
        )
        verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")
    if cliente_id is not None:
        cliente = crud_base.obtener_o_404(
            db, Cliente, cliente_id, "Cliente no encontrado."
        )
        verificar_empresa(cliente, empresa_id, "Cliente no encontrado.")


def crear_cotizacion(db, empresa_id: int, payload: CotizacionCreate) -> CotizacionResponse:
    _validar_destinos(db, empresa_id, payload.vehiculoId, payload.clienteId)

    cotizacion = Cotizacion(
        numero=_siguiente_numero(db, empresa_id),
        vehiculo_id=payload.vehiculoId,
        cliente_id=payload.clienteId,
        observaciones=payload.observaciones,
        validez_dias=payload.validezDias,
        estado=EstadoCotizacion.BORRADOR,
        empresa_id=empresa_id,
    )
    db.add(cotizacion)
    db.flush()

    _crear_detalles(db, cotizacion, empresa_id, payload.detalles)
    _recalcular_totales(db, cotizacion, empresa_id)
    db.commit()
    db.refresh(cotizacion)
    return to_response(cotizacion)


def listar_cotizaciones(
    db,
    empresa_id: int | None,
    *,
    estado=None,
    vehiculo_id: int | None = None,
    cliente_id: int | None = None,
    desde=None,
    hasta=None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[CotizacionResponse], int]:
    filtros = filtro_empresa(Cotizacion, empresa_id) + crud_cotizacion.construir_filtros(
        estado=estado,
        vehiculo_id=vehiculo_id,
        cliente_id=cliente_id,
        desde=desde,
        hasta=hasta,
    )
    col, dir_resuelta = resolver_orden(crud_cotizacion.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    cotizaciones = crud_base.listar(
        db,
        Cotizacion,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Cotizacion, filtros=filtros)
    return [to_response(c) for c in cotizaciones], total


def obtener_cotizacion(db, empresa_id: int | None, cotizacion_id: int) -> CotizacionResponse:
    cot = crud_base.obtener_o_404(
        db, Cotizacion, cotizacion_id, "Cotización no encontrada."
    )
    verificar_empresa(cot, empresa_id, "Cotización no encontrada.")
    return to_response(cot)


def actualizar_cotizacion(
    db, empresa_id: int | None, cotizacion_id: int, payload: CotizacionUpdate
) -> CotizacionResponse:
    cot = crud_base.obtener_o_404(
        db, Cotizacion, cotizacion_id, "Cotización no encontrada."
    )
    verificar_empresa(cot, empresa_id, "Cotización no encontrada.")

    if cot.estado != EstadoCotizacion.BORRADOR:
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden editar cotizaciones en BORRADOR.",
        )

    datos = payload.model_dump(exclude_unset=True)

    if "vehiculoId" in datos or "clienteId" in datos:
        _validar_destinos(
            db,
            empresa_id,
            datos.get("vehiculoId", cot.vehiculo_id),
            datos.get("clienteId", cot.cliente_id),
        )
    if "vehiculoId" in datos:
        cot.vehiculo_id = datos["vehiculoId"]
    if "clienteId" in datos:
        cot.cliente_id = datos["clienteId"]
    for campo in ("observaciones", "validezDias"):
        if campo in datos:
            setattr(cot, campo, datos[campo])

    if datos.get("detalles") is not None:
        # Se reemplazan todas las líneas (una cotización en borrador es
        # barata de recalcular y evita parcialidades complejas).
        for detalle in list(cot.detalles):
            db.delete(detalle)
        db.flush()
        _crear_detalles(db, cot, empresa_id, payload.detalles)
        _recalcular_totales(db, cot, empresa_id if empresa_id is not None else cot.empresa_id)

    db.commit()
    db.refresh(cot)
    return to_response(cot)


def cambiar_estado(
    db, empresa_id: int | None, cotizacion_id: int, nuevo: EstadoCotizacion
) -> CotizacionResponse:
    cot = crud_base.obtener_o_404(
        db, Cotizacion, cotizacion_id, "Cotización no encontrada."
    )
    verificar_empresa(cot, empresa_id, "Cotización no encontrada.")

    if nuevo not in TRANSICIONES[cot.estado]:
        raise HTTPException(
            status_code=409,
            detail=f"No se puede pasar de {cot.estado.value} a {nuevo.value}.",
        )

    cot.estado = nuevo
    crud_base.actualizar(db, cot)
    return to_response(cot)


def convertir_a_orden(
    db, empresa_id: int | None, cotizacion_id: int
) -> OrdenTrabajo:
    """Convierte una cotización APROBADA en OrdenTrabajo.

    Los repuestos pasan a ser detalles de la orden (y descuentan stock
    con validación de disponibilidad). Los servicios y conceptos libres
    se agregan como texto en las observaciones de la orden, para no
    perder la información de la propuesta.
    """
    cot = crud_base.obtener_o_404(
        db, Cotizacion, cotizacion_id, "Cotización no encontrada."
    )
    verificar_empresa(cot, empresa_id, "Cotización no encontrada.")

    if cot.estado != EstadoCotizacion.APROBADA:
        raise HTTPException(
            status_code=409,
            detail="Solo se puede convertir una cotización APROBADA.",
        )
    if cot.orden_trabajo_id is not None:
        raise HTTPException(
            status_code=409,
            detail="La cotización ya fue convertida en una orden.",
        )

    # Validar stock de repuestos antes de crear la orden.
    lineas_repuesto = [d for d in cot.detalles if d.repuesto_id is not None]
    for linea in lineas_repuesto:
        if linea.repuesto.stock < linea.cantidad:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Stock insuficiente de {linea.repuesto.nombre}."
                    f" Disponible: {linea.repuesto.stock}."
                ),
            )

    empresa_id_real = cot.empresa_id
    orden = OrdenTrabajo(
        vehiculo_id=cot.vehiculo_id,
        estado=EstadoOrden.RECIBIDO,
        diagnostico=f"Trabajo generado desde la cotización {cot.numero}.",
        observaciones=_observaciones_desde_cotizacion(cot),
        empresa_id=empresa_id_real,
    )
    db.add(orden)
    db.flush()

    # Detalles de la orden: solo repuestos (descuentan stock).
    from app.models.detalle_orden import DetalleOrden

    for linea in lineas_repuesto:
        db.add(
            DetalleOrden(
                orden_trabajo_id=orden.id,
                repuesto_id=linea.repuesto_id,
                cantidad=linea.cantidad,
                precio_unitario=linea.repuesto.precio,
            )
        )
        linea.repuesto.stock -= linea.cantidad

    cot.orden_trabajo_id = orden.id
    db.commit()
    db.refresh(orden)
    return orden


def _observaciones_desde_cotizacion(cot: Cotizacion) -> str | None:
    """Texto con los servicios/conceptos de la cotización para la orden."""
    partes: list[str] = []
    if cot.observaciones:
        partes.append(cot.observaciones)
    for d in cot.detalles:
        if d.repuesto_id is None:
            partes.append(f"{_descripcion_linea(d)} (x{d.cantidad})")
    if not partes:
        return None
    return "Cotización incluye:\n" + "\n".join(partes)


def eliminar_cotizacion(db, empresa_id: int | None, cotizacion_id: int) -> None:
    cot = crud_base.obtener_o_404(
        db, Cotizacion, cotizacion_id, "Cotización no encontrada."
    )
    verificar_empresa(cot, empresa_id, "Cotización no encontrada.")

    if cot.estado not in (EstadoCotizacion.BORRADOR, EstadoCotizacion.RECHAZADA):
        raise HTTPException(
            status_code=409,
            detail="Solo se pueden eliminar cotizaciones en BORRADOR o RECHAZADA.",
        )
    if cot.orden_trabajo_id is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: la cotización ya tiene una orden asociada.",
        )

    db.delete(cot)
    db.commit()
