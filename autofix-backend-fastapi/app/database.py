"""Configuración de SQLAlchemy: motor, sesión, Base y dependencia get_db."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

DB_URL = settings.DATABASE_URL
CONNECT_ARGS = {"check_same_thread": False} if DB_URL.startswith("sqlite") else {}

engine = create_engine(DB_URL, connect_args=CONNECT_ARGS, pool_pre_ping=True)

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