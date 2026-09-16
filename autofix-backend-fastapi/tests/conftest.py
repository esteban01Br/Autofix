"""Fixture de prueba: base de datos SQLite temporal y cliente HTTP de pruebas."""

import os
from pathlib import Path

# IMPORTANTE: se configura el entorno ANTES de importar la aplicación.
TEST_DB = Path(__file__).parent / "test_autofix.db"
if TEST_DB.exists():
    TEST_DB.unlink()

os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["SECRET_KEY"] = "clave-de-prueba-para-autofix-tests-2026"
os.environ["DEBUG"] = "true"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session")
def admin_token(client):
    from app.database import SessionLocal
    from app.models.enums import Rol
    from app.models.usuario import Usuario
    from app.security import create_access_token, hash_password

    correo = "admin@prueba.com"
    db = SessionLocal()
    try:
        admin = (
            db.query(Usuario).filter(Usuario.correo == correo).first()
        )
        if admin is None:
            admin = Usuario(
                nombre="Admin",
                apellido="Prueba",
                correo=correo,
                contrasena=hash_password("Password123!"),
                rol=Rol.ADMIN,
                activo=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        return create_access_token(
            correo=admin.correo, usuario_id=admin.id, rol=admin.rol.value
        )
    finally:
        db.close()


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}