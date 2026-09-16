"""Lógica de negocio de Mecánico."""

from fastapi import HTTPException

from app.crud import mecanico as crud_mecanico
from app.crud import base as crud_base
from app.models.mecanico import Mecanico
from app.models.usuario import Usuario
from app.schemas.mecanico import MecanicoCreate, MecanicoResponse, MecanicoUpdate
from app.services import usuario_service
from app.services.base import resolver_orden


def to_response(mecanico: Mecanico) -> MecanicoResponse:
    return MecanicoResponse(
        id=mecanico.id,
        usuario=usuario_service.to_response(mecanico.usuario),
        especialidad=mecanico.especialidad,
    )


def crear_mecanico(db, payload: MecanicoCreate) -> MecanicoResponse:
    if crud_mecanico.exists_usuario(db, payload.usuarioId):
        raise HTTPException(
            status_code=409, detail="Ese usuario ya está registrado como mecánico."
        )

    usuario = crud_base.obtener_o_404(
        db, Usuario, payload.usuarioId, "Usuario no encontrado."
    )

    mecanico = Mecanico(usuario_id=usuario.id, especialidad=payload.especialidad)
    crud_base.crear(db, mecanico)
    return to_response(mecanico)


def listar_mecanicos(
    db,
    *,
    busqueda: str | None = None,
    especialidad: str | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[MecanicoResponse], int]:
    filtros = crud_mecanico.construir_filtros(
        busqueda=busqueda, especialidad=especialidad
    )
    col, dir_resuelta = resolver_orden(crud_mecanico.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    mecanicos = crud_base.listar(
        db,
        Mecanico,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Mecanico, filtros=filtros)
    return [to_response(m) for m in mecanicos], total


def obtener_mecanico(db, mecanico_id: int) -> MecanicoResponse:
    mecanico = crud_base.obtener_o_404(
        db, Mecanico, mecanico_id, "Mecánico no encontrado."
    )
    return to_response(mecanico)


def actualizar_mecanico(db, mecanico_id: int, payload: MecanicoUpdate) -> MecanicoResponse:
    mecanico = crud_base.obtener_o_404(
        db, Mecanico, mecanico_id, "Mecánico no encontrado."
    )

    datos = payload.model_dump(exclude_unset=True)

    if "usuarioId" in datos and datos["usuarioId"] is not None:
        usuario = crud_base.obtener_o_404(
            db, Usuario, datos["usuarioId"], "Usuario no encontrado."
        )
        existente = crud_mecanico.get_by_usuario_id(db, usuario.id)
        if existente is not None and existente.id != mecanico.id:
            raise HTTPException(
                status_code=409, detail="Ese usuario ya pertenece a otro mecánico."
            )
        mecanico.usuario_id = usuario.id

    if "especialidad" in datos:
        mecanico.especialidad = datos["especialidad"]

    crud_base.actualizar(db, mecanico)
    return to_response(mecanico)


def eliminar_mecanico(db, mecanico_id: int) -> None:
    mecanico = crud_base.obtener_o_404(
        db, Mecanico, mecanico_id, "Mecánico no encontrado."
    )

    if mecanico.ordenes:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el mecánico tiene órdenes de trabajo asignadas.",
        )

    crud_base.eliminar(db, mecanico)