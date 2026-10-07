"""Lógica de negocio de Cita."""

from app.crud import cita as crud_cita
from app.crud import base as crud_base
from app.models.cita import Cita
from app.models.vehiculo import Vehiculo
from app.schemas.cita import CitaCreate, CitaResponse, CitaUpdate
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa


def to_response(cita: Cita) -> CitaResponse:
    vehiculo = cita.vehiculo
    cliente_nombre = None
    if vehiculo is not None and vehiculo.cliente is not None:
        usuario = vehiculo.cliente.usuario
        cliente_nombre = f"{usuario.nombre} {usuario.apellido}"
    return CitaResponse(
        id=cita.id,
        fecha=cita.fecha,
        hora=cita.hora,
        estado=cita.estado,
        descripcion=cita.descripcion,
        vehiculoId=cita.vehiculo_id,
        vehiculoPlaca=vehiculo.placa if vehiculo else None,
        clienteNombre=cliente_nombre,
    )


def crear_cita(db, empresa_id: int, payload: CitaCreate) -> CitaResponse:
    vehiculo = crud_base.obtener_o_404(db, Vehiculo, payload.vehiculoId, "Vehículo no encontrado.")
    verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")

    cita = Cita(
        fecha=payload.fecha,
        hora=payload.hora,
        descripcion=payload.descripcion,
        vehiculo_id=payload.vehiculoId,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, cita)
    return to_response(cita)


def listar_citas(
    db,
    empresa_id: int | None,
    *,
    estado=None,
    desde=None,
    hasta=None,
    vehiculo_id: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[CitaResponse], int]:
    filtros = filtro_empresa(Cita, empresa_id) + crud_cita.construir_filtros(
        estado=estado, desde=desde, hasta=hasta, vehiculo_id=vehiculo_id
    )
    col, dir_resuelta = resolver_orden(crud_cita.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    citas = crud_base.listar(
        db,
        Cita,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Cita, filtros=filtros)
    return [to_response(c) for c in citas], total


def obtener_cita(db, empresa_id: int | None, cita_id: int) -> CitaResponse:
    cita = crud_base.obtener_o_404(db, Cita, cita_id, "Cita no encontrada.")
    verificar_empresa(cita, empresa_id, "Cita no encontrada.")
    return to_response(cita)


def actualizar_cita(db, empresa_id: int | None, cita_id: int, payload: CitaUpdate) -> CitaResponse:
    cita = crud_base.obtener_o_404(db, Cita, cita_id, "Cita no encontrada.")
    verificar_empresa(cita, empresa_id, "Cita no encontrada.")

    datos = payload.model_dump(exclude_unset=True)

    if "vehiculoId" in datos and datos["vehiculoId"] is not None:
        vehiculo = crud_base.obtener_o_404(db, Vehiculo, datos["vehiculoId"], "Vehículo no encontrado.")
        verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")
        cita.vehiculo_id = datos["vehiculoId"]

    for campo in ("fecha", "hora", "descripcion"):
        if campo in datos:
            setattr(cita, campo, datos[campo])

    crud_base.actualizar(db, cita)
    return to_response(cita)


def cambiar_estado(db, empresa_id: int | None, cita_id: int, estado) -> CitaResponse:
    cita = crud_base.obtener_o_404(db, Cita, cita_id, "Cita no encontrada.")
    verificar_empresa(cita, empresa_id, "Cita no encontrada.")
    cita.estado = estado
    crud_base.actualizar(db, cita)
    return to_response(cita)


def eliminar_cita(db, empresa_id: int | None, cita_id: int) -> None:
    cita = crud_base.obtener_o_404(db, Cita, cita_id, "Cita no encontrada.")
    verificar_empresa(cita, empresa_id, "Cita no encontrada.")
    crud_base.eliminar(db, cita)