"""Lógica de negocio de Servicio (catálogo de servicios y mano de obra)."""

from fastapi import HTTPException
from sqlalchemy import select

from app.crud import base as crud_base
from app.models.servicio import Servicio
from app.schemas.servicio import ServicioCreate, ServicioResponse, ServicioUpdate
from app.services.base import filtro_empresa, verificar_empresa


def to_response(servicio: Servicio) -> ServicioResponse:
    return ServicioResponse(
        id=servicio.id,
        nombre=servicio.nombre,
        descripcion=servicio.descripcion,
        precio=servicio.precio,
        duracionMinutos=servicio.duracion_minutos,
        activo=servicio.activo,
    )


def _existe_nombre(
    db, empresa_id: int | None, nombre: str, excluir_id: int | None = None
) -> bool:
    stmt = select(Servicio).where(Servicio.nombre == nombre)
    for condicion in filtro_empresa(Servicio, empresa_id):
        stmt = stmt.where(condicion)
    if excluir_id is not None:
        stmt = stmt.where(Servicio.id != excluir_id)
    return db.scalar(stmt) is not None


def listar_servicios(
    db, empresa_id: int | None, *, solo_activos: bool = False
) -> list[ServicioResponse]:
    filtros = filtro_empresa(Servicio, empresa_id)
    if solo_activos:
        filtros = filtros + [Servicio.activo.is_(True)]
    stmt = select(Servicio).where(*filtros).order_by(Servicio.nombre.asc())
    return [to_response(s) for s in db.scalars(stmt).all()]


def obtener_servicio(
    db, empresa_id: int | None, servicio_id: int
) -> ServicioResponse:
    servicio = crud_base.obtener_o_404(
        db, Servicio, servicio_id, "Servicio no encontrado."
    )
    verificar_empresa(servicio, empresa_id, "Servicio no encontrado.")
    return to_response(servicio)


def crear_servicio(
    db, empresa_id: int | None, payload: ServicioCreate
) -> ServicioResponse:
    nombre = payload.nombre.strip()
    if _existe_nombre(db, empresa_id, nombre):
        raise HTTPException(
            status_code=409, detail="Ya existe un servicio con ese nombre."
        )

    servicio = Servicio(
        nombre=nombre,
        descripcion=payload.descripcion,
        precio=payload.precio,
        duracion_minutos=payload.duracion_minutos,
        activo=payload.activo,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, servicio)
    return to_response(servicio)


def actualizar_servicio(
    db, empresa_id: int | None, servicio_id: int, payload: ServicioUpdate
) -> ServicioResponse:
    servicio = crud_base.obtener_o_404(
        db, Servicio, servicio_id, "Servicio no encontrado."
    )
    verificar_empresa(servicio, empresa_id, "Servicio no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "nombre" in datos:
        nuevo = datos["nombre"].strip()
        if _existe_nombre(db, empresa_id, nuevo, excluir_id=servicio.id):
            raise HTTPException(
                status_code=409, detail="Ya existe un servicio con ese nombre."
            )
        servicio.nombre = nuevo

    for campo in ("descripcion", "precio", "duracion_minutos", "activo"):
        if campo in datos:
            setattr(servicio, campo, datos[campo])

    crud_base.actualizar(db, servicio)
    return to_response(servicio)


def eliminar_servicio(db, empresa_id: int | None, servicio_id: int) -> None:
    servicio = crud_base.obtener_o_404(
        db, Servicio, servicio_id, "Servicio no encontrado."
    )
    verificar_empresa(servicio, empresa_id, "Servicio no encontrado.")
    crud_base.eliminar(db, servicio)
