"""Lógica de negocio de Repuesto."""

from fastapi import HTTPException

from app.crud import repuesto as crud_repuesto
from app.crud import base as crud_base
from app.models.repuesto import Repuesto
from app.schemas.repuesto import RepuestoCreate, RepuestoResponse, RepuestoUpdate
from app.services.base import resolver_orden


def to_response(repuesto: Repuesto) -> RepuestoResponse:
    return RepuestoResponse(
        id=repuesto.id,
        nombre=repuesto.nombre,
        descripcion=repuesto.descripcion,
        stock=repuesto.stock,
        precio=repuesto.precio,
    )


def crear_repuesto(db, payload: RepuestoCreate) -> RepuestoResponse:
    if crud_repuesto.exists_nombre_ci(db, payload.nombre):
        raise HTTPException(status_code=409, detail="Ya existe un repuesto con ese nombre.")

    repuesto = Repuesto(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion,
        stock=payload.stock,
        precio=payload.precio,
    )
    crud_base.crear(db, repuesto)
    return to_response(repuesto)


def listar_repuestos(
    db,
    *,
    busqueda: str | None = None,
    stock_min: int | None = None,
    stock_max: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[RepuestoResponse], int]:
    filtros = crud_repuesto.construir_filtros(
        busqueda=busqueda, stock_min=stock_min, stock_max=stock_max
    )
    col, dir_resuelta = resolver_orden(crud_repuesto.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    repuestos = crud_base.listar(
        db,
        Repuesto,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Repuesto, filtros=filtros)
    return [to_response(r) for r in repuestos], total


def obtener_repuesto(db, repuesto_id: int) -> RepuestoResponse:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    return to_response(repuesto)


def actualizar_repuesto(db, repuesto_id: int, payload: RepuestoUpdate) -> RepuestoResponse:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )

    datos = payload.model_dump(exclude_unset=True)

    if "nombre" in datos:
        existente = crud_repuesto.get_by_nombre_ci(db, datos["nombre"])
        if existente is not None and existente.id != repuesto.id:
            raise HTTPException(status_code=409, detail="Ya existe un repuesto con ese nombre.")
        repuesto.nombre = datos["nombre"].strip()

    for campo in ("descripcion", "stock", "precio"):
        if campo in datos:
            setattr(repuesto, campo, datos[campo])

    crud_base.actualizar(db, repuesto)
    return to_response(repuesto)


def ajustar_stock(db, repuesto_id: int, cantidad: int) -> RepuestoResponse:
    """Mueve stock (entrada o salida manual). El stock nunca puede quedar negativo."""
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    nuevo_stock = repuesto.stock + cantidad
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail="No hay suficiente stock disponible.")
    repuesto.stock = nuevo_stock
    crud_base.actualizar(db, repuesto)
    return to_response(repuesto)


def eliminar_repuesto(db, repuesto_id: int) -> None:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )

    if repuesto.detalles:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el repuesto está usado en órdenes de trabajo.",
        )

    crud_base.eliminar(db, repuesto)