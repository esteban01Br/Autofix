"""Esquemas base comunes."""

import re

from pydantic import BaseModel, ConfigDict

LONGITUD_MINIMA_CONTRASENA = 10

# Lista corta de contraseñas demasiado comunes (comparación en minúsculas).
CONTRASENAS_COMUNES = {
    "1234567890",
    "12345678901",
    "123456789012",
    "contrasena1",
    "contrasena123",
    "password1",
    "password12",
    "password123",
    "admin12345",
    "admin123456",
    "qwerty12345",
    "abc1234567",
    "autofix123",
    "taller1234",
}


class ORMModel(BaseModel):
    """Esquema que puede construirse directamente desde un ORM."""

    model_config = ConfigDict(from_attributes=True)


def validar_contrasena(valor: str | None) -> str | None:
    """Valida la política de contraseñas del sistema.

    Mínimo 10 caracteres, al menos una letra y al menos un número. No se
    exigen mayúsculas ni símbolos a propósito: la longitud y la variedad
    básica protegen más sin volver la clave difícil de recordar. Las claves
    de la lista corta de contraseñas comunes se rechazan.
    """
    if valor is None:
        return None
    if len(valor) < LONGITUD_MINIMA_CONTRASENA:
        raise ValueError(
            f"La contraseña debe tener al menos {LONGITUD_MINIMA_CONTRASENA} caracteres"
        )
    if not re.search(r"[A-Za-z]", valor):
        raise ValueError("La contraseña debe contener al menos una letra")
    if not re.search(r"\d", valor):
        raise ValueError("La contraseña debe contener al menos un número")
    if valor.lower() in CONTRASENAS_COMUNES:
        raise ValueError("La contraseña es demasiado común; elige otra")
    return valor
