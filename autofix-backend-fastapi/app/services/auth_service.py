"""Lógica de negocio de autenticación (login/registro)."""

from fastapi import HTTPException

from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password


def login(db, payload: LoginRequest) -> TokenResponse:
    usuario = crud_usuario.get_by_correo(db, payload.correo)

    # No se revela si el correo existe o no; siempre "Credenciales incorrectas".
    if usuario is None or not usuario.activo or not verify_password(
        payload.contrasena, usuario.contrasena
    ):
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(
        correo=usuario.correo, usuario_id=usuario.id, rol=usuario.rol.value
    )
    return TokenResponse(token=token)


def register(db, payload: RegisterRequest) -> TokenResponse:
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    # El auto-registro solo permite el rol CLIENTE; ADMIN/MECANICO
    # solo se crean por un administrador (endpoint /api/usuarios).
    usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        rol=Rol.CLIENTE,
        activo=True,
    )
    crud_base.crear(db, usuario)

    token = create_access_token(
        correo=usuario.correo, usuario_id=usuario.id, rol=usuario.rol.value
    )
    return TokenResponse(token=token)