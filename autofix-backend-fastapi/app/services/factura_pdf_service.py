"""Generación del PDF de una factura (comprobante interno).

Usa ReportLab (puro Python, sin dependencias de sistema). El PDF incluye
el encabezado con los datos del taller (empresa), los datos del cliente y
el vehículo, el desglose de repuestos de la orden, los totales (subtotal,
IVA y total) y el estado de pago con los abonos registrados.

La factura es un comprobante interno del taller; no sustituye la
facturación electrónica tributaria.
"""

from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.models.empresa import Empresa
from app.models.factura import Factura

# Paleta alineada al rediseño premium (violeta de acento).
VIOLETA = colors.HexColor("#663af3")
VIOLETA_CLARA = colors.HexColor("#a78bfa")
OSCURA = colors.HexColor("#0b0e1b")
GRIS_TEXTO = colors.HexColor("#3f4654")
GRIS_CLARO = colors.HexColor("#f4f5fa")
BORDE = colors.HexColor("#e3e6ef")


def _moneda(valor) -> str:
    """Formatea un monto como COP sin símbolo de moneda (ya va en la tabla)."""
    numero = Decimal(str(valor if valor is not None else 0))
    entero = int(numero)
    decimales = int((numero - entero) * 100)
    miles = f"{entero:,}".replace(",", ".")
    return f"{miles},{decimales:02d}"


def generar_pdf_factura(factura: Factura, empresa: Empresa | None) -> bytes:
    """Construye el PDF de la factura y devuelve los bytes."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Factura {factura.numero}",
        author=empresa.nombre if empresa else "AutoFix",
    )

    estilos = getSampleStyleSheet()
    estilo_titulo = ParagraphStyle(
        "TituloFactura",
        parent=estilos["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=OSCURA,
        spaceAfter=2,
    )
    estilo_subtitulo = ParagraphStyle(
        "SubtituloFactura",
        parent=estilos["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=GRIS_TEXTO,
        leading=13,
    )
    estilo_seccion = ParagraphStyle(
        "SeccionFactura",
        parent=estilos["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=VIOLETA,
        spaceBefore=8,
        spaceAfter=4,
        letterSpacing=0.5,
    )
    estilo_derecha = ParagraphStyle(
        "Derecha",
        parent=estilos["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=GRIS_TEXTO,
        alignment=TA_RIGHT,
        leading=13,
    )
    estilo_izquierda = ParagraphStyle(
        "Izquierda",
        parent=estilos["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=GRIS_TEXTO,
        leading=13,
        alignment=TA_LEFT,
    )

    elementos = []

    # --- Encabezado: taller a la izquierda, datos de la factura a la derecha ---
    nombre_empresa = empresa.nombre if empresa else "AutoFix"
    nit = empresa.nit if empresa and empresa.nit else "—"
    direccion = empresa.direccion if empresa and empresa.direccion else ""
    telefono = empresa.telefono if empresa and empresa.telefono else ""
    correo = empresa.correo if empresa and empresa.correo else ""

    izquierda = [
        Paragraph(f"<b>{nombre_empresa}</b>", estilo_titulo),
        Paragraph(f"NIT: {nit}", estilo_subtitulo),
    ]
    if direccion:
        izquierda.append(Paragraph(direccion, estilo_subtitulo))
    contacto = " · ".join(x for x in (telefono, correo) if x)
    if contacto:
        izquierda.append(Paragraph(contacto, estilo_subtitulo))

    derecha = [
        Paragraph("<b>FACTURA</b>", estilo_derecha),
        Paragraph(f"<b>{factura.numero}</b>", estilo_derecha),
        Paragraph(f"Fecha: {factura.fecha.strftime('%d/%m/%Y')}", estilo_derecha),
        Paragraph(f"Orden de trabajo: #{factura.orden_trabajo_id}", estilo_derecha),
    ]

    encabezado = Table(
        [[izquierda, derecha]], colWidths=[110 * mm, 60 * mm]
    )
    encabezado.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LINEBELOW", (0, 0), (-1, -1), 1, VIOLETA),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    elementos.append(encabezado)
    elementos.append(Spacer(1, 10))

    # --- Datos del cliente y del vehículo ---
    orden = factura.orden_trabajo
    cliente_nombre = "—"
    cliente_direccion = ""
    vehiculo_texto = "—"
    if orden is not None and orden.vehiculo is not None:
        v = orden.vehiculo
        detalles_vehiculo = f"{v.marca} {v.modelo}"
        if v.anio:
            detalles_vehiculo += f" · {v.anio}"
        vehiculo_texto = f"{v.placa} — {detalles_vehiculo}"
        if v.cliente is not None and v.cliente.usuario is not None:
            u = v.cliente.usuario
            cliente_nombre = f"{u.nombre} {u.apellido}"
            cliente_direccion = v.cliente.direccion or ""

    datos_cliente = [
        [
            Paragraph("<b>Cliente</b>", estilo_izquierda),
            Paragraph("<b>Vehículo</b>", estilo_izquierda),
        ],
        [
            Paragraph(cliente_nombre, estilo_izquierda),
            Paragraph(vehiculo_texto, estilo_izquierda),
        ],
    ]
    if cliente_direccion:
        datos_cliente.append(
            [
                Paragraph(cliente_direccion, estilo_izquierda),
                Paragraph("", estilo_izquierda),
            ]
        )

    tabla_cliente = Table(datos_cliente, colWidths=[85 * mm, 85 * mm])
    tabla_cliente.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), GRIS_CLARO),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    elementos.append(tabla_cliente)
    elementos.append(Spacer(1, 10))

    # --- Desglose de repuestos (líneas de la orden) ---
    elementos.append(Paragraph("DETALLE", estilo_seccion))

    filas = [
        [
            Paragraph("<b>Descripción</b>", estilo_izquierda),
            Paragraph("<b>Cant.</b>", ParagraphStyle("c", parent=estilo_derecha, alignment=TA_RIGHT)),
            Paragraph("<b>P. Unit.</b>", ParagraphStyle("pu", parent=estilo_derecha, alignment=TA_RIGHT)),
            Paragraph("<b>Subtotal</b>", ParagraphStyle("st", parent=estilo_derecha, alignment=TA_RIGHT)),
        ]
    ]

    detalles = orden.detalles if orden is not None else []
    if detalles:
        for d in detalles:
            nombre_repuesto = d.repuesto.nombre if d.repuesto else f"Repuesto #{d.repuesto_id}"
            subtotal_linea = d.precio_unitario * d.cantidad
            filas.append(
                [
                    Paragraph(nombre_repuesto, estilo_izquierda),
                    Paragraph(str(d.cantidad), ParagraphStyle("c2", parent=estilo_derecha, alignment=TA_RIGHT)),
                    Paragraph(_moneda(d.precio_unitario), ParagraphStyle("pu2", parent=estilo_derecha, alignment=TA_RIGHT)),
                    Paragraph(_moneda(subtotal_linea), ParagraphStyle("st2", parent=estilo_derecha, alignment=TA_RIGHT)),
                ]
            )
    else:
        filas.append(
            [
                Paragraph("Sin repuestos registrados en la orden.", estilo_izquierda),
                Paragraph("—", estilo_derecha),
                Paragraph("—", estilo_derecha),
                Paragraph("—", estilo_derecha),
            ]
        )

    tabla_detalle = Table(
        filas, colWidths=[92 * mm, 22 * mm, 28 * mm, 28 * mm], repeatRows=1
    )
    estilo_tabla = [
        ("BACKGROUND", (0, 0), (-1, 0), GRIS_CLARO),
        ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, BORDE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]
    # Zebra en las filas de datos.
    for i in range(1, len(filas)):
        if i % 2 == 0:
            estilo_tabla.append(("BACKGROUND", (0, i), (-1, i), GRIS_CLARO))
    tabla_detalle.setStyle(TableStyle(estilo_tabla))
    elementos.append(tabla_detalle)
    elementos.append(Spacer(1, 8))

    # --- Totales y estado de pago ---
    pagado = Decimal(factura.monto_pagado or 0)
    saldo = Decimal(factura.total) - pagado
    estado_pago = factura.estado_pago.value if hasattr(factura.estado_pago, "value") else str(factura.estado_pago)

    filas_totales = [
        [Paragraph("Subtotal", estilo_derecha), Paragraph(_moneda(factura.subtotal), estilo_derecha)],
        [
            Paragraph(
                f"IVA ({_moneda(empresa.iva_porcentaje if empresa else 19)}%)",
                estilo_derecha,
            ),
            Paragraph(_moneda(factura.iva), estilo_derecha),
        ],
        [
            Paragraph("<b>TOTAL</b>", ParagraphStyle("tot", parent=estilo_derecha, fontSize=12, textColor=OSCURA)),
            Paragraph(
                f"<b>{_moneda(factura.total)}</b>",
                ParagraphStyle("totv", parent=estilo_derecha, fontSize=12, textColor=VIOLETA),
            ),
        ],
        [
            Paragraph(f"Estado de pago: {estado_pago}", estilo_izquierda),
            Paragraph(f"Pagado: {_moneda(pagado)}", estilo_derecha),
        ],
    ]
    if saldo > 0:
        filas_totales.append(
            [
                Paragraph("", estilo_izquierda),
                Paragraph(
                    f"<b>Saldo pendiente: {_moneda(saldo)}</b>",
                    ParagraphStyle("saldo", parent=estilo_derecha, textColor=colors.HexColor("#b45309")),
                ),
            ]
        )

    tabla_totales = Table(filas_totales, colWidths=[110 * mm, 60 * mm])
    tabla_totales.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
                ("LINEBELOW", (0, 2), (-1, 2), 1, VIOLETA),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    # Alinea la columna de importes a la derecha.
    elementos.append(tabla_totales)
    elementos.append(Spacer(1, 12))

    # --- Nota al pie ---
    elementos.append(
        Paragraph(
            "Documento generado por AutoFix. Factura interna del taller; "
            "conserva los datos del vehículo y del servicio realizado.",
            ParagraphStyle(
                "Pie",
                parent=estilos["Normal"],
                fontName="Helvetica-Oblique",
                fontSize=8,
                textColor=colors.HexColor("#8b90a0"),
                leading=11,
            ),
        )
    )

    doc.build(elementos)
    return buffer.getvalue()
