from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from app.schemas.cliente import ClienteCreate, ClienteResponse, ClienteUpdate
from app.schemas.vehiculo import (
    VehiculoCreate,
    VehiculoResponse,
    VehiculoResumen,
    VehiculoUpdate,
)
from app.schemas.cita import (
    CitaCreate,
    CitaEstadoRequest,
    CitaResponse,
    CitaUpdate,
)
from app.schemas.mecanico import (
    MecanicoCreate,
    MecanicoResponse,
    MecanicoResumen,
    MecanicoUpdate,
)
from app.schemas.repuesto import (
    AjusteStockRequest,
    RepuestoCreate,
    RepuestoResponse,
    RepuestoUpdate,
)
from app.schemas.orden_trabajo import (
    AsignarMecanicoRequest,
    OrdenTrabajoCreate,
    OrdenTrabajoEstadoRequest,
    OrdenTrabajoResponse,
    OrdenTrabajoUpdate,
)
from app.schemas.detalle_orden import (
    DetalleOrdenCreate,
    DetalleOrdenResponse,
    DetalleOrdenUpdate,
)
from app.schemas.factura import FacturaCreate, FacturaResponse

__all__ = [
    "LoginRequest",
    "RegisterRequest",
    "TokenResponse",
    "UsuarioCreate",
    "UsuarioUpdate",
    "UsuarioResponse",
    "ClienteCreate",
    "ClienteUpdate",
    "ClienteResponse",
    "VehiculoCreate",
    "VehiculoUpdate",
    "VehiculoResponse",
    "VehiculoResumen",
    "CitaCreate",
    "CitaUpdate",
    "CitaEstadoRequest",
    "CitaResponse",
    "MecanicoCreate",
    "MecanicoUpdate",
    "MecanicoResponse",
    "MecanicoResumen",
    "RepuestoCreate",
    "RepuestoUpdate",
    "RepuestoResponse",
    "AjusteStockRequest",
    "OrdenTrabajoCreate",
    "OrdenTrabajoUpdate",
    "OrdenTrabajoEstadoRequest",
    "AsignarMecanicoRequest",
    "OrdenTrabajoResponse",
    "DetalleOrdenCreate",
    "DetalleOrdenUpdate",
    "DetalleOrdenResponse",
    "FacturaCreate",
    "FacturaResponse",
]