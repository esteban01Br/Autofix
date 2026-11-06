"""Punto de entrada de AutoFix API (FastAPI)."""

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded

from app.routers import (
    auditoria,
    auth,
    citas,
    clientes,
    cotizaciones,
    detalles,
    empresas,
    exportar,
    facturas,
    mecanicos,
    ordenes,
    proveedores,
    reportes,
    repuestos,
    servicios,
    suscripciones,
    usuarios,
    vehiculos,
)
from app.config import settings
from app.database import Base, engine
from app.errors import (
    rate_limit_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.limiter import limiter
from app.migrations import aplicar_migraciones
import app.models  # noqa: F401  (importa y registra todos los modelos)

OPENAPI_TAGS = [
    {"name": "Empresas", "description": "Registro y gestión de empresas (multiempresa)."},
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
    {"name": "Cotizaciones", "description": "Cotizaciones y propuestas de precio."},
    {"name": "Proveedores", "description": "Catálogo de proveedores de repuestos."},
    {"name": "Exportación", "description": "Descarga de los datos de la empresa en CSV."},
]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    # Crea las tablas si no existen (suficiente para el entorno de desarrollo).
    Base.metadata.create_all(bind=engine)
    # Agrega columnas nuevas a bases de datos ya existentes (idempotente).
    aplicar_migraciones()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    openapi_tags=OPENAPI_TAGS,
    docs_url="/docs" if settings.DOCS_ENABLED else None,
    redoc_url="/redoc" if settings.DOCS_ENABLED else None,
    openapi_url="/openapi.json" if settings.DOCS_ENABLED else None,
    lifespan=lifespan,
)

# Estado del limitador de peticiones (anti fuerza bruta)
app.state.limiter = limiter

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Cabeceras de seguridad HTTP en todas las respuestas
@app.middleware("http")
async def cabeceras_seguridad(request: Request, call_next):
    respuesta = await call_next(request)
    respuesta.headers.setdefault("X-Content-Type-Options", "nosniff")
    respuesta.headers.setdefault("X-Frame-Options", "DENY")
    respuesta.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
    respuesta.headers.setdefault(
        "Permissions-Policy", "camera=(), microphone=(), geolocation=()"
    )
    if settings.ES_PRODUCCION:
        # En producción el tráfico va por HTTPS (Render/Netlify lo proveen).
        respuesta.headers.setdefault(
            "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
        )
    return respuesta


# Manejadores de errores
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(RateLimitExceeded, rate_limit_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# Rutas
app.include_router(auth.router)
app.include_router(empresas.router)
app.include_router(exportar.router)
app.include_router(auditoria.router)
app.include_router(reportes.router)
app.include_router(usuarios.router)
app.include_router(clientes.router)
app.include_router(vehiculos.router)
app.include_router(mecanicos.router)
app.include_router(citas.router)
app.include_router(ordenes.router)
app.include_router(detalles.router)
app.include_router(repuestos.router)
app.include_router(proveedores.router)
app.include_router(servicios.router)
app.include_router(facturas.router)
app.include_router(cotizaciones.router)
app.include_router(suscripciones.router)


@app.get("/", tags=["Estado"], summary="Información de la API")
def raiz() -> dict:
    return {
        "nombre": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "documentacion": "/docs",
        "estado": "operativo",
    }