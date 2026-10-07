"""Lógica de negocio de Empresa (multiempresa)."""

from fastapi import HTTPException

from app.crud import empresa as crud_empresa
from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.empresa import Empresa
from app.models.enums import Rol
from app.models.sucursal import Sucursal
from app.models.usuario import Usuario
from app.schemas.empresa import (
    EmpresaRegistroRequest,
    EmpresaRegistroResponse,
    EmpresaResponse,
    EmpresaUpdate,
)
from app.security import create_access_token, hash_password


def to_response(empresa: Empresa) -> EmpresaResponse:
    return EmpresaResponse(
        id=empresa.id,
        nombre=empresa.nombre,
        nit=empresa.nit,
        direccion=empresa.direccion,
        telefono=empresa.telefono,
        correo=empresa.correo,
        logo_url=empresa.logo_url,
        color_primario=empresa.color_primario,
        color_secundario=empresa.color_secundario,
        iva_porcentaje=empresa.iva_porcentaje,
        consecutivo_factura=empresa.consecutivo_factura,
        activa=empresa.activa,
        fecha_creacion=empresa.fecha_creacion,
    )


def registrar_empresa(db, payload: EmpresaRegistroRequest) -> EmpresaRegistroResponse:
    """Registro público: crea la empresa, su sucursal principal y el dueño
    como usuario ADMIN. Devuelve el token ya autenticado."""
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    if crud_empresa.get_by_nombre_ci(db, payload.nombre_empresa) is not None:
        raise HTTPException(
            status_code=409, detail="Ya existe una empresa con ese nombre."
        )

    nit = payload.nit.strip() if payload.nit else None
    if nit and crud_empresa.get_by_nit(db, nit) is not None:
        raise HTTPException(
            status_code=409, detail="Ya existe una empresa con ese NIT."
        )

    empresa = Empresa(
        nombre=payload.nombre_empresa.strip(),
        nit=nit,
        direccion=payload.direccion,
        telefono=payload.telefono_empresa,
    )
    db.add(empresa)
    db.flush()  # Obtiene empresa.id antes del commit

    # Jerarquía: toda empresa arranca con su sucursal principal (Fase 2).
    db.add(Sucursal(nombre="Principal", empresa_id=empresa.id))

    admin = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        rol=Rol.ADMIN,
        activo=True,
        empresa_id=empresa.id,
    )
    db.add(admin)
    db.commit()
    db.refresh(empresa)
    db.refresh(admin)

    token = create_access_token(
        correo=admin.correo,
        usuario_id=admin.id,
        rol=admin.rol.value,
        empresa_id=admin.empresa_id,
    )
    return EmpresaRegistroResponse(empresa=to_response(empresa), token=token)


def listar_empresas(db) -> list[EmpresaResponse]:
    """Solo SUPERADMIN: todas las empresas de la plataforma."""
    return [to_response(e) for e in crud_empresa.listar_todas(db)]


def obtener_actual(db, empresa_id: int | None) -> EmpresaResponse:
    """La empresa del usuario autenticado."""
    if empresa_id is None:
        raise HTTPException(
            status_code=400,
            detail="Tu usuario no pertenece a una empresa (SUPERADMIN).",
        )
    empresa = crud_base.obtener_o_404(db, Empresa, empresa_id, "Empresa no encontrada.")
    return to_response(empresa)


def actualizar_actual(db, empresa_id: int | None, payload: EmpresaUpdate) -> EmpresaResponse:
    """El ADMIN actualiza la marca y datos de contacto de SU empresa."""
    if empresa_id is None:
        raise HTTPException(
            status_code=400,
            detail="Tu usuario no pertenece a una empresa (SUPERADMIN).",
        )
    empresa = crud_base.obtener_o_404(db, Empresa, empresa_id, "Empresa no encontrada.")

    datos = payload.model_dump(exclude_unset=True)

    if "nombre" in datos and datos["nombre"] is not None:
        existente = crud_empresa.get_by_nombre_ci(db, datos["nombre"])
        if existente is not None and existente.id != empresa.id:
            raise HTTPException(
                status_code=409, detail="Ya existe una empresa con ese nombre."
            )
        empresa.nombre = datos["nombre"].strip()

    if "nit" in datos:
        nit = datos["nit"].strip() if datos["nit"] else None
        if nit:
            existente = crud_empresa.get_by_nit(db, nit)
            if existente is not None and existente.id != empresa.id:
                raise HTTPException(
                    status_code=409, detail="Ya existe una empresa con ese NIT."
                )
        empresa.nit = nit

    for campo in (
        "direccion",
        "telefono",
        "correo",
        "logo_url",
        "color_primario",
        "color_secundario",
        "iva_porcentaje",
    ):
        if campo in datos:
            setattr(empresa, campo, datos[campo])

    crud_base.actualizar(db, empresa)
    return to_response(empresa)


def cambiar_estado(db, empresa_id: int, activa: bool) -> EmpresaResponse:
    """Solo SUPERADMIN: activa o suspende una empresa (sin borrar datos)."""
    empresa = crud_base.obtener_o_404(db, Empresa, empresa_id, "Empresa no encontrada.")
    empresa.activa = activa
    crud_base.actualizar(db, empresa)
    return to_response(empresa)
