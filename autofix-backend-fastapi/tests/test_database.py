"""Pruebas de la configuración de base de datos y de la dependencia get_db."""

from sqlalchemy import text


def test_get_db_reconecta_tras_cerrar_conexiones():
    """pool_pre_ping debe recuperar la sesión si el proveedor cerró conexiones.

    Simula el scale-to-zero de Neon: se ejecuta una consulta, se descarta el
    pool (engine.dispose) y la siguiente sesión debe volver a conectar sin
    lanzar excepciones.
    """
    from app.database import SessionLocal, engine

    with SessionLocal() as db:
        assert db.execute(text("SELECT 1")).scalar() == 1

    engine.dispose()

    with SessionLocal() as db:
        assert db.execute(text("SELECT 1")).scalar() == 1


def test_config_url_directa_es_opcional():
    """DATABASE_URL_DIRECTA es opcional y, si existe, se normaliza."""
    from app.config import Settings

    s = Settings()
    assert s.DATABASE_URL_DIRECTA is None or s.DATABASE_URL_DIRECTA.startswith(
        ("postgresql+psycopg://", "sqlite")
    )
