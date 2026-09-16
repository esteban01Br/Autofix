"""Dependencias de FastAPI: get_db (heredada de database), autenticación y roles."""

from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.crud.usuario import get_by_correo
from app.database import get_db  # re-export para uso en rutas
from app.models.usuario import Usuario
from app.security import decode_token

bearer_scheme = HTTPBearer(auto_error=False)

INVALIDAR_CREDENCIALES = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="No autenticado o token inválido",
    headers={"WWW-Authenticate": "Bearer"},
)

PERMISO_DENEGADO = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="No tiene permisos para realizar esta acción",
)


def get_current_user(
    credenciales: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Usuario:
    """Valida el token JWT y devuelve el usuario autenticado."""
    if credenciales is None:
        raise INVALIDAR_CREDENCIALES

    payload = decode_token(credenciales.credentials)
    if payload is None:
        raise INVALIDAR_CREDENCIALES

    correo = payload.get("sub")
    if not correo:
        raise INVALIDAR_CREDENCIALES

    usuario = get_by_correo(db, correo)
    if usuario is None or not usuario.activo:
        raise INVALIDAR_CREDENCIALES

    return usuario


def require_roles(*roles: str) -> Callable[..., Usuario]:
    """Devuelve una dependencia que exige que el usuario tenga alguno de los roles."""

    def verificar(usuario: Usuario = Depends(get_current_user)) -> Usuario:
        if usuario.rol.value not in roles:
            raise PERMISO_DENEGADO
        return usuario

    return verificar


# Dependencias listas para usar en las rutas.
admin = require_roles("ADMIN")
lectura_administrativa = require_roles("ADMIN", "MECANICO", "CLIENTE")