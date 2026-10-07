"""Utilidades compartidas por los servicios."""

from fastapi import HTTPException


def resolver_orden(columnas: dict, orden: str | None, direccion: str):
    """Resuelve la columna de ordenamiento a partir de un mapa permitido."""
    if not orden:
        return None
    col = columnas.get(orden.strip().lower())
    if col is None:
        return None
    return col, (direccion or "asc")


# ------------------------------------------------------------------
# Aislamiento multiempresa
# ------------------------------------------------------------------
def filtro_empresa(model, empresa_id: int | None) -> list:
    """Filtro de aislamiento: vacío para SUPERADMIN (sin filtro)."""
    if empresa_id is None:
        return []
    return [model.empresa_id == empresa_id]


def verificar_empresa(obj, empresa_id: int | None, mensaje: str) -> None:
    """Garantiza que el objeto pertenece a la empresa del usuario.

    Si no pertenece, responde 404 (no se revela que el recurso existe
    en otra empresa). SUPERADMIN (empresa_id=None) no tiene restricción.
    """
    if empresa_id is None:
        return
    if getattr(obj, "empresa_id", None) != empresa_id:
        raise HTTPException(status_code=404, detail=mensaje)
