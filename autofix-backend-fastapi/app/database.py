"""Configuración de SQLAlchemy: motor, sesión, Base y dependencia get_db."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

DB_URL = settings.DATABASE_URL
ES_SQLITE = DB_URL.startswith("sqlite")

if ES_SQLITE:
    # SQLite no admite pool_size/max_overflow y necesita este flag en tests.
    CONNECT_ARGS: dict = {"check_same_thread": False}
    POOL_OPTIONS: dict = {}
else:
    # PostgreSQL (Neon/Render). connect_timeout evita que el arranque en
    # frío de Neon deje la petición colgada; pool_recycle recicla conexiones
    # que el proveedor pudo cerrar por inactividad (scale-to-zero).
    CONNECT_ARGS = {"connect_timeout": settings.DB_CONNECT_TIMEOUT}
    POOL_OPTIONS = {
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_recycle": 300,
    }

engine = create_engine(
    DB_URL,
    connect_args=CONNECT_ARGS,
    pool_pre_ping=True,
    **POOL_OPTIONS,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Clase base de todos los modelos ORM."""


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI: abre la sesión de BD y la cierra al terminar."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
