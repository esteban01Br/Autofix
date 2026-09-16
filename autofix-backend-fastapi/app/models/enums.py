"""Enumerados del dominio de AutoFix."""

from enum import Enum


class Rol(str, Enum):
    ADMIN = "ADMIN"
    MECANICO = "MECANICO"
    CLIENTE = "CLIENTE"


class EstadoCita(str, Enum):
    PENDIENTE = "PENDIENTE"
    CONFIRMADA = "CONFIRMADA"
    CANCELADA = "CANCELADA"
    FINALIZADA = "FINALIZADA"


class EstadoOrden(str, Enum):
    RECIBIDO = "RECIBIDO"
    DIAGNOSTICO = "DIAGNOSTICO"
    EN_REPARACION = "EN_REPARACION"
    ESPERANDO_REPUESTOS = "ESPERANDO_REPUESTOS"
    LISTO = "LISTO"
    ENTREGADO = "ENTREGADO"