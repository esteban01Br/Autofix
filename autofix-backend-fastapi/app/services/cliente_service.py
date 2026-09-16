"""Lógica de negocio de Cliente."""

from fastapi import HTTPException

from app.crud import cliente as crud_cliente
from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.cliente import Cliente
from app.models.usuario import Usuario
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from app.schemas.vehiculo import VehiculoResumen
from app.services import usuario_service
from app.services.base import resolver_orden


def to_response(cliente: Cliente) -> ClienteResponse:
    return ClienteResponse(
        id=cliente.id,
        usuario=usuario_service.to_response(cliente.usuario),
        direccion=cliente.direccion,
        vehiculos=[
            VehiculoResumen(
                id=v.id, placa=v.placa, marca=v.marca, modelo=v.modelo
            )
            for v in cliente.vehiculos
        ],
    )


def crear_cliente(db, payload: ClienteCreate) -> ClienteResponse:
    usuario = crud_base.obtener_o_404(db, Usuario, payload.usuarioId, "Usuario no encontrado.")

    if crud_cliente.exists_usuario(db, usuario.id):
        raise HTTPException(
            status_code=409, detail="Ese usuario ya está registrado como cliente."
        )

    cliente = Cliente(usuario_id=usuario.id, direccion=payload.direccion)
    crud_base.crear(db, cliente)
    return to_response(cliente)


def listar_clientes(
    db,
    *,
    busqueda: str | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[ClienteResponse], int]:
    filtros = crud_cliente.construir_filtros(busqueda=busqueda)
    col, dir_resuelta = resolver_orden(crud_cliente.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    clientes = crud_base.listar(
        db,
        Cliente,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Cliente, filtros=filtros)
    return [to_response(c) for c in clientes], total


def obtener_cliente(db, cliente_id: int) -> ClienteResponse:
    cliente = crud_base.obtener_o_404(db, Cliente, cliente_id, "Cliente no encontrado.")
    return to_response(cliente)


def actualizar_cliente(db, cliente_id: int, payload: ClienteUpdate) -> ClienteResponse:
    cliente = crud_base.obtener_o_404(db, Cliente, cliente_id, "Cliente no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "usuarioId" in datos and datos["usuarioId"] is not None:
        usuario = crud_base.obtener_o_404(
            db, Usuario, datos["usuarioId"], "Usuario no encontrado."
        )
        existente = crud_cliente.get_by_usuario_id(db, usuario.id)
        if existente is not None and existente.id != cliente.id:
            raise HTTPException(
                status_code=409, detail="Ese usuario ya está registrado como cliente."
            )
        cliente.usuario_id = usuario.id

    if "direccion" in datos:
        cliente.direccion = datos["direccion"]

    crud_base.actualizar(db, cliente)
    return to_response(cliente)


def eliminar_cliente(db, cliente_id: int) -> None:
    cliente = crud_base.obtener_o_404(db, Cliente, cliente_id, "Cliente no encontrado.")

    con_ordenes = any(v.ordenes for v in cliente.vehiculos)
    if con_ordenes:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el cliente tiene vehículos con órdenes de trabajo.",
        )

    # El borrado en cascada elimina vehículos y sus citas.
    crud_base.eliminar(db, cliente)