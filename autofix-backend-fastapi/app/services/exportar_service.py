"""Exportación de datos a CSV para los clientes de cada empresa.

Reglas de negocio:
- Solo se exportan columnas explícitas y legibles (nunca contraseñas, hashes,
  tokens ni campos internos).
- Todo se filtra por la empresa del usuario.
- El CSV está pensado para Excel en español: UTF-8 con BOM, separador ";",
  fechas en hora de Colombia (UTC-5) y dinero como número sin símbolo.
- Se neutralizan fórmulas de Excel (=, +, -, @, tab, retorno de carro).
- La consulta se recorre en streaming para no cargar todo en memoria.
"""

import csv
import io
import zipfile
from collections.abc import Iterator
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from enum import Enum

from sqlalchemy import Select, select
from sqlalchemy.orm import aliased

from app.database import SessionLocal
from app.models.cita import Cita
from app.models.cliente import Cliente
from app.models.factura import Factura
from app.models.mecanico import Mecanico
from app.models.orden_trabajo import OrdenTrabajo
from app.models.proveedor import Proveedor
from app.models.repuesto import Repuesto
from app.models.usuario import Usuario
from app.models.vehiculo import Vehiculo

# Entidades permitidas por la API.
ENTIDADES: tuple[str, ...] = (
    "clientes",
    "vehiculos",
    "citas",
    "ordenes",
    "repuestos",
    "facturas",
)

_ZONA_COLOMBIA = timezone(timedelta(hours=-5))
_TAMANO_BLOQUE = 64 * 1024


def nombre_archivo(entidad: str, fecha: date | None = None) -> str:
    """Nombre del CSV: autofix_<entidad>_<AAAA-MM-DD>.csv."""
    dia = (fecha or datetime.now(_ZONA_COLOMBIA).date()).isoformat()
    return f"autofix_{entidad}_{dia}.csv"


def _fecha_hora_colombia(valor: datetime) -> str:
    """Convierte una fecha/hora (UTC si es ingenua) a hora de Colombia."""
    if valor.tzinfo is None:
        valor = valor.replace(tzinfo=timezone.utc)
    return valor.astimezone(_ZONA_COLOMBIA).strftime("%Y-%m-%d %H:%M")


def _proteger_texto(valor: str) -> str:
    """Evita inyección de fórmulas al abrir el CSV en Excel."""
    if valor and valor[0] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + valor
    return valor


def _convertir(valor) -> str:
    """Normaliza un valor de la base a texto apto para el CSV."""
    if valor is None:
        return ""
    if isinstance(valor, Enum):
        return str(valor.value)
    if isinstance(valor, bool):
        return "Sí" if valor else "No"
    if isinstance(valor, datetime):
        return _fecha_hora_colombia(valor)
    if isinstance(valor, date):
        return valor.strftime("%Y-%m-%d")
    if isinstance(valor, time):
        return valor.strftime("%H:%M")
    if isinstance(valor, (Decimal, float)):
        return f"{valor:.2f}"
    if isinstance(valor, int):
        return str(valor)
    return _proteger_texto(str(valor))


def _linea_csv(valores: list[str]) -> str:
    buffer = io.StringIO()
    csv.writer(buffer, delimiter=";", lineterminator="\r\n").writerow(valores)
    return buffer.getvalue()


def _rango_fechas(columna, desde: date | None, hasta: date | None, *, es_fecha=False):
    """Filtros inclusivos por día para columnas Date o DateTime.

    En PostgreSQL no se puede comparar una columna DATE con un TIMESTAMP:
    por eso las columnas de solo fecha se comparan con objetos ``date``.
    """
    filtros = []
    if es_fecha:
        if desde is not None:
            filtros.append(columna >= desde)
        if hasta is not None:
            filtros.append(columna <= hasta)
        return filtros

    if desde is not None:
        filtros.append(columna >= datetime.combine(desde, time.min))
    if hasta is not None:
        filtros.append(columna < datetime.combine(hasta + timedelta(days=1), time.min))
    return filtros


def _consulta(
    entidad: str,
    empresa_id: int,
    desde: date | None,
    hasta: date | None,
) -> tuple[list[str], Select]:
    """Devuelve los encabezados legibles y la consulta de una entidad."""
    if entidad == "clientes":
        encabezados = [
            "ID", "Nombre", "Apellido", "Correo", "Teléfono", "Dirección",
            "Fecha de registro",
        ]
        stmt = (
            select(
                Cliente.id,
                Usuario.nombre,
                Usuario.apellido,
                Usuario.correo,
                Usuario.telefono,
                Cliente.direccion,
                Usuario.fecha_creacion,
            )
            .join(Usuario, Cliente.usuario_id == Usuario.id)
            .where(Cliente.empresa_id == empresa_id)
            .order_by(Cliente.id)
        )
        return encabezados, stmt

    if entidad == "vehiculos":
        encabezados = [
            "ID", "Placa", "Marca", "Modelo", "Año", "Color", "Kilometraje",
            "Cliente", "Correo del cliente",
        ]
        stmt = (
            select(
                Vehiculo.id,
                Vehiculo.placa,
                Vehiculo.marca,
                Vehiculo.modelo,
                Vehiculo.anio,
                Vehiculo.color,
                Vehiculo.kilometraje,
                Usuario.nombre,
                Usuario.correo,
            )
            .join(Cliente, Vehiculo.cliente_id == Cliente.id)
            .join(Usuario, Cliente.usuario_id == Usuario.id)
            .where(Vehiculo.empresa_id == empresa_id)
            .order_by(Vehiculo.id)
        )
        return encabezados, stmt

    if entidad == "citas":
        encabezados = [
            "ID", "Fecha", "Hora", "Estado", "Descripción", "Placa", "Cliente",
        ]
        stmt = (
            select(
                Cita.id,
                Cita.fecha,
                Cita.hora,
                Cita.estado,
                Cita.descripcion,
                Vehiculo.placa,
                Usuario.nombre,
            )
            .join(Vehiculo, Cita.vehiculo_id == Vehiculo.id)
            .join(Cliente, Vehiculo.cliente_id == Cliente.id)
            .join(Usuario, Cliente.usuario_id == Usuario.id)
            .where(Cita.empresa_id == empresa_id)
            .order_by(Cita.id)
        )
        for filtro in _rango_fechas(Cita.fecha, desde, hasta, es_fecha=True):
            stmt = stmt.where(filtro)
        return encabezados, stmt

    if entidad == "ordenes":
        encabezados = [
            "ID", "Fecha de ingreso", "Fecha de salida", "Estado", "Diagnóstico",
            "Observaciones", "Mecánico", "Placa", "Cliente",
        ]
        mecanico_usuario = aliased(Usuario)
        stmt = (
            select(
                OrdenTrabajo.id,
                OrdenTrabajo.fecha_ingreso,
                OrdenTrabajo.fecha_salida,
                OrdenTrabajo.estado,
                OrdenTrabajo.diagnostico,
                OrdenTrabajo.observaciones,
                mecanico_usuario.nombre,
                Vehiculo.placa,
                Usuario.nombre,
            )
            .join(Vehiculo, OrdenTrabajo.vehiculo_id == Vehiculo.id)
            .join(Cliente, Vehiculo.cliente_id == Cliente.id)
            .join(Usuario, Cliente.usuario_id == Usuario.id)
            .outerjoin(Mecanico, OrdenTrabajo.mecanico_id == Mecanico.id)
            .outerjoin(mecanico_usuario, Mecanico.usuario_id == mecanico_usuario.id)
            .where(OrdenTrabajo.empresa_id == empresa_id)
            .order_by(OrdenTrabajo.id)
        )
        for filtro in _rango_fechas(OrdenTrabajo.fecha_ingreso, desde, hasta):
            stmt = stmt.where(filtro)
        return encabezados, stmt

    if entidad == "repuestos":
        encabezados = [
            "ID", "Nombre", "Descripción", "Código de barras", "Stock",
            "Stock mínimo", "Precio", "Proveedor",
        ]
        stmt = (
            select(
                Repuesto.id,
                Repuesto.nombre,
                Repuesto.descripcion,
                Repuesto.codigo_barras,
                Repuesto.stock,
                Repuesto.stock_minimo,
                Repuesto.precio,
                Proveedor.nombre,
            )
            .outerjoin(Proveedor, Repuesto.proveedor_id == Proveedor.id)
            .where(Repuesto.empresa_id == empresa_id)
            .order_by(Repuesto.id)
        )
        return encabezados, stmt

    if entidad == "facturas":
        encabezados = [
            "ID", "Número", "Fecha", "Subtotal", "IVA", "Total", "Monto pagado",
            "Estado de pago", "Orden", "Placa", "Cliente",
        ]
        stmt = (
            select(
                Factura.id,
                Factura.numero,
                Factura.fecha,
                Factura.subtotal,
                Factura.iva,
                Factura.total,
                Factura.monto_pagado,
                Factura.estado_pago,
                Factura.orden_trabajo_id,
                Vehiculo.placa,
                Usuario.nombre,
            )
            .join(OrdenTrabajo, Factura.orden_trabajo_id == OrdenTrabajo.id)
            .join(Vehiculo, OrdenTrabajo.vehiculo_id == Vehiculo.id)
            .join(Cliente, Vehiculo.cliente_id == Cliente.id)
            .join(Usuario, Cliente.usuario_id == Usuario.id)
            .where(Factura.empresa_id == empresa_id)
            .order_by(Factura.id)
        )
        for filtro in _rango_fechas(Factura.fecha, desde, hasta):
            stmt = stmt.where(filtro)
        return encabezados, stmt

    raise ValueError(f"Entidad no soportada: {entidad}")


def generar_csv(
    entidad: str,
    empresa_id: int,
    desde: date | None = None,
    hasta: date | None = None,
) -> Iterator[str]:
    """Genera el CSV por bloques, usando su propia sesión de base de datos.

    La sesión es propia (no la del request) para que siga abierta mientras
    el StreamingResponse envía el archivo al cliente.
    """
    encabezados, stmt = _consulta(entidad, empresa_id, desde, hasta)
    session = SessionLocal()
    try:
        resultado = session.execute(stmt.execution_options(yield_per=500))
        # BOM UTF-8 + encabezados (Excel en español reconoce el BOM).
        yield "\ufeff" + _linea_csv(encabezados)
        buffer = io.StringIO()
        writer = csv.writer(buffer, delimiter=";", lineterminator="\r\n")
        for fila in resultado:
            writer.writerow([_convertir(valor) for valor in fila])
            if buffer.tell() >= _TAMANO_BLOQUE:
                yield buffer.getvalue()
                buffer.seek(0)
                buffer.truncate(0)
        resto = buffer.getvalue()
        if resto:
            yield resto
    finally:
        session.close()


def generar_zip(
    empresa_id: int,
    desde: date | None = None,
    hasta: date | None = None,
) -> bytes:
    """ZIP con un CSV por entidad ("descargar todos mis datos")."""
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archivo_zip:
        for entidad in ENTIDADES:
            contenido = "".join(generar_csv(entidad, empresa_id, desde, hasta))
            archivo_zip.writestr(nombre_archivo(entidad), contenido.encode("utf-8"))
    return buffer.getvalue()
