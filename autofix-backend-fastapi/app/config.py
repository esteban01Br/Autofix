"""Configuración centralizada de AutoFix.

Todas las variables sensibles se leen desde variables de entorno
o desde el archivo .env (ver .env.example).
"""

import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    APP_NAME: str = "AutoFix API"
    APP_DESCRIPTION: str = "Sistema de gestión para taller mecánico"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"

    # Seguridad / JWT
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", "autofix-sena-2026-clave-ultra-secreta-cambiar-en-produccion"
    )
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
    )

    # Base de datos
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./autofix.db")

    # CORS
    CORS_ORIGINS: list[str] = [
        o.strip()
        for o in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://192.168.10.31:5173",
        ).split(",")
        if o.strip()
    ]

    # Servidor
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8081"))
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("true", "1", "yes")


settings = Settings()