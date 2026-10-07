"""Limitador de peticiones (rate limiting) para endpoints sensibles.

Protege contra ataques de fuerza bruta, especialmente en /api/auth/login.
Se desactiva con la variable de entorno RATE_LIMIT_ENABLED=false
(útil para las pruebas automatizadas).
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
)
