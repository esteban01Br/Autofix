"""Pruebas de la funcionalidad de Proveedores (Fase 3)."""

from tests.test_api import auth, crear_repuesto, crear_usuario, correo_unico


def _token_rol(client, admin_token, rol: str) -> str:
    """Crea un usuario con el rol dado y devuelve su token de sesión."""
    correo = correo_unico(rol.lower())
    crear_usuario(client, admin_token, correo, rol=rol)
    login = client.post(
        "/api/auth/login",
        json={"correo": correo, "contrasena": "Password123!"},
    )
    assert login.status_code == 200, login.text
    return login.json()["token"]


def crear_proveedor(client, token, nombre=None, **extra):
    payload = {"nombre": nombre or f"Proveedor-{correo_unico('p')[:6]}", **extra}
    resp = client.post("/api/proveedores", json=payload, headers=auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_crud_proveedor(client, admin_token):
    """Crear, listar, obtener, actualizar y eliminar un proveedor."""
    h = auth(admin_token)

    p = crear_proveedor(
        client,
        admin_token,
        nombre="Repuestos del Norte",
        nit="900123456-1",
        contacto="Carlos López",
        telefono="3001234567",
        correo="ventas@norte.com",
    )
    assert p["nombre"] == "Repuestos del Norte"
    assert p["activo"] is True
    assert p["repuestosAsociados"] == 0

    # Aparece en el listado.
    lista = client.get("/api/proveedores", headers=h)
    assert lista.status_code == 200
    assert any(x["id"] == p["id"] for x in lista.json())
    assert lista.headers.get("X-Total-Count") is not None

    # Obtener por id.
    obtenido = client.get(f"/api/proveedores/{p['id']}", headers=h)
    assert obtenido.status_code == 200
    assert obtenido.json()["nit"] == "900123456-1"

    # Actualizar.
    actualizado = client.put(
        f"/api/proveedores/{p['id']}",
        json={"contacto": "María Gómez", "activo": False},
        headers=h,
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["contacto"] == "María Gómez"
    assert actualizado.json()["activo"] is False

    # Eliminar (sin repuestos asociados) -> 204.
    assert client.delete(f"/api/proveedores/{p['id']}", headers=h).status_code == 204
    assert client.get(f"/api/proveedores/{p['id']}", headers=h).status_code == 404


def test_proveedor_nombre_duplicado(client, admin_token):
    """No se permiten dos proveedores con el mismo nombre (case-insensitive)."""
    h = auth(admin_token)
    crear_proveedor(client, admin_token, nombre="Frenos Express")

    duplicado = client.post(
        "/api/proveedores",
        json={"nombre": "frenos express"},
        headers=h,
    )
    assert duplicado.status_code == 409


def test_proveedor_con_repuestos_no_se_elimina(client, admin_token):
    """Un proveedor con repuestos asociados se desactiva, no se elimina."""
    h = auth(admin_token)
    p = crear_proveedor(client, admin_token, nombre="Distribuidora Sur")
    rid = crear_repuesto(
        client, admin_token, nombre=f"Pastilla-{p['id']}", stock=5, precio="50.00"
    )

    # Asignar el proveedor al repuesto.
    actualizado = client.put(
        f"/api/repuestos/{rid}",
        json={"proveedorId": p["id"]},
        headers=h,
    )
    assert actualizado.status_code == 200, actualizado.text
    assert actualizado.json()["proveedorId"] == p["id"]
    assert actualizado.json()["proveedorNombre"] == "Distribuidora Sur"

    # El proveedor ahora cuenta 1 repuesto asociado.
    obtenido = client.get(f"/api/proveedores/{p['id']}", headers=h).json()
    assert obtenido["repuestosAsociados"] == 1

    # Eliminar -> 409 (pide desactivar).
    resp = client.delete(f"/api/proveedores/{p['id']}", headers=h)
    assert resp.status_code == 409
    assert "desactiv" in resp.json()["detail"].lower()

    # Desactivar funciona.
    desactivado = client.put(
        f"/api/proveedores/{p['id']}", json={"activo": False}, headers=h
    )
    assert desactivado.status_code == 200
    assert desactivado.json()["activo"] is False


def test_repuesto_con_proveedor_invalido(client, admin_token):
    """Asignar un proveedor inexistente o de otra empresa responde 404."""
    h = auth(admin_token)
    rid = crear_repuesto(client, admin_token, nombre=f"FiltroX-{correo_unico('f')[:6]}")

    inexistente = client.put(
        f"/api/repuestos/{rid}", json={"proveedorId": 999999}, headers=h
    )
    assert inexistente.status_code == 404


def test_proveedor_permisos(client, admin_token):
    """ASESOR/MECANICO no gestionan proveedores; GERENTE sí."""
    token_asesor = _token_rol(client, admin_token, "ASESOR")
    resp = client.post(
        "/api/proveedores",
        json={"nombre": "No autorizado"},
        headers=auth(token_asesor),
    )
    assert resp.status_code == 403

    token_mec = _token_rol(client, admin_token, "MECANICO")
    assert client.delete(
        "/api/proveedores/1", headers=auth(token_mec)
    ).status_code == 403

    # GERENTE sí crea.
    token_ger = _token_rol(client, admin_token, "GERENTE")
    creado = client.post(
        "/api/proveedores",
        json={"nombre": "Gerente Proveeduría"},
        headers=auth(token_ger),
    )
    assert creado.status_code == 201, creado.text
