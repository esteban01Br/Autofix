"""Lógica de negocio de Usuario."""

from fastapi import HTTPException

from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.security import hash_password
from app.services.base import resolver_orden


def to_response(usuario: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        telefono=usuario.telefono,
        rol=usuario.rol,
        activo=usuario.activo,
        fechaCreacion=usuario.fecha_creacion,
    )


def crear_usuario(db, payload: UsuarioCreate) -> UsuarioResponse:
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        rol=payload.rol,
        activo=True,
    )
    crud_base.crear(db, usuario)
    return to_response(usuario)


def listar_usuarios(
    db,
    *,
    busqueda: str | None = None,
    rol=None,
    activo: bool | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[UsuarioResponse], int]:
    filtros = crud_usuario.construir_filtros(busqueda=busqueda, rol=rol, activo=activo)
    col, dir_resuelta = resolver_orden(crud_usuario.COLUMNAS_ORDEN, orden, direccion) or (None, direccion)
    usuarios = crud_base.listar(
        db,
        Usuario,
        filtros=filtros,
        orden_col=col,
        direccion=dir_resuelta,
        limit=limit,
        offset=offset,
    )
    total = crud_base.contar(db, Usuario, filtros=filtros)
    return [to_response(u) for u in usuarios], total


def obtener_usuario(db, usuario_id: int) -> UsuarioResponse:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")
    return to_response(usuario)


def actualizar_usuario(db, usuario_id: int, payload: UsuarioUpdate) -> UsuarioResponse:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    if "correo" in datos:
        nuevo_correo = datos["correo"].strip().lower()
        existente = crud_usuario.get_by_correo(db, nuevo_correo)
        if existente is not None and existente.id != usuario.id:
            raise HTTPException(status_code=409, detail="El correo ya está registrado.")
        usuario.correo = nuevo_correo

    if "contrasena" in datos and datos["contrasena"]:
        usuario.contrasena = hash_password(datos["contrasena"])

    for campo in ("nombre", "apellido", "telefono", "rol", "activo"):
        if campo in datos:
            setattr(usuario, campo, datos[campo])

    crud_base.actualizar(db, usuario)
    return to_response(usuario)


def eliminar_usuario(db, usuario_id: int) -> None:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")

    if usuario.cliente is not None or usuario.mecanico is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el usuario está asociado a un cliente o mecánico.",
        )

    crud_base.eliminar(db, usuario)