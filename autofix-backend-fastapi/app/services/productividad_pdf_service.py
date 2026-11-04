"""Generación del PDF de resumen de productividad por periodo.

Extiende el concepto de factura a un reporte ejecutivo de productividad:
- Encabezado con datos de la empresa y período
- Métricas generales (órdenes, facturado, cobrado, variaciones)
- Desglose por rol y por empleado
- Serie diaria resumida
- Notas al pie

Usa ReportLab (puro Python, sin dependencias de sistema).
"""

from io import BytesIO

from decimal import Decimal
from datetime import date, datetime

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
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
from app.models.orden_trabajo import OrdenTrabajo
from app.models.usuario import Usuario
from app.models.enums import EstadoOrden


# Paleta premium (violeta acento).
VIOLETA = colors.HexColor("#663af3")
VIOLETA_CLARA = colors.HexColor("#a78bfa")
OSCURA = colors.HexColor("#0b0e1b")
GRIS_TEXTO = colors.HexColor("#3f4654")
GRIS_CLARO = colors.HexColor("#f4f5fa")
BORDE = colors.HexColor("#e3e6ef")
NARANJA_ADVERTENCIA = colors.HexColor("#b45309")


def _moneda(valor) -> str:
    """Formatea un monto como número con separador de miles y 2 decimales."""
    numero = Decimal(str(valor if valor is not None else 0))
    entero = int(numero)
    decimales = int((numero - entero) * 100)
    if entero == 0 and decimales == 0:
        return "0,00"
    miles = f"{entero:,}".replace(",", ".")
    return f"{miles},{decimales:02d}"


def _signo_variacion(var: float | None) -> str:
    if var is None:
        return "—"
    if var >= 0:
        return f"↑ {abs(var)}%"
    return f"↓ {abs(var)}%"


def resumen_periodo_pdf(
    resumen: dict,
    periodo: str,
    fecha: date,
    empresa: Empresa | None = None,
) -> bytes:
    """Construye el PDF del resumen de productividad y devuelve los bytes.

    Args:
        resumen: Diccionario devuelto por `productividad_service.resumen_periodo`.
        periodo: Nombre del periodo (diario, semanal, quincenal, mensual).
        fecha: Fecha de referencia del periodo.
        empresa: Datos de la empresa (opcional; si no se provee, usará
                 "AutoFix" en el encabezado).

    Returns:
        Bytes del documento PDF generado.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        title=f"Resumen Productividad - {periodo.capitalize()}",
        author="AutoFix",
    )

    estilos = getSampleStyleSheet()

    # Estilos personalizados
    estilo_titulo = ParagraphStyle(
        "TituloResumen",
        parent=estilos["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=OSCURA,
        spaceAfter= 6,
    )
    estilo_subtitulo = ParagraphStyle(
        "SubtituloResumen",
        parent=estilos["Normal"],
        fontName="Helvetica",
        fontSize= 9,
        textColor=GRIS_TEXTO,
        leading=12,
    )
    estilo_seccion = ParagraphStyle(
        "SeccionResumen",
        parent=estilos["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10,
        textColor=VIOLETA,
        spaceBefore= 6,
        spaceAfter= 4,
        letterSpacing=0.5,
    )
    estilo_celda = ParagraphStyle(
        "CeldaResumen",
        parent=estilos["Normal"],
        fontName="Helvetica",
        fontSize= 9,
        textColor=GRIS_TEXTO,
        leading=12,
    )
    estilo_celda_derecha = ParagraphStyle(
        "CeldaDerechaResumen",
        parent=estilo_celda,
        alignment=TA_RIGHT,
    )
    estilo_celda_centro = ParagraphStyle(
        "CeldaCentroResumen",
        parent=estilo_celda,
        alignment=TA_CENTER,
    )
    estilo_nota = ParagraphStyle(
        "NotaResumen",
        parent=estilos["Normal"],
        fontName="Helvetica-Oblique",
        fontSize= 8,
        textColor=colors.HexColor("#8b90a0"),
        leading=10,
    )

    # --- Título y encabezado ---
    nombre_empresa = empresa.nombre if empresa else "AutoFix"
    titulares = [
        Paragraph(f"<b>{nombre_empresa}</b>", estilo_titulo),
        Paragraph(f"Resumen de productividad {periodo.capitalize()}", estilo_subtitulo),
        Paragraph(f"Periodo: {fecha.strftime('%d/%m/%Y')}", estilo_subtitulo),
    ]
    if empresa and empresa.nit:
        titulares.append(Paragraph(f"NIT: {empresa.nit}", estilo_subtitulo))

    elementos = []
    for t in titulares:
        elementos.append(t)
    elementos.append(Spacer(1, 8))

    # --- Métricas generales ---
    actual = resumen.get("empresa", {}).get("actual", {})
    anterior = resumen.get("empresa", {}).get("anterior", {})

    # Preparar datos de métricas en una tabla de 2 columnas (actual / anterior)
    claves_metricas = [
        ("Órdenes creadas", actual.get("ordenesCreadas", 0), anterior.get("ordenesCreadas", 0)),
        ("Órdenes entregadas", actual.get("ordenesEntregadas", 0), anterior.get("ordenesEntregadas", 0)),
        ("Total facturado", _moneda(actual.get("totalFacturado", 0)), _moneda(anterior.get("totalFacturado", 0))),
        ("Total cobrado", _moneda(actual.get("totalCobrado", 0)), _moneda(anterior.get("totalCobrado", 0))),
        ("Facturas emitidas", actual.get("facturasEmitidas", 0), anterior.get("facturasEmitidas", 0)),
        ("Acciones registradas", actual.get("acciones", 0), anterior.get("acciones", 0)),
    ]

    datos_tabla = []
    for label, act, ant in claves_metricas:
        variacion = None
        if act != 0 or ant != 0:
            try:
                variacion = round((float(act) - float(ant)) / float(ant) * 100, 1) if ant else None
            except (ZeroDivisionError, ValueError):
                variacion = None
        fila = [
            Paragraph(f"<b>{label}</b>", estilo_celda),
            Paragraph(_moneda(act) if isinstance(act, (int, float, Decimal)) else str(act), estilo_celda_derecha),
            Paragraph(_moneda(ant) if isinstance(ant, (int, float, Decimal)) else str(ant), estilo_celda_derecha),
            Paragraph(_signo_variacion(variacion), estilo_celda_centro),
        ]
        datos_tabla.append(fila)

    # Encabezado de tabla
    encabezado_tabla = [
        Paragraph("<b>Métrica</b>", estilo_celda),
        Paragraph("<b>Actual</b>", estilo_celda_derecha),
        Paragraph("<b>Anterior</b>", estilo_celda_derecha),
        Paragraph("<b>Variación</b>", estilo_celda_centro),
    ]

    tabla_metricas = Table(
        [encabezado_tabla] + datos_tabla,
        colWidths=[120 * mm, 50 * mm, 50 * mm, 35 * mm],
    )
    estilo_tabla_metricas = [
        ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
        ("BACKGROUND", (0, 0), (-1, 0), GRIS_CLARO),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, 0), 1, VIOLETA),
    ]
    # Aplicar variación colores
    for i in range(1, len(datos_tabla) + 1):
        var_text = datos_tabla[i - 1][3].text
        if var_text.startswith("↑"):
            estilo_tabla_metricas.append(("TEXTCOLOR", (3, i), (3, i), VIOLETA))
        elif var_text.startswith("↓"):
            estilo_tabla_metricas.append(("TEXTCOLOR", (3, i), (3, i), NARANJA_ADVERTENCIA))
    tabla_metricas.setStyle(TableStyle(estilo_tabla_metricas))
    elementos.append(tabla_metricas)
    elementos.append(Spacer(1, 8))

    # --- Desglose por rol ---
    roles = resumen.get("roles", [])
    if roles:
        elementos.append(Paragraph("Desglose por rol", estilo_seccion))

        datos_roles = [
            Paragraph("<b>Rol</b>", estilo_celda),
            Paragraph("<b>Empleados</b>", estilo_celda_derecha),
            Paragraph("<b>Acciones</b>", estilo_celda_derecha),
            Paragraph("<b>Órdenes</b>", estilo_celda_derecha),
            Paragraph("<b>Total cobrado</b>", estilo_celda_derecha),
            Paragraph("<b>Acc/empleado</b>", estilo_celda_centro),
        ]

        for r in roles:
            datos_roles.append(
                Paragraph(r.get("rol", "-"), estilo_celda)
            )
            datos_roles.append(
                Paragraph(str(r.get("empleados", 0)), estilo_celda_derecha)
            )
            datos_roles.append(
                Paragraph(str(r.get("acciones", 0)), estilo_celda_derecha)
            )
            datos_roles.append(
                Paragraph(str(r.get("ordenesEntregadas", 0)), estilo_celda_derecha)
            )
            datos_roles.append(
                Paragraph(_moneda(r.get("totalCobrado", 0)), estilo_celda_derecha)
            )
            datos_roles.append(
                Paragraph(str(r.get("accionesPorEmpleado", 0)), estilo_celda_centro)
            )

        tabla_roles = Table(datos_roles, colWidths=[60 * mm, 25 * mm, 25 * mm, 25 * mm, 35 * mm, 25 * mm])
        tabla_roles.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), GRIS_CLARO),
                    ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDE),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elementos.append(tabla_roles)
        elementos.append(Spacer(1, 6))

    # --- Serie diaria resumida ---
    serie = resumen.get("serie", [])
    if serie:
        elementos.append(Paragraph("Serie diaria (primeros 7 días)", estilo_seccion))

        datos_serie = [
            Paragraph("<b>Día</b>", estilo_celda),
            Paragraph("<b>Órdenes</b>", estilo_celda_derecha),
            Paragraph("<b>Facturado</b>", estilo_celda_derecha),
        ]
        for i, dia in enumerate(serie[:7]):  # Máx. 7 filas para no saturar
            datos_serie.append(Paragraph(str(dia.get("fecha", "-")), estilo_celda))
            datos_serie.append(
                Paragraph(str(dia.get("ordenesCreadas", 0)), estilo_celda_derecha)
            )
            datos_serie.append(
                Paragraph(_moneda(dia.get("totalFacturado", 0)), estilo_celda_derecha)
            )

        tabla_serie = Table(datos_serie, colWidths=[30 * mm, 30 * mm, 50 * mm])
        tabla_serie.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), GRIS_CLARO),
                    ("BOX", (0, 0), (-1, -1), 0.5, BORDE),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 3),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        elementos.append(tabla_serie)
        elementos.append(Spacer(1, 6))

    # --- Nota al pie ---
    elementos.append(Spacer(1, 10))
    elementos.append(
        Paragraph(
            "Documento generado por AutoFix. Resumen ejecutivo de productividad "
            "para el periodo especificado. Los datos corresponden a la empresa "
            "seleccionada en el sistema.",
            estilo_nota,
        )
    )

    doc.build(elementos)
    return buffer.getvalue()