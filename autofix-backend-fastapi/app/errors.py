"""Manejadores globales de errores.

Evitan filtrar información sensible: los errores internos siempre se
responden con un mensaje genérico.
"""

from fastapi.exceptions import RequestValidationError
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.config import settings


def validation_exception_handler(request: Request, exc: RequestValidationError):
    errores = []
    for err in exc.errors():
        # Se omite la parte "body"/"query" de la ubicación para dejar solo el campo.
        loc = [str(p) for p in err.get("loc", []) if p != "body" and not isinstance(p, int)]
        campo = ".".join(loc) or "cuerpo"
        errores.append({"campo": campo, "mensaje": err.get("msg", "Valor inválido.")})
    return JSONResponse(
        status_code=422,
        content={"detail": "Error de validación de los datos enviados.", "errores": errores},
    )


def unhandled_exception_handler(request: Request, exc: Exception):
    if settings.DEBUG:
        detalle = f"Error interno del servidor: {exc!r}"
    else:
        detalle = "Error interno del servidor."
    return JSONResponse(status_code=500, content={"detail": detalle})


def rate_limit_exception_handler(request: Request, exc: RateLimitExceeded):
    """Respuesta 429 en JSON cuando se supera el límite de peticiones."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Demasiados intentos. Espera un momento e inténtalo de nuevo."
        },
    )