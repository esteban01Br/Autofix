"""Lógica de negocio de Vehículo."""

import json

from fastapi import HTTPException

from app.crud import vehiculo as crud_vehiculo
from app.crud import base as crud_base
from app.models.cliente import Cliente
from app.models.vehiculo import Vehiculo
from app.schemas.vehiculo import VehiculoCreate, VehiculoResponse, VehiculoUpdate
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa


def to_response(vehiculo: Vehiculo) -> VehiculoResponse:
    cliente = vehiculo.cliente
    nombre = (
        f"{cliente.usuario.nombre} {cliente.usuario.apellido}"
        if cliente is not None
        else None
    )
    fotos = json.loads(vehiculo.fotos) if vehiculo.fotos else []
    return VehiculoResponse(
        id=vehiculo.id,
        placa=vehiculo.placa,
        marca=vehiculo.marca,
        modelo=vehiculo.modelo,
        anio=vehiculo.anio,
        color=vehiculo.color,
        kilometraje=vehiculo.kilometraje,
        fotos=fotos,
        clienteId=vehiculo.cliente_id,
        clienteNombre=nombre,
    )


def crear_vehiculo(db, empresa_id: int, payload: VehiculoCreate) -> VehiculoResponse:
    placa = payload.placa.strip().upper()
    if crud_vehiculo.exists_placa(db, placa, empresa_id):
        raise HTTPException(status_code=409, detail="La placa ya está registrada.")

    cliente = crud_base.obtener_o_404(db, Cliente, payload.clienteId, "Cliente no encontrado.")
    verificar_empresa(cliente, empresa_id, "Cliente no encontrado.")

    vehiculo = Vehiculo(
        placa=placa,
        marca=payload.marca.strip(),
        modelo=payload.modelo.strip(),
        anio=payload.anio,
        color=payload.color,
        kilometraje=payload.kilometraje,
        fotos=json.dumps(payload.fotos) if payload.fotos else None,
        cliente_id=payload.clienteId,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, vehiculo)
    return to_response(vehiculo)


def listar_vehiculos(
    db,
    empresa_id: int | None,
    *,
    placa: str | None = None,
    marca: str | None = None,
    cliente_id: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[VehiculoResponse], int]:
    filtros = filtro_empresa(Vehiculo, empresa_id) + crud_vehiculo.construir_filtros(
        placa=placa, marca=marca, cliente_id=cliente_id
    )
    col, dir_resuelta = resolver_orden(crud_vehiculo.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    vehiculos = crud_base.listar(
        db,
        Vehiculo,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Vehiculo, filtros=filtros)
    return [to_response(v) for v in vehiculos], total


def obtener_vehiculo(db, empresa_id: int | None, vehiculo_id: int) -> VehiculoResponse:
    vehiculo = crud_base.obtener_o_404(
        db, Vehiculo, vehiculo_id, "Vehículo no encontrado."
    )
    verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")
    return to_response(vehiculo)


def actualizar_vehiculo(
    db, empresa_id: int | None, vehiculo_id: int, payload: VehiculoUpdate
) -> VehiculoResponse:
    vehiculo = crud_base.obtener_o_404(
        db, Vehiculo, vehiculo_id, "Vehículo no encontrado."
    )
    verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "placa" in datos:
        placa = datos["placa"].strip().upper()
        existente = crud_vehiculo.get_by_placa(db, placa, vehiculo.empresa_id)
        if existente is not None and existente.id != vehiculo.id:
            raise HTTPException(status_code=409, detail="La placa ya está registrada.")
        vehiculo.placa = placa

    if "clienteId" in datos and datos["clienteId"] is not None:
        cliente = crud_base.obtener_o_404(db, Cliente, datos["clienteId"], "Cliente no encontrado.")
        verificar_empresa(cliente, empresa_id, "Cliente no encontrado.")
        vehiculo.cliente_id = datos["clienteId"]

    for campo in ("marca", "modelo", "anio", "color", "kilometraje"):
        if campo in datos:
            setattr(vehiculo, campo, datos[campo])

    if "fotos" in datos:
        vehiculo.fotos = json.dumps(datos["fotos"]) if datos["fotos"] else None

    crud_base.actualizar(db, vehiculo)
    return to_response(vehiculo)


def eliminar_vehiculo(db, empresa_id: int | None, vehiculo_id: int) -> None:
    vehiculo = crud_base.obtener_o_404(
        db, Vehiculo, vehiculo_id, "Vehículo no encontrado."
    )
    verificar_empresa(vehiculo, empresa_id, "Vehículo no encontrado.")

    if vehiculo.ordenes:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el vehículo tiene órdenes de trabajo.",
        )

    # El borrado en cascada elimina sus citas.
    crud_base.eliminar(db, vehiculo)