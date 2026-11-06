"""Configuración de Alembic para AutoFix.

La URL de conexión NO vive en alembic.ini: se toma de las variables de
entorno a través de ``app.config.settings``. Para tareas que deben usar la
conexión DIRECTA de Neon (``alembic upgrade``, ``alembic check``,
``alembic stamp``) se prefiere ``DATABASE_URL_DIRECTA`` cuando existe.
"""

import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool

from alembic import context

# Asegura que el paquete `app` sea importable aunque Alembic se invoque
# desde otro directorio.
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.config import settings  # noqa: E402
from app.database import Base  # noqa: E402
import app.models  # noqa: E402,F401  (registra todos los modelos)

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _url_migraciones() -> str:
    """URL a usar: la directa si está definida, si no la de la app."""
    return (os.getenv("DATABASE_URL_DIRECTA") or settings.DATABASE_URL).strip()


# En ConfigParser el signo '%' debe duplicarse.
config.set_main_option("sqlalchemy.url", _url_migraciones().replace("%", "%%"))

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        render_as_batch=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            render_as_batch=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
