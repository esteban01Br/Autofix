"""Rutas de autenticaciÃ³n."""

from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from app.routers.deps import get_current_user
from app.database import get_db
from app.limiter import limiter
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.usuario import CambioContrasenaRequest, UsuarioResponse
from app.services import auth_service, usuario_service

router = APIRouter(prefix="/api/auth", tags=["AutenticaciÃ³n"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesiÃ³n",
    description="Autentica con correo y contraseÃ±a y devuelve un token JWT.",
)
@limiter.limit("10/minute")
def login(
    request: Request, payload: LoginRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    return auth_service.login(db, payload)


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuario",
    description="Crea un nuevo usuario con su contraseÃ±a hasheada y devuelve un token.",
)
@limiter.limit("5/minute")
def register(
    request: Request, payload: RegisterRequest, db: Session = Depends(get_db)
) -> TokenResponse:
    return auth_service.register(db, payload)


@router.get(
    "/me",
    response_model=UsuarioResponse,
    summary="Perfil del usuario autenticado",
    description="Devuelve los datos del usuario del token JWT vigente.",
)
def perfil_usuario(
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> UsuarioResponse:
    return usuario_service.to_response(usuario)


@router.post(
    "/cambiar-contrasena",
    response_model=TokenResponse,
    summary="Cambiar contraseña",
    description="Obligatorio cuando el login indica debeCambiarContrasena=true.",
)
def cambiar_contrasena(
    payload: CambioContrasenaRequest,
    db: Session = Depends(get_db),
    usuario: Usuario = Depends(get_current_user),
) -> TokenResponse:
    return auth_service.cambiar_contrasena(db, usuario, payload)