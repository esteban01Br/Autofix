"""Punto de entrada de AutoFix API (FastAPI)."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    auth,
    citas,
    clientes,
    detalles,
    facturas,
    mecanicos,
    ordenes,
    repuestos,
    usuarios,
    vehiculos,
)
from app.config import settings
from app.database import Base, engine
from app.errors import unhandled_exception_handler, validation_exception_handler
import app.models  # noqa: F401  (importa y registra todos los modelos)

OPENAPI_TAGS = [
    {"name": "Autenticación", "description": "Inicio de sesión, registro y perfil (JWT)."},
    {"name": "Usuarios", "description": "Gestión de usuarios. Solo administradores."},
    {"name": "Clientes", "description": "Gestión de clientes del taller."},
    {"name": "Vehículos", "description": "Gestión de vehículos registrados."},
    {"name": "Mecánicos", "description": "Gestión de mecánicos del taller."},
    {"name": "Citas", "description": "Agendamiento de citas de servicio."},
    {"name": "Órdenes de Trabajo", "description": "Órdenes de trabajo y su estado."},
    {"name": "Detalles de Orden", "description": "Repuestos asignados a cada orden."},
    {"name": "Repuestos", "description": "Inventario de repuestos."},
    {"name": "Facturas", "description": "Facturación automática por orden de trabajo."},
]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Crea las tablas si no existen (suficiente para el entorno de desarrollo).
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_tags=OPENAPI_TAGS,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Manejadores de errores
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Rutas
app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(vehiculos.router)
app.include_router(mecanicos.router)
app.include_router(citas.router)
app.include_router(ordenes.router)
app.include_router(detalles.router)
app.include_router(repuestos.router)
app.include_router(facturas.router)


@app.get("/", tags=["Estado"], summary="Información de la API")
def raiz() -> dict:
    return {
        "nombre": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "documentacion": "/docs",
        "estado": "operativo",
    }