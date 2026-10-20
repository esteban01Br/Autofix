"""Utilidades generales de la aplicación."""

import re
import unicodedata
from datetime import datetime, timezone


def ahora_utc() -> datetime:
    """Hora UTC actual como datetime 'naive' (compatible con DateTime de SQLite)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generar_slug(texto: str) -> str:
    """Slug de URL a partir de un nombre: 'Taller El Méjico' → 'taller-el-mejico'."""
    normalizado = (
        unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    )
    limpio = re.sub(r"[^a-zA-Z0-9]+", "-", normalizado.lower()).strip("-")
    return limpio or "empresa"