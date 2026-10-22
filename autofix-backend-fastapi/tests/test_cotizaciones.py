"""Pruebas de la funcionalidad de Cotizaciones (Fase 3)."""

import uuid

from tests.test_api import (
    auth,
    crear_cliente,
    crear_repuesto,
    crear_usuario,
    crear_vehiculo,
    correo_unico,
)


def crear_servicio(client, token, nombre=None, precio="150.00"):
    resp = client.post(
        "/api/servicios",
        json={
            "nombre": nombre or f"Servicio-{uuid.uuid4().hex[:6]}",
            "precio": precio,
            "duracion_minutos": 60,
        },
        headers=auth(token),
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]


def crear_cotizacion(client, token, vid, lineas, **extra):
    payload = {"vehiculoId": vid, "detalles": lineas, **extra}
    resp = client.post("/api/cotizaciones", json=payload, headers=auth(token))
    assert resp.status_code == 201, resp.text
    return resp.json()


def test_cotizacion_calcula_totales_y_consecutivo(client, admin_token):
    """Las líneas de repuesto/servicio calculan subtotal, IVA y total."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("cot"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="250.00")
    sid = crear_servicio(client, admin_token, precio="150.00")

    cot = crear_cotizacion(
        client,
        admin_token,
        vid,
        [
            {"repuestoId": rid, "cantidad": 2},   # 500.00
            {"servicioId": sid, "cantidad": 1},   # 150.00
        ],
        observaciones="Cambio de kit de embrague",
    )

    assert cot["numero"].startswith("COT-")
    assert cot["estado"] == "BORRADOR"
    # subtotal 650.00, iva 19% = 123.50, total 773.50
    assert cot["subtotal"] == "650.00"
    assert cot["iva"] == "123.50"
    assert cot["total"] == "773.50"
    assert len(cot["detalles"]) == 2
    assert cot["vehiculoPlaca"] is not None

    # Una cotización NO descuenta stock (solo la orden lo hace).
    repuesto = client.get(f"/api/repuestos/{rid}", headers=h).json()
    assert repuesto["stock"] == 10

    # El consecutivo avanza.
    cot2 = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid}])
    assert cot2["numero"] != cot["numero"]

    # Aparece en el listado.
    lista = client.get("/api/cotizaciones", headers=h)
    assert lista.status_code == 200
    assert any(x["id"] == cot["id"] for x in lista.json())


def test_cotizacion_concepto_libre_requiere_precio(client, admin_token):
    """Una línea de concepto libre lleva precioUnitario explícito."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("cotlibre"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)

    # Sin precio -> 422 (validación del esquema).
    malo = client.post(
        "/api/cotizaciones",
        json={"vehiculoId": vid, "detalles": [{"concepto": "Alineación"}]},
        headers=h,
    )
    assert malo.status_code == 422

    # Con precio -> 201.
    cot = crear_cotizacion(
        client,
        admin_token,
        vid,
        [{"concepto": "Alineación y balanceo", "precioUnitario": "80.00", "cantidad": 1}],
    )
    assert cot["subtotal"] == "80.00"
    assert cot["detalles"][0]["concepto"] == "Alineación y balanceo"


def test_cotizacion_linea_invalida(client, admin_token):
    """Cada línea debe tener exactamente una fuente (repuesto/servicio/concepto)."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("cotinv"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token)

    # Dos fuentes a la vez -> 422.
    doble = client.post(
        "/api/cotizaciones",
        json={"vehiculoId": vid, "detalles": [{"repuestoId": rid, "concepto": "x"}]},
        headers=h,
    )
    assert doble.status_code == 422

    # Sin fuentes -> 422.
    vacio = client.post(
        "/api/cotizaciones",
        json={"vehiculoId": vid, "detalles": [{}]},
        headers=h,
    )
    assert vacio.status_code == 422


def test_ciclo_vida_cotizacion_y_conversion_a_orden(client, admin_token):
    """BORRADOR -> ENVIADA -> APROBADA -> convertir en orden (descuenta stock)."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("ciclo"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="250.00")
    sid = crear_servicio(client, admin_token, precio="150.00")

    cot = crear_cotizacion(
        client,
        admin_token,
        vid,
        [
            {"repuestoId": rid, "cantidad": 3},
            {"servicioId": sid, "cantidad": 1},
        ],
    )
    cid_cot = cot["id"]

    # Transición inválida directa BORRADOR -> APROBADA -> 409.
    malo = client.patch(
        f"/api/cotizaciones/{cid_cot}/estado",
        json={"estado": "APROBADA"},
        headers=h,
    )
    assert malo.status_code == 409

    # Enviar.
    enviada = client.patch(
        f"/api/cotizaciones/{cid_cot}/estado",
        json={"estado": "ENVIADA"},
        headers=h,
    )
    assert enviada.status_code == 200
    assert enviada.json()["estado"] == "ENVIADA"

    # Aprobar.
    aprobada = client.patch(
        f"/api/cotizaciones/{cid_cot}/estado",
        json={"estado": "APROBADA"},
        headers=h,
    )
    assert aprobada.status_code == 200
    assert aprobada.json()["estado"] == "APROBADA"

    # Convertir en orden de trabajo.
    orden_resp = client.post(
        f"/api/cotizaciones/{cid_cot}/convertir", headers=h
    )
    assert orden_resp.status_code == 201, orden_resp.text
    orden = orden_resp.json()

    # La orden tiene los repuestos como detalle y descontó stock.
    detalles = orden["detalles"]
    assert len(detalles) == 1
    assert detalles[0]["repuestoId"] == rid
    assert detalles[0]["cantidad"] == 3
    repuesto = client.get(f"/api/repuestos/{rid}", headers=h).json()
    assert repuesto["stock"] == 7

    # El servicio quedó como observación de la orden.
    assert orden["observaciones"] is not None
    assert "150" not in orden["observaciones"]  # no es el precio, es el nombre

    # La cotización apunta a la orden y no se puede convertir de nuevo.
    cot_actualizada = client.get(f"/api/cotizaciones/{cid_cot}", headers=h).json()
    assert cot_actualizada["ordenTrabajoId"] == orden["id"]
    twice = client.post(f"/api/cotizaciones/{cid_cot}/convertir", headers=h)
    assert twice.status_code == 409


def test_cotizacion_convertir_requiere_aprobada_y_stock(client, admin_token):
    """Convertir exige APROBADA y stock suficiente de repuestos."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("conv"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=2, precio="100.00")

    # BORRADOR: no se puede convertir.
    cot = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid, "cantidad": 1}])
    no_borrador = client.post(f"/api/cotizaciones/{cot['id']}/convertir", headers=h)
    assert no_borrador.status_code == 409

    # Stock insuficiente -> 400 (aunque esté aprobada).
    client.patch(
        f"/api/cotizaciones/{cot['id']}/estado", json={"estado": "ENVIADA"}, headers=h
    )
    client.patch(
        f"/api/cotizaciones/{cot['id']}/estado", json={"estado": "APROBADA"}, headers=h
    )
    cot_gde = crear_cotizacion(
        client, admin_token, vid, [{"repuestoId": rid, "cantidad": 50}]
    )
    client.patch(
        f"/api/cotizaciones/{cot_gde['id']}/estado",
        json={"estado": "ENVIADA"},
        headers=h,
    )
    client.patch(
        f"/api/cotizaciones/{cot_gde['id']}/estado",
        json={"estado": "APROBADA"},
        headers=h,
    )
    sin_stock = client.post(f"/api/cotizaciones/{cot_gde['id']}/convertir", headers=h)
    assert sin_stock.status_code == 400


def test_editar_cotizacion_borrador(client, admin_token):
    """Solo se editan borradores; recalcular totales al cambiar líneas."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("edit"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=10, precio="100.00")

    cot = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid, "cantidad": 1}])
    assert cot["subtotal"] == "100.00"

    # Editar borrador: cambiar cantidad recalcula.
    editada = client.put(
        f"/api/cotizaciones/{cot['id']}",
        json={"detalles": [{"repuestoId": rid, "cantidad": 4}]},
        headers=h,
    )
    assert editada.status_code == 200
    assert editada.json()["subtotal"] == "400.00"

    # Enviar y probar que ya no se edita.
    client.patch(
        f"/api/cotizaciones/{cot['id']}/estado", json={"estado": "ENVIADA"}, headers=h
    )
    bloqueada = client.put(
        f"/api/cotizaciones/{cot['id']}",
        json={"detalles": [{"repuestoId": rid, "cantidad": 1}]},
        headers=h,
    )
    assert bloqueada.status_code == 409


def test_eliminar_cotizacion(client, admin_token):
    """Se eliminan borradores y rechazadas; no aprobadas con orden."""
    h = auth(admin_token)
    cuid = crear_usuario(client, admin_token, correo_unico("del"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token, stock=5)

    # Borrador: se puede eliminar.
    cot = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid}])
    assert client.delete(f"/api/cotizaciones/{cot['id']}", headers=h).status_code == 204
    assert client.get(f"/api/cotizaciones/{cot['id']}", headers=h).status_code == 404

    # Enviada: no se puede eliminar.
    cot2 = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid}])
    client.patch(
        f"/api/cotizaciones/{cot2['id']}/estado", json={"estado": "ENVIADA"}, headers=h
    )
    assert client.delete(f"/api/cotizaciones/{cot2['id']}", headers=h).status_code == 409

    # Rechazada: sí se puede eliminar.
    client.patch(
        f"/api/cotizaciones/{cot2['id']}/estado",
        json={"estado": "RECHAZADA"},
        headers=h,
    )
    assert client.delete(f"/api/cotizaciones/{cot2['id']}", headers=h).status_code == 204


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


def test_cotizacion_permisos(client, admin_token):
    """ASESOR/MECANICO no gestionan cotizaciones; GERENTE/CAJERO según rol."""
    # ASESOR: sin permiso de gestión (crear) -> 403.
    token_asesor = _token_rol(client, admin_token, "ASESOR")
    h_asesor = auth(token_asesor)

    cuid = crear_usuario(client, admin_token, correo_unico("perm"))
    cid = crear_cliente(client, admin_token, cuid)
    vid = crear_vehiculo(client, admin_token, cid)
    rid = crear_repuesto(client, admin_token)

    resp = client.post(
        "/api/cotizaciones",
        json={"vehiculoId": vid, "detalles": [{"repuestoId": rid}]},
        headers=h_asesor,
    )
    assert resp.status_code == 403

    # MECANICO: tampoco gestiona cotizaciones -> 403 al cambiar estado.
    token_mec = _token_rol(client, admin_token, "MECANICO")
    cot = crear_cotizacion(client, admin_token, vid, [{"repuestoId": rid}])
    cambio = client.patch(
        f"/api/cotizaciones/{cot['id']}/estado",
        json={"estado": "ENVIADA"},
        headers=auth(token_mec),
    )
    assert cambio.status_code == 403

    # GERENTE: sí gestiona (crear + transiciones) -> 201/200.
    token_ger = _token_rol(client, admin_token, "GERENTE")
    h_ger = auth(token_ger)
    cot_ger = client.post(
        "/api/cotizaciones",
        json={"vehiculoId": vid, "detalles": [{"repuestoId": rid}]},
        headers=h_ger,
    )
    assert cot_ger.status_code == 201, cot_ger.text
    env = client.patch(
        f"/api/cotizaciones/{cot_ger.json()['id']}/estado",
        json={"estado": "ENVIADA"},
        headers=h_ger,
    )
    assert env.status_code == 200
