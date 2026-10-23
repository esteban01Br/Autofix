"""Lógica de negocio de Proveedor.

Los proveedores son el catálogo del que se surten los repuestos. Un
proveedor con repuestos asociados no se elimina: se desactiva para no
romper el historial de compras.
"""

from fastapi import HTTPException

from app.crud import base as crud_base
from app.crud import proveedor as crud_proveedor
from app.models.proveedor import Proveedor
from app.schemas.proveedor import (
    ProveedorCreate,
    ProveedorResponse,
    ProveedorUpdate,
)
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa


def to_response(proveedor: Proveedor, db=None) -> ProveedorResponse:
    # El conteo de repuestos requiere sesión; si no hay db, se usa la
    # relación ya cargada (lazy) para no romper la firma de to_response.
    if db is not None:
        asociados = crud_proveedor.contar_repuestos(db, proveedor.id)
    else:
        asociados = len(proveedor.repuestos)
    return ProveedorResponse(
        id=proveedor.id,
        nombre=proveedor.nombre,
        nit=proveedor.nit,
        contacto=proveedor.contacto,
        telefono=proveedor.telefono,
        correo=proveedor.correo,
        direccion=proveedor.direccion,
        activo=proveedor.activo,
        repuestosAsociados=asociados,
    )


def crear_proveedor(db, empresa_id: int, payload: ProveedorCreate) -> ProveedorResponse:
    if crud_proveedor.get_by_nombre_ci(db, payload.nombre, empresa_id) is not None:
        raise HTTPException(
            status_code=409, detail="Ya existe un proveedor con ese nombre."
        )

    proveedor = Proveedor(
        nombre=payload.nombre.strip(),
        nit=payload.nit,
        contacto=payload.contacto,
        telefono=payload.telefono,
        correo=payload.correo,
        direccion=payload.direccion,
        activo=payload.activo,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, proveedor)
    return to_response(proveedor, db)


def listar_proveedores(
    db,
    empresa_id: int | None,
    *,
    activo: bool | None = None,
    busqueda: str | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[ProveedorResponse], int]:
    filtros = filtro_empresa(Proveedor, empresa_id) + crud_proveedor.construir_filtros(
        activo=activo, busqueda=busqueda
    )
    col, dir_resuelta = resolver_orden(
        crud_proveedor.COLUMNAS_ORDEN, orden, direccion
    ) or (None, direccion)
    proveedores = crud_base.listar(
        db,
        Proveedor,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Proveedor, filtros=filtros)
    return [to_response(p, db) for p in proveedores], total


def obtener_proveedor(db, empresa_id: int | None, proveedor_id: int) -> ProveedorResponse:
    proveedor = crud_base.obtener_o_404(
        db, Proveedor, proveedor_id, "Proveedor no encontrado."
    )
    verificar_empresa(proveedor, empresa_id, "Proveedor no encontrado.")
    return to_response(proveedor, db)


def actualizar_proveedor(
    db, empresa_id: int | None, proveedor_id: int, payload: ProveedorUpdate
) -> ProveedorResponse:
    proveedor = crud_base.obtener_o_404(
        db, Proveedor, proveedor_id, "Proveedor no encontrado."
    )
    verificar_empresa(proveedor, empresa_id, "Proveedor no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "nombre" in datos:
        existente = crud_proveedor.get_by_nombre_ci(
            db, datos["nombre"], proveedor.empresa_id
        )
        if existente is not None and existente.id != proveedor.id:
            raise HTTPException(
                status_code=409, detail="Ya existe un proveedor con ese nombre."
            )
        proveedor.nombre = datos["nombre"].strip()

    for campo in ("nit", "contacto", "telefono", "correo", "direccion", "activo"):
        if campo in datos:
            setattr(proveedor, campo, datos[campo])

    crud_base.actualizar(db, proveedor)
    return to_response(proveedor, db)


def eliminar_proveedor(db, empresa_id: int | None, proveedor_id: int) -> None:
    proveedor = crud_base.obtener_o_404(
        db, Proveedor, proveedor_id, "Proveedor no encontrado."
    )
    verificar_empresa(proveedor, empresa_id, "Proveedor no encontrado.")

    asociados = crud_proveedor.contar_repuestos(db, proveedor_id)
    if asociados > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                f"El proveedor tiene {asociados} repuesto(s) asociados. "
                "Desactive el proveedor en su lugar para conservar el historial."
            ),
        )

    db.delete(proveedor)
    db.commit()
