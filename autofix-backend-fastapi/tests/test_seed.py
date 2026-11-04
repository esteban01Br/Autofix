"""Pruebas de la configuración obligatoria del seed."""

import pytest

from app import seed as seed_module
from app.config import settings

VARIABLES = (
    "AUTOFIX_ADMIN_EMAIL",
    "AUTOFIX_ADMIN_PASSWORD",
    "AUTOFIX_SUPERADMIN_EMAIL",
    "AUTOFIX_SUPERADMIN_PASSWORD",
)


def test_seed_falla_si_falta_una_variable(monkeypatch):
    for nombre in VARIABLES:
        monkeypatch.delenv(nombre, raising=False)

    with pytest.raises(RuntimeError, match="AUTOFIX_ADMIN_EMAIL"):
        seed_module.seed()


def test_seed_falla_con_contrasena_corta(monkeypatch):
    monkeypatch.setenv("AUTOFIX_ADMIN_EMAIL", "admin.seed@prueba.com")
    monkeypatch.setenv("AUTOFIX_ADMIN_PASSWORD", "corta")
    monkeypatch.setenv("AUTOFIX_SUPERADMIN_EMAIL", "super.seed@prueba.com")
    monkeypatch.setenv("AUTOFIX_SUPERADMIN_PASSWORD", "ClaveSeguraPlataforma2026")

    with pytest.raises(RuntimeError, match="al menos 12 caracteres"):
        seed_module.seed()


def test_seed_falla_en_produccion_sin_credenciales(monkeypatch):
    """En producción nunca se usan credenciales por defecto del repositorio."""
    monkeypatch.setattr(settings, "ES_PRODUCCION", True)
    for nombre in VARIABLES:
        monkeypatch.delenv(nombre, raising=False)

    with pytest.raises(RuntimeError, match="AUTOFIX_ADMIN_EMAIL"):
        seed_module.seed()
