"""Seguridad: hashing de contraseñas con bcrypt y tokens JWT."""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.config import settings


def hash_password(contrasena: str) -> str:
    """Hashea una contraseña en texto plano con bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(contrasena.encode("utf-8"), salt).decode("utf-8")


def verify_password(contrasena: str, hash_almacenado: str) -> bool:
    """Compara una contraseña en texto plano con su hash bcrypt."""
    try:
        return bcrypt.checkpw(contrasena.encode("utf-8"), hash_almacenado.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(
    *, correo: str, usuario_id: int, rol: str, empresa_id: int | None = None, debe_cambiar: bool = False
) -> str:
    """Genera un token JWT con expiración configurable.

    Los claims usados son sub (correo), id, rol y empresa_id (None solo para
    SUPERADMIN de plataforma); el frontend los decodifica directamente
    (ver AuthContext).
    """
    expira = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": correo,
        "id": usuario_id,
        "rol": rol,
        "empresa_id": empresa_id,
        "debe_cambiar": debe_cambiar,
        "iat": datetime.now(timezone.utc),
        "exp": expira,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict | None:
    """Decodifica y valida un token JWT. Devuelve None si no es válido."""
    try:
        return jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
    except jwt.PyJWTError:
        return None