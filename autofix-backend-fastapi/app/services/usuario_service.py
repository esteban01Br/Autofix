"""Lógica de negocio de Usuario."""

from fastapi import HTTPException

from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.security import hash_password
from app.services.base import filtro_empresa, resolver_orden, verificar_empresa


def to_response(usuario: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=usuario.id,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        correo=usuario.correo,
        telefono=usuario.telefono,
        rol=usuario.rol,
        activo=usuario.activo,
        debeCambiarContrasena=usuario.debe_cambiar_contrasena,
        fechaCreacion=usuario.fecha_creacion,
    )


def invitar_empleado(db, empresa_id: int, payload: UsuarioCreate) -> UsuarioResponse:
    """Crea un empleado con contraseña temporal y cambio obligatorio."""
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    if payload.rol == Rol.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No se puede crear un usuario SUPERADMIN.")

    usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        rol=payload.rol,
        activo=True,
        debe_cambiar_contrasena=True,  # Debe cambiarla en su primer login
        empresa_id=empresa_id,
    )
    crud_base.crear(db, usuario)
    return to_response(usuario)


def reestablecer_contrasena(db, empresa_id: int, usuario_id: int, nueva_contrasena: str) -> UsuarioResponse:
    """El ADMIN genera una nueva contraseña temporal para un empleado."""
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")
    verificar_empresa(usuario, empresa_id, "Usuario no encontrado.")

    if usuario.rol == Rol.SUPERADMIN:
        raise HTTPException(status_code=403, detail="No se puede reestablecer la contraseña de un SUPERADMIN.")

    usuario.contrasena = hash_password(nueva_contrasena)
    usuario.debe_cambiar_contrasena = True
    crud_base.actualizar(db, usuario)
    return to_response(usuario)


def crear_usuario(db, empresa_id: int, payload: UsuarioCreate) -> UsuarioResponse:
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    # El rol SUPERADMIN de plataforma no se puede crear desde la API de
    # cada empresa (solo por seed o por otro SUPERADMIN).
    if payload.rol == Rol.SUPERADMIN:
        raise HTTPException(
            status_code=403, detail="No se puede crear un usuario SUPERADMIN."
        )

    usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        rol=payload.rol,
        activo=True,
        empresa_id=empresa_id,
    )
    crud_base.crear(db, usuario)
    return to_response(usuario)


def listar_usuarios(
    db,
    empresa_id: int | None,
    *,
    busqueda: str | None = None,
    rol=None,
    activo: bool | None = None,
    orden: str | None = None,
    direccion: str = "asc",
    limit: int | None = None,
    offset: int = 0,
) -> tuple[list[UsuarioResponse], int]:
    filtros = filtro_empresa(Usuario, empresa_id) + crud_usuario.construir_filtros(
        busqueda=busqueda, rol=rol, activo=activo
    )
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


def obtener_usuario(db, empresa_id: int | None, usuario_id: int) -> UsuarioResponse:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")
    verificar_empresa(usuario, empresa_id, "Usuario no encontrado.")
    return to_response(usuario)


def actualizar_usuario(
    db, empresa_id: int | None, usuario_id: int, payload: UsuarioUpdate
) -> UsuarioResponse:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")
    verificar_empresa(usuario, empresa_id, "Usuario no encontrado.")

    datos = payload.model_dump(exclude_unset=True)

    # Nadie puede elevar un usuario a SUPERADMIN desde la API de empresa.
    if datos.get("rol") == Rol.SUPERADMIN:
        raise HTTPException(
            status_code=403, detail="No se puede asignar el rol SUPERADMIN."
        )

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


def eliminar_usuario(db, empresa_id: int | None, usuario_id: int) -> None:
    usuario = crud_base.obtener_o_404(db, Usuario, usuario_id, "Usuario no encontrado.")
    verificar_empresa(usuario, empresa_id, "Usuario no encontrado.")

    if usuario.cliente is not None or usuario.mecanico is not None:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar: el usuario está asociado a un cliente o mecánico.",
        )

    crud_base.eliminar(db, usuario)