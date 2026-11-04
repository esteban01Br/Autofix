"""Pruebas de bloqueo por cuenta, auditoría de login y política de contraseñas."""

from datetime import timedelta

from tests.test_api import SLUG_PRUEBAS, auth, correo_unico, crear_usuario


def _login(client, correo: str, contrasena: str = "Password123!"):
    return client.post(
        "/api/auth/login", json={"correo": correo, "contrasena": contrasena}
    )


def _usuario_db(correo: str):
    from app.database import SessionLocal
    from app.models.usuario import Usuario

    db = SessionLocal()
    try:
        return db.query(Usuario).filter(Usuario.correo == correo).one()
    finally:
        db.close()


# ---------- bloqueo temporal por cuenta ----------


def test_cinco_fallos_bloquean_la_cuenta(client, admin_token):
    correo = correo_unico("bloqueo")
    crear_usuario(client, admin_token, correo)

    for _ in range(5):
        assert _login(client, correo, "Incorrecta123!").status_code == 401

    # El sexto intento se rechaza aunque la contraseña sea la correcta.
    bloqueado = _login(client, correo)
    assert bloqueado.status_code == 429
    assert "Demasiados intentos" in bloqueado.json()["detail"]


def test_bloqueo_expirado_permite_entrar_de_nuevo(client, admin_token):
    correo = correo_unico("expira")
    crear_usuario(client, admin_token, correo)

    for _ in range(5):
        _login(client, correo, "Incorrecta123!")
    assert _login(client, correo).status_code == 429

    # Simula que ya pasaron los 15 minutos.
    from app.database import SessionLocal
    from app.models.usuario import Usuario
    from app.utils import ahora_utc

    db = SessionLocal()
    try:
        usuario = db.query(Usuario).filter(Usuario.correo == correo).one()
        usuario.bloqueado_hasta = ahora_utc() - timedelta(minutes=1)
        db.commit()
    finally:
        db.close()

    assert _login(client, correo).status_code == 200


def test_login_correcto_reinicia_el_contador(client, admin_token):
    correo = correo_unico("reinicia")
    crear_usuario(client, admin_token, correo)

    for _ in range(3):
        assert _login(client, correo, "Incorrecta123!").status_code == 401
    assert _login(client, correo).status_code == 200

    usuario = _usuario_db(correo)
    assert usuario.intentos_fallidos == 0
    assert usuario.bloqueado_hasta is None


# ---------- auditoría de inicios de sesión ----------


def test_login_ok_y_fallido_quedan_auditados(client, admin_token):
    correo = correo_unico("audita")
    crear_usuario(client, admin_token, correo)

    assert _login(client, correo).status_code == 200
    assert _login(client, correo, "Incorrecta123!").status_code == 401

    ok = client.get(
        "/api/auditoria", params={"accion": "LOGIN_OK"}, headers=auth(admin_token)
    )
    fallido = client.get(
        "/api/auditoria",
        params={"accion": "LOGIN_FALLIDO"},
        headers=auth(admin_token),
    )
    assert ok.status_code == 200 and fallido.status_code == 200
    assert any(r["accion"] == "LOGIN_OK" and r["entidadId"] for r in ok.json())
    assert any(
        r["accion"] == "LOGIN_FALLIDO" and r["entidadId"] for r in fallido.json()
    )


def test_login_fallido_con_correo_inexistente_no_guarda_el_correo(client):
    from app.database import SessionLocal
    from app.models.auditoria import Auditoria

    correo = correo_unico("noexiste")
    assert _login(client, correo).status_code == 401

    # El registro se guarda sin empresa ni usuario (el correo no existe), así
    # que se verifica directo en la tabla y no por el endpoint de la empresa.
    db = SessionLocal()
    try:
        fila = (
            db.query(Auditoria)
            .filter(Auditoria.accion == "LOGIN_FALLIDO", Auditoria.usuario_id.is_(None))
            .order_by(Auditoria.id.desc())
            .first()
        )
    finally:
        db.close()

    assert fila is not None
    assert fila.entidad_id is None
    assert correo not in (fila.detalle or "")


# ---------- política de contraseñas ----------


def _crear_usuario_con(client, admin_token, contrasena: str):
    return client.post(
        "/api/usuarios",
        json={
            "nombre": "Prueba",
            "apellido": "Clave",
            "correo": correo_unico("clave"),
            "contrasena": contrasena,
            "rol": "CAJERO",
        },
        headers=auth(admin_token),
    )


def test_contrasena_corta_es_rechazada(client, admin_token):
    assert _crear_usuario_con(client, admin_token, "Clave123!").status_code == 422


def test_contrasena_sin_numero_es_rechazada(client, admin_token):
    assert _crear_usuario_con(client, admin_token, "SoloLetras").status_code == 422


def test_contrasena_sin_letra_es_rechazada(client, admin_token):
    assert _crear_usuario_con(client, admin_token, "1234567890").status_code == 422


def test_contrasena_comun_es_rechazada(client, admin_token):
    assert _crear_usuario_con(client, admin_token, "password123").status_code == 422


def test_contrasena_valida_se_acepta(client, admin_token):
    assert _crear_usuario_con(client, admin_token, "ClaveSegura2026").status_code == 201


def test_registro_rechaza_contrasena_sin_numero(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "nombre": "Nuevo",
            "apellido": "Usuario",
            "correo": correo_unico("registro-debil"),
            "contrasena": "SoloLetras",
            "slug": SLUG_PRUEBAS,
        },
    )
    assert resp.status_code == 422


def test_cambio_contrasena_exige_la_politica(client, admin_token):
    correo = correo_unico("cambio")
    crear_usuario(client, admin_token, correo)
    token = _login(client, correo).json()["token"]

    resp = client.post(
        "/api/auth/cambiar-contrasena",
        json={"contrasena_actual": "Password123!", "contrasena_nueva": "Corta1"},
        headers=auth(token),
    )
    assert resp.status_code == 422
