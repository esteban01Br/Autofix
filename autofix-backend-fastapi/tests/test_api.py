"""Pruebas integrales de AutoFix API (FastAPI)."""

import uuid

from app.security import decode_token


def correo_unico(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}@correo.com"


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def crear_usuario(client, token, email, rol="CLIENTE", nombre="Ana"):
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": nombre,
            "apellido": "Perez",
            "correo": email,
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


def crear_vehiculo(client, token, cliente_id, placa=None):
    resp = client.post(
        "/api/vehiculos",
        json={
            "placa": placa or f"ABC{uuid.uuid4().hex[:4].upper()}",
            "marca": "Toyota",
            "modelo": "Corolla",
            "anio": 2020,
            "color": "Rojo",
            "kilometraje": 15000,
            "clienteId": cliente_id,
        },
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def crear_repuesto(client, token, nombre=None, precio="250.00", stock=10):
    resp = client.post(
        "/api/repuestos",
        json={
            "nombre": nombre or f"Filtro-{uuid.uuid4().hex[:6]}",
            "descripcion": "Repuesto de prueba",
            "stock": stock,
            "precio": precio,
        },
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def crear_orden(client, token, vehiculo_id):
    resp = client.post(
        "/api/ordenes",
        json={"vehiculoId": vehiculo_id, "diagnostico": "Cambio de aceite"},
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


# =========================================================
# AUTENTICACIÓN
# =========================================================

def test_registro_devuelve_token(client):
    email = correo_unico("registro")
    resp = client.post(
        "/api/auth/register",
        json={
            "nombre": "Nuevo",
            "apellido": "Usuario",
            "correo": email,
            "contrasena": "Password123!",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    payload = decode_token(data["token"])
    assert payload["sub"] == email
    assert payload["rol"] == "CLIENTE"
    assert payload["id"] > 0


def test_no_se_puede_autoregistrar_rol_admin(client):
    email = correo_unico("noadmin")
    resp = client.post(
        "/api/auth/register",
        json={
            "nombre": "Malicioso",
            "apellido": "Hacker",
            "correo": email,
            "contrasena": "Password123!",
            "rol": "ADMIN",
        },
    )
    assert resp.status_code == 201
    payload = decode_token(resp.json()["token"])
    # El rol solicitado se ignora: siempre CLIENTE.
    assert payload["rol"] == "CLIENTE"


def test_login_exitoso(client):
    email = correo_unico("login")
    client.post(
        "/api/auth/register",
        json={
            "nombre": "Login",
            "apellido": "Test",
            "correo": email,
            "contrasena": "Password123!",
            "rol": "CLIENTE",
        },
    )
    resp = client.post(
        "/api/auth/login", json={"correo": email, "contrasena": "Password123!"}
    )
    assert resp.status_code == 200
    assert "token" in resp.json()


def test_login_credenciales_incorrectas(client):
    email = correo_unico("mal")
    client.post(
        "/api/auth/register",
        json={
            "nombre": "Mal",
            "apellido": "Pass",
            "correo": email,
            "contrasena": "Password123!",
            "rol": "CLIENTE",
        },
    )
    resp = client.post(
        "/api/auth/login", json={"correo": email, "contrasena": "incorrecta"}
    )
    assert resp.status_code == 401
    assert "Credenciales incorrectas" in resp.json()["detail"]


def test_registro_correo_duplicado(client):
    email = correo_unico("dup")
    payload = {
        "nombre": "Dup",
        "apellido": "Test",
        "correo": email,
        "contrasena": "Password123!",
        "rol": "CLIENTE",
    }
    assert client.post("/api/auth/register", json=payload).status_code == 201
    assert client.post("/api/auth/register", json=payload).status_code == 409


def test_validacion_email_invalido(client):
    resp = client.post(
        "/api/auth/register",
        json={
            "nombre": "X",
            "apellido": "Y",
            "correo": "no-es-un-email",
            "contrasena": "Password123!",
            "rol": "CLIENTE",
        },
    )
    assert resp.status_code == 422


def test_perfil_usuario_autenticado(client, admin_token):
    resp = client.get("/api/auth/me", headers=auth(admin_token))
    assert resp.status_code == 200
    assert "contrasena" not in resp.json()
    assert resp.json()["correo"] == "admin@prueba.com"


def test_perfil_requiere_token(client):
    assert client.get("/api/auth/me").status_code == 401


# =========================================================
# PROTECCIÓN DE RUTAS Y ROLES
# =========================================================

def test_ruta_protegida_sin_token_devuelve_401(client):
    assert client.get("/api/vehiculos").status_code == 401


def test_usuario_sin_rol_admin_no_puede_escribir(client):
    token_admin = admin_token_o(client)
    email = correo_unico("mecanico")
    usuario_id = crear_usuario(client, token_admin, email, rol="MECANICO")
    cliente_id = crear_cliente(client, token_admin, usuario_id)

    token = client.post(
        "/api/auth/login", json={"correo": email, "contrasena": "Password123!"}
    ).json()["token"]

    resp = client.post(
        "/api/vehiculos",
        json={
            "placa": "OPQ999",
            "marca": "Nissan",
            "modelo": "Versa",
            "clienteId": cliente_id,
        },
        headers=auth(token),
    )
    assert resp.status_code == 403


def admin_token_o(client):
    # Token de un admin creado en esta sesión de prueba.
    resp = client.post(
        "/api/auth/login",
        json={"correo": "admin@prueba.com", "contrasena": "Password123!"},
    )
    assert resp.status_code == 200
    return resp.json()["token"]


def test_lectura_permitida_para_rol_user(client):
    email = correo_unico("lector")
    crear_usuario(client, admin_token_o(client), email, rol="CLIENTE")
    token = client.post(
        "/api/auth/login", json={"correo": email, "contrasena": "Password123!"}
    ).json()["token"]
    resp = client.get("/api/repuestos", headers=auth(token))
    assert resp.status_code == 200


# =========================================================
# CRUD COMPLETO
# =========================================================

def test_crud_usuario(client, admin_token):
    h = auth(admin_token)
    email = correo_unico("usuario")
    creado = client.post(
        "/api/usuarios",
        json={
            "nombre": "Carlos",
            "apellido": "Ruiz",
            "correo": email,
            "contrasena": "Password123!",
            "rol": "MECANICO",
        },
        headers=h,
    )
    assert creado.status_code == 201
    uid = creado.json()["id"]

    obtenido = client.get(f"/api/usuarios/{uid}", headers=h)
    assert obtenido.status_code == 200
    assert "contrasena" not in obtenido.json()

    actualizado = client.put(
        f"/api/usuarios/{uid}",
        json={"nombre": "Carlitos", "telefono": "3001234567"},
        headers=h,
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["nombre"] == "Carlitos"
    assert actualizado.json()["telefono"] == "3001234567"

    assert client.delete(f"/api/usuarios/{uid}", headers=h).status_code == 204


def test_crud_cliente_vehiculo(client, admin_token):
    h = auth(admin_token)
    uid = crear_usuario(client, admin_token, correo_unico("cliente"))
    cid = crear_cliente(client, admin_token, uid)
    vid = crear_vehiculo(client, admin_token, cid)

    lista = client.get("/api/clientes", headers=h)
    assert lista.status_code == 200
    assert any(c["id"] == cid for c in lista.json())

    detalle = client.get(f"/api/vehiculos/{vid}", headers=h)
    assert detalle.status_code == 200
    assert detalle.json()["clienteNombre"] == "Ana Perez"
    assert detalle.json()["clienteId"] == cid

    actualizado = client.put(
        f"/api/vehiculos/{vid}",
        json={"color": "Azul", "kilometraje": 16000},
        headers=h,
    )
    assert actualizado.status_code == 200
    assert actualizado.json()["color"] == "Azul"

    # No se puede eliminar un cliente duplicando su usuario (409).
    dup = client.post(
        "/api/clientes",
        json={"usuarioId": uid, "direccion": "Otra"},
        headers=h,
    )
    assert dup.status_code == 409

    # La placa única también se valida.
    placa_dup = detalle.json()["placa"]
    dup_placa = client.post(
        "/api/vehiculos",
        json={"placa": placa_dup, "marca": "M", "modelo": "M", "clienteId": cid},
        headers=h,
    )
    assert dup_placa.status_code == 409

    assert client.delete(f"/api/vehiculos/{vid}", headers=h).status_code == 204
    assert client.delete(f"/api/clientes/{cid}", headers=h).status_code == 204


def test_crud_mecanico_y_cita(client, admin_token):
    h = auth(admin_token)
    uid = crear_usuario(client, admin_token, correo_unico("mec"), rol="MECANICO")
    resp = client.post(
        "/api/mecanicos",
        json={"usuarioId": uid, "especialidad": "Motor"},
        headers=h,
    )
    assert resp.status_code == 201
    mid = resp.json()["id"]

    assert client.post(
        "/api/mecanicos",
        json={"usuarioId": uid, "especialidad": "Caja"},
        headers=h,
    ).status_code == 409

    # Cliente + vehículo para la cita.
    cuid = crear_usuario(client, admin_token, correo_unico("cita"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)

    cita = client.post(
        "/api/citas",
        json={
            "fecha": "2027-01-10",
            "hora": "09:30:00",
            "descripcion": "Revisión general",
            "vehiculoId": vid,
        },
        headers=h,
    )
    assert cita.status_code == 201, cita.text
    cita_id = cita.json()["id"]
    assert cita.json()["estado"] == "PENDIENTE"

    estado = client.patch(
        f"/api/citas/{cita_id}/estado",
        json={"estado": "CONFIRMADA"},
        headers=h,
    )
    assert estado.status_code == 200
    assert estado.json()["estado"] == "CONFIRMADA"

    filtradas = client.get(f"/api/citas?estado=CONFIRMADA", headers=h)
    assert all(c["estado"] == "CONFIRMADA" for c in filtradas.json())

    assert client.delete(f"/api/citas/{cita_id}", headers=h).status_code == 204
    assert client.delete(f"/api/mecanicos/{mid}", headers=h).status_code == 204


def test_orden_detalle_stock_y_factura(client, admin_token):
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("orden"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="250.00")
    oid = crear_orden(client, admin_token, vid)

    # Agregar repuesto descuenta stock.
    detalle = client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 3},
        headers=h,
    )
    assert detalle.status_code == 201, detalle.text
    assert detalle.json()["precioUnitario"] == "250.00"
    assert detalle.json()["subtotalLinea"] == "750.00"

    repuesto = client.get(f"/api/repuestos/{rid}", headers=h).json()
    assert repuesto["stock"] == 7

    # Stock insuficiente -> 400.
    sin_stock = client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 100},
        headers=h,
    )
    assert sin_stock.status_code == 400

    # Factura calcula subtotal, iva y total.
    factura = client.post(
        "/api/facturas",
        json={"ordenTrabajoId": oid},
        headers=h,
    )
    assert factura.status_code == 201, factura.text
    f = factura.json()
    assert f["subtotal"] == "750.00"
    assert f["iva"] == "142.50"
    assert f["total"] == "892.50"
    assert f["vehiculoPlaca"] is not None
    assert f["clienteNombre"] == "Ana Perez"

    # No se factura dos veces la misma orden.
    assert (
        client.post(
            "/api/facturas", json={"ordenTrabajoId": oid}, headers=h
        ).status_code
        == 409
    )

    # La orden ya no se puede eliminar por tener factura.
    assert client.delete(f"/api/ordenes/{oid}", headers=h).status_code == 409

    # Factura lista y con estado ENTREGADO por orden.
    entregada = client.patch(
        f"/api/ordenes/{oid}/estado", json={"estado": "ENTREGADO"}, headers=h
    )
    assert entregada.status_code == 200
    assert entregada.json()["fechaSalida"] is not None

    lista_facturas = client.get("/api/facturas", headers=h)
    assert any(x["id"] == f["id"] for x in lista_facturas.json())


def test_eliminar_detalle_devuelve_stock(client, admin_token):
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("dev"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=5, precio="100.00")
    oid = crear_orden(client, admin_token, vid)

    det = client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 2},
        headers=h,
    ).json()

    assert client.get(f"/api/repuestos/{rid}", headers=h).json()["stock"] == 3
    assert client.delete(f"/api/detalles/{det['id']}", headers=h).status_code == 204
    assert client.get(f"/api/repuestos/{rid}", headers=h).json()["stock"] == 5


# =========================================================
# FILTROS, ORDENAMIENTO Y PAGINACIÓN
# =========================================================

def test_paginacion_filtros_y_orden(client, admin_token):
    h = auth(admin_token)
    nombres = [f"Pastilla freno {i}" for i in range(5)]
    for i, n in enumerate(nombres):
        client.post(
            "/api/repuestos",
            json={"nombre": n, "stock": 10 - i, "precio": f"{100 + i}.00"},
            headers=h,
        )

    resp = client.get(
        "/api/repuestos?limit=2&offset=1&orden=precio&direccion=desc", headers=h
    )
    assert resp.status_code == 200
    assert len(resp.json()) == 2
    assert resp.headers.get("X-Total-Count") is not None

    # mayor precio primero con offset 1: precios desc = 104,103,102,101,100...
    precios = [float(r["precio"]) for r in resp.json()]
    assert precios[0] > precios[1]

    filtro = client.get(
        "/api/repuestos?busqueda=pastilla&stock_min=5", headers=h
    )
    assert filtro.status_code == 200
    assert all("pastilla" in r["nombre"].lower() for r in filtro.json())


# =========================================================
# CÓDIGO DE BARRAS DE REPUESTOS
# =========================================================

def test_repuesto_codigo_barras_flujo_completo(client, admin_token):
    h = auth(admin_token)

    # Crear un repuesto con código de barras
    resp = client.post(
        "/api/repuestos",
        json={
            "nombre": f"Bujía-{uuid.uuid4().hex[:6]}",
            "stock": 5,
            "precio": "45.00",
            "codigo_barras": "7501234567890",
        },
        headers=h,
    )
    assert resp.status_code == 201, resp.text
    rid = resp.json()["id"]
    assert resp.json()["codigo_barras"] == "7501234567890"

    # Buscar por código de barras exacto
    resp = client.get("/api/repuestos/por-codigo/7501234567890", headers=h)
    assert resp.status_code == 200
    assert resp.json()["id"] == rid

    # Código no registrado → 404
    resp = client.get("/api/repuestos/por-codigo/0000000000000", headers=h)
    assert resp.status_code == 404

    # No se permite duplicar el código de barras → 409
    resp = client.post(
        "/api/repuestos",
        json={
            "nombre": f"Otro-{uuid.uuid4().hex[:6]}",
            "stock": 1,
            "precio": "10.00",
            "codigo_barras": "7501234567890",
        },
        headers=h,
    )
    assert resp.status_code == 409

    # La búsqueda general también encuentra por código de barras
    resp = client.get("/api/repuestos?busqueda=7501234567890", headers=h)
    assert resp.status_code == 200
    assert any(r["id"] == rid for r in resp.json())


def test_orden_inexistente_404_y_metodo_no_permitido(client, admin_token):
    resp = client.get("/api/vehiculos/999999", headers=auth(admin_token))
    assert resp.status_code == 404


# =========================================================
# AJUSTE DE STOCK AL ACTUALIZAR DETALLE
# =========================================================

def test_actualizar_detalle_ajusta_stock(client, admin_token):
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("upd"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    r1 = crear_repuesto(client, admin_token, nombre="FiltroA", stock=10, precio="100.00")
    r2 = crear_repuesto(client, admin_token, nombre="FiltroB", stock=5, precio="200.00")
    oid = crear_orden(client, admin_token, vid)

    # Agregar filtro A × 2 → stock de A baja de 10 → 8
    det = client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": r1, "cantidad": 2},
        headers=h,
    ).json()
    assert client.get(f"/api/repuestos/{r1}", headers=h).json()["stock"] == 8

    # Actualizar cantidad de 2 → 4: stock de A baja de 8 → 6
    resp = client.put(
        f"/api/detalles/{det['id']}",
        json={"cantidad": 4},
        headers=h,
    )
    assert resp.status_code == 200
    assert client.get(f"/api/repuestos/{r1}", headers=h).json()["stock"] == 6

    # Cambiar repuesto A → B: A recupera 4, B baja de 5 → 1
    resp = client.put(
        f"/api/detalles/{det['id']}",
        json={"repuestoId": r2},
        headers=h,
    )
    assert resp.status_code == 200
    assert client.get(f"/api/repuestos/{r1}", headers=h).json()["stock"] == 10
    assert client.get(f"/api/repuestos/{r2}", headers=h).json()["stock"] == 1

    # Stock insuficiente al actualizar → 400.
    resp = client.put(
        f"/api/detalles/{det['id']}",
        json={"repuestoId": r1, "cantidad": 20},
        headers=h,
    )
    assert resp.status_code == 400
    assert client.get(f"/api/repuestos/{r1}", headers=h).json()["stock"] == 10