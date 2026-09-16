"""Utilidades compartidas por los servicios."""


def resolver_orden(columnas: dict, orden: str | None, direccion: str):
    """Resuelve la columna de ordenamiento a partir de un mapa permitido."""
    if not orden:
        return None
    col = columnas.get(orden.strip().lower())
    if col is None:
        return None
    return col, (direccion or "asc")