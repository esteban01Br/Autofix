"""Utilidades generales de la aplicación."""

from datetime import datetime, timezone


def ahora_utc() -> datetime:
    """Hora UTC actual como datetime 'naive' (compatible con DateTime de SQLite)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)