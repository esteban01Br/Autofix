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
# Los tests hacen muchos logins seguidos; sin límite de peticiones.
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    from app.main import app

    with TestClient(app) as c:
        yield c


@pytest.fixture(scope="session", autouse=True)
def empresa_defecto(client):
    """Empresa por defecto a la que se asignan los datos de los tests."""
    from app.database import SessionLocal
    from app.models.empresa import Empresa

    db = SessionLocal()
    try:
        empresa = db.query(Empresa).order_by(Empresa.id).first()
        if empresa is None:
            empresa = Empresa(nombre="AutoFix Pruebas", nit="900.000.001-1")
            db.add(empresa)
            db.commit()
            db.refresh(empresa)
        return empresa.id
    finally:
        db.close()


def _token_para(client, correo: str, rol, empresa_id):
    from app.database import SessionLocal
    from app.models.usuario import Usuario
    from app.security import create_access_token, hash_password

    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.correo == correo).first()
        if usuario is None:
            usuario = Usuario(
                nombre="Admin",
                apellido="Prueba",
                correo=correo,
                contrasena=hash_password("Password123!"),
                rol=rol,
                activo=True,
                empresa_id=empresa_id,
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)
        return create_access_token(
            correo=usuario.correo,
            usuario_id=usuario.id,
            rol=usuario.rol.value,
            empresa_id=usuario.empresa_id,
        )
    finally:
        db.close()


@pytest.fixture(scope="session")
def admin_token(client, empresa_defecto):
    from app.models.enums import Rol

    return _token_para(client, "admin@prueba.com", Rol.ADMIN, empresa_defecto)


@pytest.fixture(scope="session")
def superadmin_token(client):
    from app.models.enums import Rol

    return _token_para(client, "super@prueba.com", Rol.SUPERADMIN, None)


@pytest.fixture(scope="session")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}
