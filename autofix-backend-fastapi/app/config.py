"""Configuración centralizada de AutoFix.

Todas las variables sensibles se leen desde variables de entorno
o desde el archivo .env (ver .env.example).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

_CLAVE_POR_DEFECTO = "autofix-sena-2026-clave-ultra-secreta-cambiar-en-produccion"

# Entorno de ejecución: "development" (local) o "production" (nube).
_ENTORNO = os.getenv("ENVIRONMENT", "development").strip().lower()
_ES_PRODUCCION = _ENTORNO == "production"

# La documentación interactiva (/docs) se expone por defecto solo en desarrollo.
_DOCS_DEFECTO = "false" if _ES_PRODUCCION else "true"


def _normalizar_database_url(url: str) -> str:
    """Adapta la URL de base de datos al formato que espera SQLAlchemy 2.x.

    Los proveedores de nube (Render, Railway, Heroku...) entregan la URL como
    ``postgres://...`` o ``postgresql://...``; aquí se convierte a
    ``postgresql+psycopg://...`` para usar el driver psycopg 3.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


class Settings:
    APP_NAME: str = "AutoFix API"
    APP_DESCRIPTION: str = "Sistema de gestión para taller mecánico"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Entorno
    ENVIRONMENT: str = _ENTORNO
    ES_PRODUCCION: bool = _ES_PRODUCCION

    # Seguridad / JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", _CLAVE_POR_DEFECTO)
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Base de datos (SQLite en local, PostgreSQL en producción)
    DATABASE_URL: str = _normalizar_database_url(
        os.getenv("DATABASE_URL", "sqlite:///./autofix.db")
    )

    # CORS
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://192.168.10.31:5173",
        ).split(",")
        if o.strip()
    ]

    # Servidor
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8081"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")

    # Documentación interactiva (/docs, /redoc, /openapi.json)
    DOCS_ENABLED: bool = os.getenv("DOCS_ENABLED", _DOCS_DEFECTO).lower() in (
        "true",
        "1",
        "yes",
    )

    # Límite de peticiones en endpoints sensibles (anti fuerza bruta)
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "true").lower() in (
        "true",
        "1",
        "yes",
    )


settings = Settings()

# ------------------------------------------------------------------
# Validaciones de seguridad obligatorias para producción
# ------------------------------------------------------------------
if settings.ES_PRODUCCION:
    if settings.SECRET_KEY == _CLAVE_POR_DEFECTO or len(settings.SECRET_KEY) < 32:
        raise RuntimeError(
            "SEGURIDAD: en producción (ENVIRONMENT=production) debes definir "
            "una SECRET_KEY propia de al menos 32 caracteres."
        )
