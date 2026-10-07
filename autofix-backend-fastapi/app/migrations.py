"""Micro-migraciones para bases de datos existentes.

El proyecto crea las tablas con ``Base.metadata.create_all`` (sin Alembic),
lo cual crea tablas nuevas pero **no agrega columnas** a tablas que ya
existen. Estas funciones complementan eso de forma idempotente: se pueden
ejecutar en cada arranque sin riesgo.
"""

from sqlalchemy import inspect, text

from app.database import engine


def _asegurar_codigo_barras_repuestos() -> None:
    """Agrega la columna ``codigo_barras`` a ``repuestos`` si falta."""
    insp = inspect(engine)
    if "repuestos" not in insp.get_table_names():
        return  # Tabla nueva: create_all la creará con la columna incluida.

    columnas = {c["name"] for c in insp.get_columns("repuestos")}
    with engine.begin() as conn:
        if "codigo_barras" not in columnas:
            conn.execute(
                text("ALTER TABLE repuestos ADD COLUMN codigo_barras VARCHAR(50)")
            )
        # Índice único (IF NOT EXISTS funciona en SQLite y PostgreSQL).
        # Los valores NULL no chocan entre sí, así que los repuestos sin
        # código de barras pueden coexistir sin problema.
        conn.execute(
            text(
                "CREATE UNIQUE INDEX IF NOT EXISTS ix_repuestos_codigo_barras "
                "ON repuestos (codigo_barras)"
            )
        )


def aplicar_migraciones() -> None:
    """Ejecuta todas las micro-migraciones pendientes (idempotente)."""
    _asegurar_codigo_barras_repuestos()
