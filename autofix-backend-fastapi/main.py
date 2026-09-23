"""Punto de entrada alternativo para uvicorn.

Permite arrancar el servidor desde la raiz del backend con:

    python -m uvicorn main:app --reload
"""

from app.main import app  # noqa: F401