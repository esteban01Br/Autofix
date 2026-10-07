"""Lógica de negocio de Repuesto."""

from fastapi import HTTPException

from app.crud import repuesto as crud_repuesto
from app.crud import base as crud_base
from app.models.repuesto import Repuesto
from app.schemas.repuesto import RepuestoCreate, RepuestoResponse, RepuestoUpdate
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa


def to_response(repuesto: Repuesto) -> RepuestoResponse:
    return RepuestoResponse(
        id=repuesto.id,
        nombre=repuesto.nombre,
        descripcion=repuesto.descripcion,
        codigo_barras=repuesto.codigo_barras,
        stock=repuesto.stock,
        precio=repuesto.precio,
    )


def _normalizar_codigo(codigo: str | None) -> str | None:
    """Devuelve el código limpio o None si viene vacío."""
    if codigo is None:
        return None
    limpio = codigo.strip()
    return limpio or None


def crear_repuesto(db, empresa_id: int, payload: RepuestoCreate) -> RepuestoResponse:
    if crud_repuesto.exists_nombre_ci(db, payload.nombre, empresa_id):
        raise HTTPException(status_code=409, detail="Ya existe un repuesto con ese nombre.")

    codigo = _normalizar_codigo(payload.codigo_barras)
    if codigo is not None and crud_repuesto.get_by_codigo(db, codigo, empresa_id) is not None:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un repuesto con ese código de barras en tu empresa.",
        )

    repuesto = Repuesto(
        nombre=payload.nombre.strip(),
        descripcion=payload.descripcion,
        codigo_barras=codigo,
        stock=payload.stock,
        precio=payload.precio,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, repuesto)
    return to_response(repuesto)


def listar_repuestos(
    db,
    empresa_id: int | None,
    *,
    busqueda: str | None = None,
    stock_min: int | None = None,
    stock_max: int | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[RepuestoResponse], int]:
    filtros = filtro_empresa(Repuesto, empresa_id) + crud_repuesto.construir_filtros(
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


def obtener_repuesto(db, empresa_id: int | None, repuesto_id: int) -> RepuestoResponse:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")
    return to_response(repuesto)


def obtener_por_codigo(db, empresa_id: int | None, codigo: str) -> RepuestoResponse:
    """Busca un repuesto por código de barras (usado por el escáner)."""
    repuesto = crud_repuesto.get_by_codigo(db, codigo, empresa_id)
    if repuesto is None:
        raise HTTPException(
            status_code=404,
            detail="No hay ningún repuesto registrado con ese código de barras.",
        )
    return to_response(repuesto)


def actualizar_repuesto(
    db, empresa_id: int | None, repuesto_id: int, payload: RepuestoUpdate
) -> RepuestoResponse:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "nombre" in datos:
        existente = crud_repuesto.get_by_nombre_ci(db, datos["nombre"], repuesto.empresa_id)
        if existente is not None and existente.id != repuesto.id:
            raise HTTPException(status_code=409, detail="Ya existe un repuesto con ese nombre.")
        repuesto.nombre = datos["nombre"].strip()

    if "codigo_barras" in datos:
        codigo = _normalizar_codigo(datos["codigo_barras"])
        if codigo is not None:
            existente = crud_repuesto.get_by_codigo(db, codigo, repuesto.empresa_id)
            if existente is not None and existente.id != repuesto.id:
                raise HTTPException(
                    status_code=409,
                    detail="Ya existe un repuesto con ese código de barras en tu empresa.",
                )
        repuesto.codigo_barras = codigo

    for campo in ("descripcion", "stock", "precio"):
        if campo in datos:
            setattr(repuesto, campo, datos[campo])

    crud_base.actualizar(db, repuesto)
    return to_response(repuesto)


def ajustar_stock(db, empresa_id: int | None, repuesto_id: int, cantidad: int) -> RepuestoResponse:
    """Mueve stock (entrada o salida manual). El stock nunca puede quedar negativo."""
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")
    nuevo_stock = repuesto.stock + cantidad
    if nuevo_stock < 0:
        raise HTTPException(status_code=400, detail="No hay suficiente stock disponible.")
    repuesto.stock = nuevo_stock
    crud_base.actualizar(db, repuesto)
    return to_response(repuesto)


def eliminar_repuesto(db, empresa_id: int | None, repuesto_id: int) -> None:
    repuesto = crud_base.obtener_o_404(
        db, Repuesto, repuesto_id, "Repuesto no encontrado."
    )
    verificar_empresa(repuesto, empresa_id, "Repuesto no encontrado.")

    if repuesto.detalles:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el repuesto está usado en órdenes de trabajo.",
        )

    crud_base.eliminar(db, repuesto)
