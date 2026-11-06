"""Pruebas de la exportación de datos (CSV/ZIP) por empresa."""

import io
import uuid
import zipfile

from sqlalchemy import select

SLUG_PRUEBAS = "autofix-pruebas"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def correo_unico(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@correo.com"


def crear_usuario(client, token, correo, rol="CLIENTE", nombre="Ana"):
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": nombre,
            "apellido": "Perez",
            "correo": correo,
            "contrasena": "Password123!",
            "rol": rol,
        },
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def crear_cliente(client, token, usuario_id, direccion="Calle 123"):
    resp = client.post(
        "/api/clientes",
        json={"usuarioId": usuario_id, "direccion": direccion},
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_exportar_clientes_admin_incluye_bom_encabezados_y_escapa_formulas(
    client, admin_token
):
    usuario_id = crear_usuario(
        client, admin_token, correo_unico("exporta"), nombre="=1+1"
    )
    crear_cliente(client, admin_token, usuario_id)

    resp = client.get("/api/exportar/clientes", headers=auth(admin_token))
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"].startswith("text/csv")
    assert "autofix_clientes_" in resp.headers["content-disposition"]

    # BOM UTF-8 para que Excel reconozca los acentos.
    assert resp.content.startswith(b"\xef\xbb\xbf")
    texto = resp.content.decode("utf-8-sig")
    primera_linea = texto.splitlines()[0]
    assert primera_linea.startswith("ID;Nombre;Apellido;Correo")
    # Fórmula neutralizada con apóstrofo.
    assert "'=1+1" in texto
    # Nunca se exportan contraseñas ni hashes.
    assert "contrasena" not in texto.lower()
    assert "$2b$" not in texto


def test_exportar_sin_token_devuelve_401(client):
    assert client.get("/api/exportar/clientes").status_code == 401


def test_exportar_con_rol_no_admin_devuelve_403(client):
    correo = correo_unico("cliente")
    resp = client.post(
        "/api/auth/register",
        json={
            "nombre": "Cliente",
            "apellido": "Normal",
            "correo": correo,
            "contrasena": "Password123!",
            "slug": SLUG_PRUEBAS,
        },
    )
    assert resp.status_code == 201, resp.text
    token_cliente = resp.json()["token"]

    assert (
        client.get("/api/exportar/clientes", headers=auth(token_cliente)).status_code
        == 403
    )


def test_exportar_entidad_inexistente_devuelve_404(client, admin_token):
    resp = client.get("/api/exportar/empleados", headers=auth(admin_token))
    assert resp.status_code == 404


def test_admin_no_exporta_datos_de_otra_empresa(client, admin_token):
    # Empresa B con su propio ADMIN.
    sufijo = uuid.uuid4().hex[:8]
    correo_b = correo_unico("admin-b")
    resp = client.post(
        "/api/empresas/registro",
        json={
            "nombre_empresa": f"Taller B {sufijo}",
            "nombre": "Admin",
            "apellido": "B",
            "correo": correo_b,
            "contrasena": "Password123!",
            "acepto_terminos": True,
        },
    )
    assert resp.status_code == 201, resp.text
    token_b = resp.json()["token"]

    usuario_b = crear_usuario(client, token_b, correo_unico("cliente-b"), nombre="ClienteB")
    crear_cliente(client, token_b, usuario_b)

    # El CSV de B sí trae su fila.
    csv_b = client.get("/api/exportar/clientes", headers=auth(token_b))
    assert csv_b.status_code == 200
    assert "ClienteB" in csv_b.text

    # El CSV de A no debe incluir los clientes de B.
    csv_a = client.get("/api/exportar/clientes", headers=auth(admin_token))
    assert csv_a.status_code == 200
    assert "ClienteB" not in csv_a.text


def test_exportar_registra_auditoria(client, admin_token):
    from app.database import SessionLocal
    from app.models.auditoria import Auditoria

    assert (
        client.get("/api/exportar/repuestos", headers=auth(admin_token)).status_code
        == 200
    )

    db = SessionLocal()
    try:
        registros = db.scalars(
            select(Auditoria).where(Auditoria.accion == "EXPORTAR_DATOS")
        ).all()
    finally:
        db.close()
    assert any(r.entidad == "repuestos" for r in registros)


def test_exportar_todo_devuelve_zip_con_csv(client, admin_token):
    resp = client.get("/api/exportar/todo", headers=auth(admin_token))
    assert resp.status_code == 200, resp.text
    assert resp.headers["content-type"] == "application/zip"
    assert "autofix_datos_" in resp.headers["content-disposition"]

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        nombres = set(zf.namelist())
        entidades = {
            "clientes",
            "vehiculos",
            "citas",
            "ordenes",
            "repuestos",
            "facturas",
        }
        for entidad in entidades:
            assert any(nombre.startswith(f"autofix_{entidad}_") for nombre in nombres)


def crear_vehiculo(client, token, cliente_id, placa=None):
    resp = client.post(
        "/api/vehiculos",
        json={
            "placa": placa or f"ABC{uuid.uuid4().hex[:4].upper()}",
            "marca": "Toyota",
            "modelo": "Corolla",
            "anio": 2020,
            "clienteId": cliente_id,
        },
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def test_exportar_citas_filtra_por_rango_de_fechas(client, admin_token):
    from datetime import date, timedelta

    usuario_id = crear_usuario(client, admin_token, correo_unico("cita"), nombre="Cita")
    cliente_id = crear_cliente(client, admin_token, usuario_id)
    vehiculo_id = crear_vehiculo(client, admin_token, cliente_id)
    fecha = date.today() + timedelta(days=3)
    resp = client.post(
        "/api/citas",
        json={"vehiculoId": vehiculo_id, "fecha": fecha.isoformat(), "hora": "10:00"},
        headers=auth(admin_token),
    )
    assert resp.status_code == 201, resp.text

    exportacion = client.get(
        "/api/exportar/citas",
        params={"desde": fecha.isoformat()},
        headers=auth(admin_token),
    )
    assert exportacion.status_code == 200
    assert fecha.isoformat() in exportacion.text

    sin_rango = client.get("/api/exportar/citas", headers=auth(admin_token))
    assert sin_rango.status_code == 200
