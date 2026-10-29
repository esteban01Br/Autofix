"""Siembra datos demo realistas a través de la API de AutoFix.

Por defecto apunta a producción (Render). Para sembrar el backend local:
    $env:AUTOFIX_API = "http://localhost:8081"
    .venv\\Scripts\\python.exe sembrar_datos.py

Uso (desde autofix-backend-fastapi):
    .venv\\Scripts\\python.exe sembrar_datos.py

Es idempotente: reutiliza usuarios, clientes, vehículos, repuestos, etc.
que ya existan (comparando por correo, placa, nombre o código).
"""

from __future__ import annotations

import os
import sys
import time
from datetime import date, timedelta
from decimal import Decimal

import httpx

BASE = os.environ.get("AUTOFIX_API", "https://autofix-api-tm6d.onrender.com").rstrip("/")
ADMIN_CORREO = os.environ.get("AUTOFIX_ADMIN_EMAIL", "admin@autofix.com")
ADMIN_CLAVE = os.environ.get("AUTOFIX_ADMIN_PASSWORD", "Admin123!")
CLAVE_EMPLEADOS = "Demo123!"
CLAVE_CLIENTES = "Cliente123!"

cliente_http = httpx.Client(base_url=BASE, timeout=90.0)


def pedir(metodo: str, ruta: str, **kwargs):
    """Petición con reintentos simples para tolerar el arranque de Render."""
    ultimo_error = None
    for intento in range(3):
        try:
            respuesta = cliente_http.request(metodo, ruta, **kwargs)
            if respuesta.status_code >= 400:
                raise RuntimeError(
                    f"{metodo} {ruta} -> {respuesta.status_code}: {respuesta.text[:400]}"
                )
            if respuesta.status_code == 204 or not respuesta.content:
                return None
            return respuesta.json()
        except (httpx.TransportError, RuntimeError) as error:
            ultimo_error = error
            if isinstance(error, RuntimeError):
                raise
            time.sleep(3)
    raise RuntimeError(f"Sin conexión con {BASE}: {ultimo_error}")


def main() -> None:
    print(f"Conectando con {BASE} ...")
    sesion = pedir(
        "POST", "/api/auth/login", json={"correo": ADMIN_CORREO, "contrasena": ADMIN_CLAVE}
    )
    token = sesion["token"]
    cliente_http.headers.update({"Authorization": f"Bearer {token}"})
    print("Sesión de administrador iniciada.\n")

    # ------------------------------------------------------------------
    # Usuarios internos
    # ------------------------------------------------------------------
    usuarios = {u["correo"]: u for u in pedir("GET", "/api/usuarios")}

    def asegurar_usuario(nombre, apellido, correo, rol, telefono=None, clave=None):
        if correo in usuarios:
            return usuarios[correo]
        creado = pedir(
            "POST",
            "/api/usuarios",
            json={
                "nombre": nombre,
                "apellido": apellido,
                "correo": correo,
                "contrasena": clave or CLAVE_EMPLEADOS,
                "telefono": telefono,
                "rol": rol,
            },
        )
        usuarios[correo] = creado
        print(f"  Usuario {rol}: {correo}")
        return creado

    carlos = asegurar_usuario("Carlos", "Ramírez", "carlos@autofix.com", "MECANICO", "3001112233")
    andrea = asegurar_usuario("Andrea", "López", "andrea@autofix.com", "MECANICO", "3002223344")
    asegurar_usuario("Julián", "Martínez", "julian@autofix.com", "ASESOR", "3003334455")
    asegurar_usuario("Sofía", "García", "sofia@autofix.com", "BODEGUERO", "3004445566")
    asegurar_usuario("Pedro", "Castaño", "pedro@autofix.com", "CAJERO", "3005556677")

    # ------------------------------------------------------------------
    # Mecánicos
    # ------------------------------------------------------------------
    mecanicos = pedir("GET", "/api/mecanicos")
    mecanicos_por_usuario = {m["usuario"]["id"]: m for m in mecanicos}
    for usuario, especialidad in (
        (carlos, "Motor y frenos"),
        (andrea, "Suspensión y sistema eléctrico"),
    ):
        if usuario["id"] in mecanicos_por_usuario:
            continue
        creado = pedir(
            "POST",
            "/api/mecanicos",
            json={"usuarioId": usuario["id"], "especialidad": especialidad},
        )
        mecanicos_por_usuario[usuario["id"]] = creado
        print(f"  Mecánico: {usuario['nombre']} {usuario['apellido']}")
    ids_mecanicos = [m["id"] for m in mecanicos_por_usuario.values()]

    # ------------------------------------------------------------------
    # Proveedores
    # ------------------------------------------------------------------
    proveedores = {p["nombre"]: p for p in pedir("GET", "/api/proveedores")}
    datos_proveedores = [
        ("Autopartes del Norte", "900123456-1", "Pedro Gómez", "3001234567", "pedro@autopartes.com", "Calle 10 #5-20"),
        ("Repuestos Express", "900987654-2", "María Díaz", "3009876543", "maria@repuestos.com", "Carrera 15 #30-45"),
        ("Distribuidora Motor Andino", "901555888-3", "Jorge Salazar", "3007654321", "ventas@motorandino.com", "Avenida 68 #22-10"),
    ]
    for nombre, nit, contacto, telefono, correo, direccion in datos_proveedores:
        if nombre in proveedores:
            continue
        proveedores[nombre] = pedir(
            "POST",
            "/api/proveedores",
            json={
                "nombre": nombre,
                "nit": nit,
                "contacto": contacto,
                "telefono": telefono,
                "correo": correo,
                "direccion": direccion,
                "activo": True,
            },
        )
        print(f"  Proveedor: {nombre}")
    ids_proveedores = {n: p["id"] for n, p in proveedores.items()}

    # ------------------------------------------------------------------
    # Catálogo de servicios
    # ------------------------------------------------------------------
    servicios = {s["nombre"]: s for s in pedir("GET", "/api/servicios")}
    datos_servicios = [
        ("Cambio de aceite", "Aceite sintético 10W-40 + filtro incluido", "120000", 30),
        ("Alineación y balanceo", "Alineación computarizada y balanceo de 4 llantas", "80000", 45),
        ("Revisión general", "Diagnóstico completo de 40 puntos", "60000", 30),
        ("Cambio de pastillas de freno", "Pastillas delanteras cerámicas", "250000", 60),
        ("Cambio de batería", "Instalación de batería 12V 60Ah", "50000", 20),
        ("Scanner OBD2", "Diagnóstico electrónico con scanner automotriz", "40000", 15),
        ("Cambio de amortiguadores", "Par de amortiguadores delanteros", "320000", 120),
        ("Lavado completo", "Lavado exterior, interior y motor", "35000", 40),
        ("Mantenimiento preventivo 10.000 km", "Aceite, filtros y revisión de frenos", "180000", 90),
        ("Diagnóstico de aire acondicionado", "Revisión de gas, compresor y filtro", "70000", 45),
    ]
    for nombre, descripcion, precio, duracion in datos_servicios:
        if nombre in servicios:
            continue
        servicios[nombre] = pedir(
            "POST",
            "/api/servicios",
            json={
                "nombre": nombre,
                "descripcion": descripcion,
                "precio": precio,
                "duracion_minutos": duracion,
                "activo": True,
            },
        )
        print(f"  Servicio: {nombre}")
    ids_servicios = {n: s["id"] for n, s in servicios.items()}

    # ------------------------------------------------------------------
    # Inventario de repuestos
    # ------------------------------------------------------------------
    repuestos = {r["codigo_barras"]: r for r in pedir("GET", "/api/repuestos") if r["codigo_barras"]}
    datos_repuestos = [
        ("Filtro de aceite", "Filtro de aceite motor 1.6/2.0", "FO-1001", 45, 10, "25000", "Autopartes del Norte"),
        ("Pastillas de freno delanteras", "Juego cerámico delantero", "PF-1002", 3, 6, "185000", "Autopartes del Norte"),
        ("Batería 12V 60Ah", "Batería libre de mantenimiento", "BA-1003", 14, 4, "480000", "Repuestos Express"),
        ("Llanta 205/55 R16", "Llanta radial de alto rendimiento", "LL-1004", 22, 8, "320000", "Repuestos Express"),
        ("Bujías de iridio (x4)", "Juego de 4 bujías de iridio", "BJ-1005", 2, 8, "160000", "Distribuidora Motor Andino"),
        ("Amortiguador delantero", "Amortiguador hidráulico gas", "AM-1006", 16, 4, "290000", "Repuestos Express"),
        ("Correa de distribución", "Correa dentada reforzada", "CD-1007", 11, 3, "145000", "Autopartes del Norte"),
        ("Aceite motor 10W-40 (4L)", "Aceite sintético 4 litros", "AC-1008", 60, 20, "135000", "Distribuidora Motor Andino"),
        ("Filtro de aire", "Filtro de aire de motor", "FA-1009", 38, 12, "45000", "Autopartes del Norte"),
        ("Disco de freno ventilado", "Disco ventilado delantero", "DF-1010", 1, 4, "210000", "Repuestos Express"),
        ("Filtro de combustible", "Filtro de combustible diésel/gasolina", "FC-1011", 27, 10, "65000", "Autopartes del Norte"),
        ("Líquido de frenos DOT4", "Frasco 500 ml", "LF-1012", 9, 10, "38000", "Distribuidora Motor Andino"),
    ]
    for nombre, descripcion, codigo, stock, minimo, precio, proveedor in datos_repuestos:
        if codigo in repuestos:
            continue
        repuestos[codigo] = pedir(
            "POST",
            "/api/repuestos",
            json={
                "nombre": nombre,
                "descripcion": descripcion,
                "codigo_barras": codigo,
                "stock": stock,
                "stock_minimo": minimo,
                "precio": precio,
                "proveedorId": ids_proveedores[proveedor],
            },
        )
        print(f"  Repuesto: {nombre} ({codigo})")
    ids_repuestos = {c: r["id"] for c, r in repuestos.items()}
    # Solo usamos en órdenes repuestos con stock holgado.
    repuestos_consumibles = ["FO-1001", "BA-1003", "LL-1004", "AM-1006", "CD-1007", "AC-1008", "FA-1009", "FC-1011"]

    # ------------------------------------------------------------------
    # Clientes (usuario CLIENTE + ficha Cliente)
    # ------------------------------------------------------------------
    usuarios = {u["correo"]: u for u in pedir("GET", "/api/usuarios")}
    clientes = {c["usuario"]["correo"]: c for c in pedir("GET", "/api/clientes")}
    datos_clientes = [
        ("Juan", "Pérez", "juan.perez@email.com", "3101234567", "Calle 10 #5-20"),
        ("María", "González", "maria.gonzalez@email.com", "3102345678", "Carrera 15 #30-45"),
        ("Carlos", "Rodríguez", "carlos.rodriguez@email.com", "3103456789", "Avenida 30 #10-15"),
        ("Ana", "Martínez", "ana.martinez@email.com", "3104567890", "Calle 20 #8-30"),
        ("Luis", "Hernández", "luis.hernandez@email.com", "3105678901", "Carrera 25 #15-20"),
        ("Laura", "Jiménez", "laura.jimenez@email.com", "3106789012", "Avenida 45 #20-10"),
        ("Diego", "Sánchez", "diego.sanchez@email.com", "3107890123", "Calle 30 #12-25"),
        ("Valeria", "Torres", "valeria.torres@email.com", "3108901234", "Carrera 35 #25-15"),
    ]
    for nombre, apellido, correo, telefono, direccion in datos_clientes:
        if correo in clientes:
            continue
        usuario = asegurar_usuario(nombre, apellido, correo, "CLIENTE", telefono, CLAVE_CLIENTES)
        clientes[correo] = pedir(
            "POST", "/api/clientes", json={"usuarioId": usuario["id"], "direccion": direccion}
        )
        print(f"  Cliente: {nombre} {apellido}")
    ids_clientes = {c: v["id"] for c, v in clientes.items()}

    # ------------------------------------------------------------------
    # Vehículos
    # ------------------------------------------------------------------
    vehiculos = {v["placa"]: v for v in pedir("GET", "/api/vehiculos")}
    datos_vehiculos = [
        ("ABC123", "Toyota", "Corolla", 2020, "Blanco", 45000, "juan.perez@email.com"),
        ("DEF456", "Mazda", "3", 2019, "Rojo", 52000, "juan.perez@email.com"),
        ("GHI789", "Chevrolet", "Spark GT", 2018, "Negro", 38000, "maria.gonzalez@email.com"),
        ("JKL012", "Renault", "Logan", 2021, "Gris", 25000, "carlos.rodriguez@email.com"),
        ("MNO345", "Nissan", "Sentra", 2017, "Azul", 67000, "ana.martinez@email.com"),
        ("PQR678", "Kia", "Rio", 2022, "Blanco", 15000, "luis.hernandez@email.com"),
        ("STU901", "Hyundai", "Accent", 2020, "Plateado", 42000, "laura.jimenez@email.com"),
        ("VWX234", "Ford", "Fiesta", 2016, "Rojo", 78000, "diego.sanchez@email.com"),
        ("YZA567", "Volkswagen", "Golf", 2021, "Negro", 32000, "valeria.torres@email.com"),
        ("BCD890", "Honda", "Civic", 2019, "Blanco", 55000, "maria.gonzalez@email.com"),
        ("EFG123", "Toyota", "Hilux", 2022, "Gris", 28000, "carlos.rodriguez@email.com"),
        ("HIJ456", "Mazda", "CX-5", 2023, "Azul", 12000, "ana.martinez@email.com"),
    ]
    for placa, marca, modelo, anio, color, km, correo in datos_vehiculos:
        if placa in vehiculos:
            continue
        vehiculos[placa] = pedir(
            "POST",
            "/api/vehiculos",
            json={
                "placa": placa,
                "marca": marca,
                "modelo": modelo,
                "anio": anio,
                "color": color,
                "kilometraje": km,
                "clienteId": ids_clientes[correo],
            },
        )
        print(f"  Vehículo: {placa} {marca} {modelo}")
    lista_vehiculos = list(vehiculos.values())

    # ------------------------------------------------------------------
    # Citas (fechas futuras)
    # ------------------------------------------------------------------
    citas = pedir("GET", "/api/citas")
    if not citas:
        hoy = date.today()
        planes_citas = [
            (1, "PENDIENTE", "Revisión general antes de viaje"),
            (2, "CONFIRMADA", "Cambio de aceite y filtros"),
            (3, "CONFIRMADA", "Ruido en la suspensión delantera"),
            (5, "PENDIENTE", "Alineación y balanceo"),
            (7, "CONFIRMADA", "Diagnóstico de aire acondicionado"),
            (9, "PENDIENTE", "Mantenimiento de 10.000 km"),
            (12, "CANCELADA", "Revisión de frenos"),
            (14, "FINALIZADA", "Scanner OBD2 por testigo de motor"),
        ]
        for indice, (dias, estado, descripcion) in enumerate(planes_citas):
            cita = pedir(
                "POST",
                "/api/citas",
                json={
                    "fecha": (hoy + timedelta(days=dias)).isoformat(),
                    "hora": f"{9 + (indice % 8):02d}:00:00",
                    "descripcion": descripcion,
                    "vehiculoId": lista_vehiculos[indice % len(lista_vehiculos)]["id"],
                },
            )
            if estado != "PENDIENTE":
                pedir("PATCH", f"/api/citas/{cita['id']}/estado", json={"estado": estado})
            print(f"  Cita: {cita['fecha']} {cita['hora']} ({estado})")

    # ------------------------------------------------------------------
    # Órdenes de trabajo + repuestos usados + estados
    # ------------------------------------------------------------------
    ordenes = pedir("GET", "/api/ordenes")
    if not ordenes:
        planes_ordenes = [
            ("RECIBIDO", "Ingreso por ruido en motor", "El cliente reporta ruido al acelerar."),
            ("RECIBIDO", "Ingreso por testigo de check engine", "Pendiente diagnóstico con scanner."),
            ("DIAGNOSTICO", "Pérdida de potencia en subida", "Se revisa sistema de inyección."),
            ("DIAGNOSTICO", "Vibración al frenar", "Posible desgaste de discos delanteros."),
            ("EN_REPARACION", "Cambio de amortiguadores delanteros", "Se reemplazan ambos amortiguadores."),
            ("EN_REPARACION", "Mantenimiento preventivo 10.000 km", "Aceite, filtros y revisión general."),
            ("ESPERANDO_REPUESTOS", "Cambio de correa de distribución", "Se espera llegada de la correa."),
            ("LISTO", "Cambio de aceite y filtro", "Servicio terminado, listo para entrega."),
            ("LISTO", "Alineación y balanceo", "Servicio terminado y probado en vía."),
            ("LISTO", "Cambio de batería", "Batería instalada y alternador verificado."),
            ("ENTREGADO", "Revisión general y cambio de bujías", "Vehículo entregado al cliente."),
            ("ENTREGADO", "Cambio de llantas delanteras", "Vehículo entregado sin novedades."),
        ]
        for indice, (estado, diagnostico, observaciones) in enumerate(planes_ordenes):
            vehiculo = lista_vehiculos[indice % len(lista_vehiculos)]
            orden = pedir(
                "POST",
                "/api/ordenes",
                json={
                    "vehiculoId": vehiculo["id"],
                    "mecanicoId": ids_mecanicos[indice % len(ids_mecanicos)],
                    "diagnostico": diagnostico,
                    "observaciones": observaciones,
                },
            )
            # Repuestos consumidos (1 o 2 líneas por orden)
            codigos = [
                repuestos_consumibles[indice % len(repuestos_consumibles)],
                repuestos_consumibles[(indice + 3) % len(repuestos_consumibles)],
            ]
            for codigo in dict.fromkeys(codigos):
                try:
                    pedir(
                        "POST",
                        f"/api/detalles/orden/{orden['id']}",
                        json={"repuestoId": ids_repuestos[codigo], "cantidad": 1 + (indice % 2)},
                    )
                except RuntimeError as error:
                    print(f"    Aviso repuesto {codigo}: {error}")
            if estado != "RECIBIDO":
                pedir("PATCH", f"/api/ordenes/{orden['id']}/estado", json={"estado": estado})
            print(f"  Orden #{orden['id']}: {vehiculo['placa']} -> {estado}")

    # ------------------------------------------------------------------
    # Facturas y pagos
    # ------------------------------------------------------------------
    facturas = pedir("GET", "/api/facturas")
    if not facturas:
        ordenes = pedir("GET", "/api/ordenes")
        facturables = [o for o in ordenes if o["estado"] in ("LISTO", "ENTREGADO")]
        for indice, orden in enumerate(facturables):
            factura = pedir("POST", "/api/facturas", json={"ordenTrabajoId": orden["id"]})
            total = Decimal(str(factura["total"]))
            if indice % 4 == 0:  # pagada completa
                pedir(
                    "POST",
                    f"/api/facturas/{factura['id']}/pagos",
                    json={"monto": str(total), "metodo": "TRANSFERENCIA"},
                )
                estado_pago = "PAGADA"
            elif indice % 4 == 1:  # abono del 50%
                pedir(
                    "POST",
                    f"/api/facturas/{factura['id']}/pagos",
                    json={"monto": str((total / 2).quantize(Decimal("0.01"))), "metodo": "EFECTIVO"},
                )
                estado_pago = "PARCIAL"
            else:
                estado_pago = "PENDIENTE"
            print(f"  Factura {factura['numero']}: {factura['total']} ({estado_pago})")

    # ------------------------------------------------------------------
    # Cotizaciones
    # ------------------------------------------------------------------
    cotizaciones = pedir("GET", "/api/cotizaciones")
    if not cotizaciones:
        planes_cotizaciones = [
            ("ENVIADA", "Cotización de mantenimiento completo", ["Cambio de aceite", "Filtro de aire"]),
            ("APROBADA", "Cotización de cambio de frenos", ["Cambio de pastillas de freno", "Líquido de frenos"]),
            ("BORRADOR", "Cotización de revisión de aire acondicionado", ["Diagnóstico de aire acondicionado"]),
            ("RECHAZADA", "Cotización de cambio de amortiguadores", ["Cambio de amortiguadores"]),
        ]
        lineas_servicio = {
            "Cambio de aceite": ids_servicios["Cambio de aceite"],
            "Filtro de aire": None,
            "Cambio de pastillas de freno": ids_servicios["Cambio de pastillas de freno"],
            "Líquido de frenos": None,
            "Diagnóstico de aire acondicionado": ids_servicios["Diagnóstico de aire acondicionado"],
            "Cambio de amortiguadores": ids_servicios["Cambio de amortiguadores"],
        }
        for indice, (estado, observaciones, conceptos) in enumerate(planes_cotizaciones):
            vehiculo = lista_vehiculos[(indice + 4) % len(lista_vehiculos)]
            detalles = []
            for concepto in conceptos:
                servicio_id = lineas_servicio.get(concepto)
                if servicio_id:
                    detalles.append({"servicioId": servicio_id, "cantidad": 1})
                else:
                    detalles.append(
                        {"concepto": concepto, "precioUnitario": "65000", "cantidad": 1}
                    )
            cotizacion = pedir(
                "POST",
                "/api/cotizaciones",
                json={
                    "vehiculoId": vehiculo["id"],
                    "clienteId": vehiculo["clienteId"],
                    "observaciones": observaciones,
                    "validezDias": 15,
                    "detalles": detalles,
                },
            )
            # La API solo permite BORRADOR -> ENVIADA -> APROBADA/RECHAZADA.
            cadena_estados = {
                "BORRADOR": [],
                "ENVIADA": ["ENVIADA"],
                "APROBADA": ["ENVIADA", "APROBADA"],
                "RECHAZADA": ["ENVIADA", "RECHAZADA"],
            }[estado]
            for siguiente in cadena_estados:
                pedir(
                    "PATCH",
                    f"/api/cotizaciones/{cotizacion['id']}/estado",
                    json={"estado": siguiente},
                )
            print(f"  Cotización {cotizacion['numero']}: {estado}")

    print(f"\n=== SIEMBRA COMPLETADA en {BASE} ===")
    for nombre, ruta in (
        ("Usuarios", "/api/usuarios"),
        ("Clientes", "/api/clientes"),
        ("Vehículos", "/api/vehiculos"),
        ("Citas", "/api/citas"),
        ("Órdenes", "/api/ordenes"),
        ("Facturas", "/api/facturas"),
        ("Cotizaciones", "/api/cotizaciones"),
        ("Repuestos", "/api/repuestos"),
        ("Servicios", "/api/servicios"),
        ("Proveedores", "/api/proveedores"),
    ):
        print(f"  {nombre}: {len(pedir('GET', ruta))}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:  # noqa: BLE001
        print(f"\nERROR: {error}", file=sys.stderr)
        sys.exit(1)
