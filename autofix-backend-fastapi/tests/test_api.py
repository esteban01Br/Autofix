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


def test_factura_pdf(client, admin_token):
    """El PDF de la factura se genera con los datos del taller y del vehículo."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("pdf"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=3, precio="500.00")
    oid = crear_orden(client, admin_token, vid)
    client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 2},
        headers=h,
    )
    factura = client.post(
        "/api/facturas", json={"ordenTrabajoId": oid}, headers=h
    ).json()

    pdf = client.get(f"/api/facturas/{factura['id']}/pdf", headers=h)
    assert pdf.status_code == 200, pdf.text
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content[:5] == b"%PDF-"  # cabecera mágica del PDF
    assert len(pdf.content) > 500  # tiene contenido real
    assert f"{factura['numero']}.pdf" in pdf.headers["content-disposition"]


def test_reporte_ventas_mensuales(client, admin_token):
    """El reporte mensual devuelve una serie continua con el mes actual."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("mes"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="100.00")
    oid = crear_orden(client, admin_token, vid)
    client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 1},
        headers=h,
    )
    client.post("/api/facturas", json={"ordenTrabajoId": oid}, headers=h)

    resp = client.get("/api/reportes/ventas-mensuales?meses=6", headers=h)
    assert resp.status_code == 200
    serie = resp.json()
    assert len(serie) == 6  # una fila por mes, incluso sin facturas
    assert all({"mes", "facturas", "total"} <= set(f) for f in serie)
    # El último mes es el actual y al menos tiene la factura recién creada.
    assert serie[-1]["facturas"] >= 1
    assert serie[-1]["total"] > 0


def test_pagos_de_factura_parcial_y_pagada(client, admin_token):
    """Fase 3: los abonos actualizan PENDIENTE -> PARCIAL -> PAGADA."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("pago"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="250.00")
    oid = crear_orden(client, admin_token, vid)
    client.post(
        f"/api/detalles/orden/{oid}",
        json={"repuestoId": rid, "cantidad": 2},
        headers=h,
    )

    factura = client.post(
        "/api/facturas", json={"ordenTrabajoId": oid}, headers=h
    )
    assert factura.status_code == 201, factura.text
    fid = factura.json()["id"]
    assert factura.json()["estadoPago"] == "PENDIENTE"
    assert factura.json()["montoPagado"] == "0.00"
    assert factura.json()["saldo"] == "595.00"  # 500 + 19% IVA

    # Abono parcial -> PARCIAL.
    abono = client.post(
        f"/api/facturas/{fid}/pagos",
        json={"monto": "200.00", "metodo": "EFECTIVO"},
        headers=h,
    )
    assert abono.status_code == 201, abono.text
    assert abono.json()["monto"] == "200.00"
    assert abono.json()["usuarioNombre"] is not None

    f1 = client.get(f"/api/facturas/{fid}", headers=h).json()
    assert f1["estadoPago"] == "PARCIAL"
    assert f1["montoPagado"] == "200.00"
    assert f1["saldo"] == "395.00"

    # Un pago mayor que el saldo -> 409.
    excede = client.post(
        f"/api/facturas/{fid}/pagos",
        json={"monto": "999999.00", "metodo": "EFECTIVO"},
        headers=h,
    )
    assert excede.status_code == 409

    # Método de pago inválido -> 422.
    assert (
        client.post(
            f"/api/facturas/{fid}/pagos",
            json={"monto": "10.00", "metodo": "CHEQUE"},
            headers=h,
        ).status_code
        == 422
    )

    # Cubrir el saldo restante -> PAGADA.
    final = client.post(
        f"/api/facturas/{fid}/pagos",
        json={"monto": "395.00", "metodo": "TARJETA"},
        headers=h,
    )
    assert final.status_code == 201, final.text

    f2 = client.get(f"/api/facturas/{fid}", headers=h).json()
    assert f2["estadoPago"] == "PAGADA"
    assert f2["montoPagado"] == "595.00"
    assert f2["saldo"] == "0.00"

    # Historial con los dos pagos registrados.
    pagos = client.get(f"/api/facturas/{fid}/pagos", headers=h)
    assert pagos.status_code == 200
    assert len(pagos.json()) == 2


def test_catalogo_servicios_crud(client, admin_token):
    h = auth(admin_token)
    nombre = f"Diagnostico-{uuid.uuid4().hex[:6]}"

    # Crear servicio del catálogo.
    resp = client.post(
        "/api/servicios",
        json={
            "nombre": nombre,
            "descripcion": "Revisión general",
            "precio": "80.00",
            "duracion_minutos": 45,
        },
        headers=h,
    )
    assert resp.status_code == 201, resp.text
    sid = resp.json()["id"]
    assert resp.json()["precio"] == "80.00"
    assert resp.json()["duracionMinutos"] == 45
    assert resp.json()["activo"] is True

    # Nombre duplicado en la misma empresa -> 409.
    dup = client.post(
        "/api/servicios", json={"nombre": nombre, "precio": "90.00"}, headers=h
    )
    assert dup.status_code == 409

    # Listar y obtener.
    lista = client.get("/api/servicios", headers=h)
    assert lista.status_code == 200
    assert any(s["id"] == sid for s in lista.json())
    assert client.get(f"/api/servicios/{sid}", headers=h).status_code == 200

    # Actualizar precio y desactivar.
    act = client.put(
        f"/api/servicios/{sid}",
        json={"precio": "95.50", "activo": False},
        headers=h,
    )
    assert act.status_code == 200, act.text
    assert act.json()["precio"] == "95.50"
    assert act.json()["activo"] is False

    # solo_activos excluye el desactivado.
    activos = client.get("/api/servicios?solo_activos=true", headers=h)
    assert all(s["id"] != sid for s in activos.json())

    # Eliminar.
    assert client.delete(f"/api/servicios/{sid}", headers=h).status_code == 204
    assert client.get(f"/api/servicios/{sid}", headers=h).status_code == 404


def test_servicios_mutaciones_solo_gestion(client, admin_token):
    h = auth(admin_token)
    email = correo_unico("meca")
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": "Meca",
            "apellido": "Prueba",
            "correo": email,
            "contrasena": "Password123!",
            "rol": "MECANICO",
        },
        headers=h,
    )
    assert resp.status_code == 201, resp.text

    login = client.post(
        "/api/auth/login", json={"correo": email, "contrasena": "Password123!"}
    )
    assert login.status_code == 200
    hm = auth(login.json()["token"])

    # Un mecánico puede leer el catálogo...
    assert client.get("/api/servicios", headers=hm).status_code == 200
    # ...pero no crear, editar ni eliminar (solo ADMIN/GERENTE).
    assert (
        client.post(
            "/api/servicios", json={"nombre": "X", "precio": "10.00"}, headers=hm
        ).status_code
        == 403
    )
    assert (
        client.put("/api/servicios/1", json={"precio": "10.00"}, headers=hm).status_code
        == 403
    )
    assert client.delete("/api/servicios/1", headers=hm).status_code == 403


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

    # Acota a los repuestos de ESTE test: la BD de pruebas es compartida
    # entre tests, y otros tests crean repuestos con precios distintos.
    resp = client.get(
        "/api/repuestos?busqueda=pastilla&limit=2&offset=1&orden=precio&direccion=desc",
        headers=h,
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
# MULTIEMPRESA: registro, aislamiento y consecutivos
# =========================================================

def _registrar_empresa(client, nombre, correo_admin):
    resp = client.post(
        "/api/empresas/registro",
        json={
            "nombre_empresa": nombre,
            "nit": f"9{uuid.uuid4().int % 10**8:08d}-1",
            "nombre": "Dueño",
            "apellido": nombre,
            "correo": correo_admin,
            "contrasena": "Clave123!",
        },
    )
    assert resp.status_code == 201, resp.text
    datos = resp.json()
    assert datos["empresa"]["nombre"] == nombre
    assert datos["empresa"]["activa"] is True
    return datos["token"], datos["empresa"]["id"]


def test_registro_empresa_crea_admin_y_token(client):
    token, _ = _registrar_empresa(client, f"Taller-{uuid.uuid4().hex[:6]}", f"dueno-{uuid.uuid4().hex[:6]}@taller.com")

    # El token del dueño recién registrado funciona como ADMIN de su empresa
    resp = client.get("/api/empresas/actual", headers=auth(token))
    assert resp.status_code == 200
    assert resp.json()["nombre"].startswith("Taller-")

    # Y puede usar los endpoints operativos de su empresa
    resp = client.get("/api/repuestos", headers=auth(token))
    assert resp.status_code == 200
    assert resp.json() == []


def test_aislamiento_empresa_a_no_ve_datos_de_b(client):
    token_a, _ = _registrar_empresa(client, f"EmpresaA-{uuid.uuid4().hex[:6]}", f"a-{uuid.uuid4().hex[:6]}@a.com")
    token_b, _ = _registrar_empresa(client, f"EmpresaB-{uuid.uuid4().hex[:6]}", f"b-{uuid.uuid4().hex[:6]}@b.com")
    ha, hb = auth(token_a), auth(token_b)
    codigo = f"777{uuid.uuid4().int % 10**9:09d}"

    # A crea un repuesto con código de barras
    resp = client.post(
        "/api/repuestos",
        json={"nombre": f"FiltroA-{uuid.uuid4().hex[:6]}", "stock": 5, "precio": "100.00", "codigo_barras": codigo},
        headers=ha,
    )
    assert resp.status_code == 201, resp.text
    repuesto_a_id = resp.json()["id"]

    # B no lo ve en su lista, ni por id, ni por código de barras
    assert client.get("/api/repuestos", headers=hb).json() == []
    assert client.get(f"/api/repuestos/{repuesto_a_id}", headers=hb).status_code == 404
    assert client.get(f"/api/repuestos/por-codigo/{codigo}", headers=hb).status_code == 404

    # B SÍ puede registrar el mismo código de barras en SU empresa
    resp = client.post(
        "/api/repuestos",
        json={"nombre": f"FiltroB-{uuid.uuid4().hex[:6]}", "stock": 3, "precio": "90.00", "codigo_barras": codigo},
        headers=hb,
    )
    assert resp.status_code == 201, resp.text

    # B tampoco puede modificar ni borrar el repuesto de A
    assert client.put(f"/api/repuestos/{repuesto_a_id}", json={"stock": 99}, headers=hb).status_code == 404
    assert client.delete(f"/api/repuestos/{repuesto_a_id}", headers=hb).status_code == 404


def test_aislamiento_servicios_entre_empresas(client):
    token_a, _ = _registrar_empresa(client, f"TallerS-{uuid.uuid4().hex[:6]}", f"s-{uuid.uuid4().hex[:6]}@s.com")
    token_b, _ = _registrar_empresa(client, f"TallerT-{uuid.uuid4().hex[:6]}", f"t-{uuid.uuid4().hex[:6]}@t.com")
    ha, hb = auth(token_a), auth(token_b)
    nombre = f"Alineacion-{uuid.uuid4().hex[:6]}"

    # A crea un servicio en su catálogo
    resp = client.post(
        "/api/servicios", json={"nombre": nombre, "precio": "50.00"}, headers=ha
    )
    assert resp.status_code == 201, resp.text
    sid = resp.json()["id"]

    # B no lo ve en su lista ni por id, y no puede tocarlo
    assert all(s["id"] != sid for s in client.get("/api/servicios", headers=hb).json())
    assert client.get(f"/api/servicios/{sid}", headers=hb).status_code == 404
    assert client.put(f"/api/servicios/{sid}", json={"precio": "1.00"}, headers=hb).status_code == 404
    assert client.delete(f"/api/servicios/{sid}", headers=hb).status_code == 404

    # B sí puede crear un servicio con el mismo nombre en SU empresa
    resp = client.post(
        "/api/servicios", json={"nombre": nombre, "precio": "60.00"}, headers=hb
    )
    assert resp.status_code == 201, resp.text


def test_planes_publicos_del_portal(client):
    """El catálogo de planes es público (lo muestra el portal de ventas)."""
    resp = client.get("/api/suscripciones/planes")
    assert resp.status_code == 200
    planes = resp.json()
    assert len(planes) >= 3
    ids = {p["id"] for p in planes}
    assert {"BASICO", "PRO", "PREMIUM"} <= ids
    for p in planes:
        assert p["precioAnual"] > 0
        assert p["precioMensual"] > 0
        assert p["caracteristicas"]


def test_registro_con_plan_crea_slug_y_suscripcion(client):
    nombre = f"Taller SaaS-{uuid.uuid4().hex[:6]}"
    correo = f"saas-{uuid.uuid4().hex[:6]}@correo.com"
    resp = client.post(
        "/api/empresas/registro",
        json={
            "nombre_empresa": nombre,
            "plan": "PRO",
            "nombre": "Dueño",
            "apellido": "Prueba",
            "correo": correo,
            "contrasena": "Clave123!",
        },
    )
    assert resp.status_code == 201, resp.text
    datos = resp.json()
    slug = datos["empresa"]["slug"]
    assert slug and slug.startswith("taller-saas")

    # Branding público de la página de acceso (/acceso/{slug})
    pub = client.get(f"/api/empresas/publico/{slug}")
    assert pub.status_code == 200
    assert pub.json()["nombre"] == nombre
    # Solo datos públicos: nada de NIT, correos ni configuración interna.
    assert set(pub.json()) == {
        "slug",
        "nombre",
        "logo_url",
        "color_primario",
        "color_secundario",
    }

    # Slug inexistente → 404
    assert client.get("/api/empresas/publico/no-existe").status_code == 404

    # La suscripción creada queda vigente con el plan elegido (compra simulada)
    sub = client.get("/api/suscripciones/actual", headers=auth(datos["token"]))
    assert sub.status_code == 200
    assert sub.json()["plan"] == "PRO"
    assert sub.json()["vigente"] is True
    assert sub.json()["diasRestantes"] > 360

    # Login vinculado al slug: su slug funciona; el de otra empresa → 404
    ok = client.post(
        "/api/auth/login",
        json={"correo": correo, "contrasena": "Clave123!", "slug": slug},
    )
    assert ok.status_code == 200
    malo = client.post(
        "/api/auth/login",
        json={"correo": correo, "contrasena": "Clave123!", "slug": "otro-slug"},
    )
    assert malo.status_code == 404


def test_suscripcion_vencida_bloquea_login_y_superadmin_la_gestiona(
    client, superadmin_token
):
    nombre = f"Taller Vencido-{uuid.uuid4().hex[:6]}"
    correo = f"venc-{uuid.uuid4().hex[:6]}@correo.com"
    resp = client.post(
        "/api/empresas/registro",
        json={
            "nombre_empresa": nombre,
            "nombre": "Dueño",
            "apellido": "Prueba",
            "correo": correo,
            "contrasena": "Clave123!",
        },
    )
    assert resp.status_code == 201, resp.text
    eid = resp.json()["empresa"]["id"]

    # Login inicial: la suscripción recién creada está vigente.
    login = client.post(
        "/api/auth/login", json={"correo": correo, "contrasena": "Clave123!"}
    )
    assert login.status_code == 200

    # SUPERADMIN la marca como vencida (soporte).
    vencida = client.post(
        f"/api/suscripciones/empresas/{eid}",
        json={"fecha_fin": "2020-01-01T00:00:00"},
        headers=auth(superadmin_token),
    )
    assert vencida.status_code == 200, vencida.text
    assert vencida.json()["vigente"] is False

    # El login queda bloqueado con el código que entiende el portal.
    bloqueo = client.post(
        "/api/auth/login", json={"correo": correo, "contrasena": "Clave123!"}
    )
    assert bloqueo.status_code == 403
    assert bloqueo.json()["detail"]["codigo"] == "SUSCRIPCION_VENCIDA"

    # El superadmin renueva y el login vuelve a funcionar.
    renovada = client.post(
        f"/api/suscripciones/empresas/{eid}",
        json={"plan": "PRO", "dias": 365},
        headers=auth(superadmin_token),
    )
    assert renovada.status_code == 200
    assert renovada.json()["vigente"] is True
    assert renovada.json()["plan"] == "PRO"
    login2 = client.post(
        "/api/auth/login", json={"correo": correo, "contrasena": "Clave123!"}
    )
    assert login2.status_code == 200


def test_aislamiento_clientes_y_usuarios(client):
    token_a, _ = _registrar_empresa(client, f"TallerC-{uuid.uuid4().hex[:6]}", f"c-{uuid.uuid4().hex[:6]}@c.com")
    token_b, _ = _registrar_empresa(client, f"TallerD-{uuid.uuid4().hex[:6]}", f"d-{uuid.uuid4().hex[:6]}@d.com")
    ha, hb = auth(token_a), auth(token_b)

    # A crea un usuario CLIENTE en su empresa
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": "Cliente",
            "apellido": "DeA",
            "correo": f"cliente-{uuid.uuid4().hex[:6]}@correo.com",
            "contrasena": "Clave123!",
            "rol": "CLIENTE",
        },
        headers=ha,
    )
    assert resp.status_code == 201, resp.text
    usuario_a_id = resp.json()["id"]

    # B no ve ese usuario y no puede crearle un cliente a nombre de él
    usuarios_b = client.get("/api/usuarios", headers=hb).json()
    assert all(u["id"] != usuario_a_id for u in usuarios_b)
    resp = client.post("/api/clientes", json={"usuarioId": usuario_a_id}, headers=hb)
    assert resp.status_code == 404

    # Nadie puede crear un SUPERADMIN desde la API de empresa
    resp = client.post(
        "/api/usuarios",
        json={
            "nombre": "Intruso",
            "apellido": "X",
            "correo": f"intruso-{uuid.uuid4().hex[:6]}@correo.com",
            "contrasena": "Clave123!",
            "rol": "SUPERADMIN",
        },
        headers=ha,
    )
    assert resp.status_code in (403, 422)


def test_superadmin_ve_todas_las_empresas(client, superadmin_token):
    token_a, _ = _registrar_empresa(client, f"VisibleA-{uuid.uuid4().hex[:6]}", f"va-{uuid.uuid4().hex[:6]}@a.com")
    client.post(
        "/api/repuestos",
        json={"nombre": f"Global-{uuid.uuid4().hex[:6]}", "stock": 1, "precio": "10.00"},
        headers=auth(token_a),
    )

    # SUPERADMIN lista empresas y ve repuestos de todas
    empresas = client.get("/api/empresas", headers=auth(superadmin_token))
    assert empresas.status_code == 200
    assert len(empresas.json()) >= 2

    repuestos = client.get("/api/repuestos", headers=auth(superadmin_token)).json()
    assert any(r["nombre"].startswith("Global-") for r in repuestos)

    # Un ADMIN normal NO puede listar todas las empresas
    assert client.get("/api/empresas", headers=auth(token_a)).status_code == 403


def test_panel_superadmin_muestra_suscripcion(client, superadmin_token):
    """El listado de empresas (SUPERADMIN) incluye el resumen de suscripción."""
    # Empresa creada por registro: genera su suscripción (12 meses, BASICO).
    nombre = f"Taller Panel-{uuid.uuid4().hex[:6]}"
    correo = f"panel-{uuid.uuid4().hex[:6]}@correo.com"
    resp = client.post(
        "/api/empresas/registro",
        json={
            "nombre_empresa": nombre,
            "nombre": "Dueño",
            "apellido": "Panel",
            "correo": correo,
            "contrasena": "Clave123!",
        },
    )
    assert resp.status_code == 201, resp.text
    eid = resp.json()["empresa"]["id"]

    # En el listado: cada empresa trae el campo suscripcion (aunque sea None).
    empresas = client.get("/api/empresas", headers=auth(superadmin_token))
    assert empresas.status_code == 200
    data = empresas.json()
    assert all("suscripcion" in e for e in data)

    # La empresa recién registrada tiene su suscripción vigente poblada.
    creada = next(e for e in data if e["id"] == eid)
    assert creada["suscripcion"] is not None
    assert creada["suscripcion"]["plan"] == "BASICO"
    assert creada["suscripcion"]["vigente"] is True

    # Gestión del SUPERADMIN: cambiar plan y días sobre esa empresa.
    gestionada = client.post(
        f"/api/suscripciones/empresas/{eid}",
        json={"plan": "PRO", "dias": 30},
        headers=auth(superadmin_token),
    )
    assert gestionada.status_code in (200, 201), gestionada.text
    assert gestionada.json()["plan"] == "PRO"
    assert gestionada.json()["diasRestantes"] >= 29

    # Refrescando el listado, el resumen refleja el cambio de plan.
    refrescado = client.get("/api/empresas", headers=auth(superadmin_token)).json()
    actualizada = next(e for e in refrescado if e["id"] == eid)
    assert actualizada["suscripcion"]["plan"] == "PRO"


def test_consecutivo_factura_es_por_empresa(client):
    token_a, _ = _registrar_empresa(client, f"FacA-{uuid.uuid4().hex[:6]}", f"fa-{uuid.uuid4().hex[:6]}@a.com")
    token_b, _ = _registrar_empresa(client, f"FacB-{uuid.uuid4().hex[:6]}", f"fb-{uuid.uuid4().hex[:6]}@b.com")

    def facturar(token):
        h = auth(token)
        cuid = crear_usuario(client, token, correo_unico("fac"))
        cid = crear_cliente(client, token, cuid)
        vid = crear_vehiculo(client, token, cid)
        rid = crear_repuesto(client, token, stock=5, precio="100.00")
        oid = crear_orden(client, token, vid)
        client.post(f"/api/detalles/orden/{oid}", json={"repuestoId": rid, "cantidad": 1}, headers=h)
        resp = client.post("/api/facturas", json={"ordenTrabajoId": oid}, headers=h)
        assert resp.status_code == 201, resp.text
        return resp.json()["numero"]

    # Cada empresa arranca su propio consecutivo en FAC-0001
    assert facturar(token_a) == "FAC-0001"
    assert facturar(token_b) == "FAC-0001"
    # Y el siguiente de A es FAC-0002 (no se contamina con B)
    assert facturar(token_a) == "FAC-0002"


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