"""Pruebas de la aceptación de términos y política de datos al registrarse."""

import uuid

from sqlalchemy import select


def _payload(correo, acepto):
    return {
        "nombre_empresa": f"Taller Terminos {uuid.uuid4().hex[:6]}",
        "nombre": "Dueño",
        "apellido": "Legal",
        "correo": correo,
        "contrasena": "Clave12345!",
        "acepto_terminos": acepto,
    }


def test_registro_sin_aceptar_terminos_devuelve_400(client):
    resp = client.post(
        "/api/empresas/registro",
        json=_payload(f"sin-acepto-{uuid.uuid4().hex[:8]}@correo.com", False),
    )
    assert resp.status_code == 400
    assert "términos" in resp.json()["detail"].lower()


def test_registro_guarda_fecha_y_version_de_aceptacion(client):
    from app.database import SessionLocal
    from app.models.empresa import Empresa
    from app.services.empresa_service import VERSION_TERMINOS_ACTUAL

    correo = f"con-acepto-{uuid.uuid4().hex[:8]}@correo.com"
    resp = client.post("/api/empresas/registro", json=_payload(correo, True))
    assert resp.status_code == 201, resp.text
    eid = resp.json()["empresa"]["id"]

    db = SessionLocal()
    try:
        empresa = db.scalar(select(Empresa).where(Empresa.id == eid))
        assert empresa.acepto_terminos is True
        assert empresa.fecha_aceptacion_terminos is not None
        assert empresa.version_terminos == VERSION_TERMINOS_ACTUAL
    finally:
        db.close()
