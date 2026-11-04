"""Lógica de negocio de autenticación (login/registro)."""

from datetime import timedelta

from fastapi import HTTPException
from sqlalchemy import select

from app.crud import usuario as crud_usuario
from app.crud import base as crud_base
from app.models.empresa import Empresa
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.usuario import CambioContrasenaRequest
from app.security import create_access_token, hash_password, verify_password
from app.services import auditoria_service, suscripcion_service
from app.utils import ahora_utc

MAX_INTENTOS_FALLIDOS = 5
MINUTOS_BLOQUEO = 15


def login(db, payload: LoginRequest) -> TokenResponse:
    usuario = crud_usuario.get_by_correo(db, payload.correo)

    # Bloqueo temporal POR CUENTA (el límite por IP vive en app/limiter.py).
    # Se revisa antes de validar la clave: mientras esté bloqueado, ni
    # siquiera una contraseña correcta abre sesión.
    if usuario is not None and usuario.bloqueado_hasta is not None:
        if usuario.bloqueado_hasta > ahora_utc():
            raise HTTPException(
                status_code=429,
                detail="Demasiados intentos. Intenta de nuevo en unos minutos.",
                headers={"Retry-After": str(MINUTOS_BLOQUEO * 60)},
            )
        # El bloqueo ya expiró: se limpia y se permite el intento.
        usuario.bloqueado_hasta = None
        usuario.intentos_fallidos = 0
        crud_base.actualizar(db, usuario)

    credenciales_ok = (
        usuario is not None
        and usuario.activo
        and verify_password(payload.contrasena, usuario.contrasena)
    )

    # No se revela si el correo existe o no; siempre "Credenciales incorrectas".
    if not credenciales_ok:
        if usuario is not None:
            usuario.intentos_fallidos = (usuario.intentos_fallidos or 0) + 1
            if usuario.intentos_fallidos >= MAX_INTENTOS_FALLIDOS:
                usuario.bloqueado_hasta = ahora_utc() + timedelta(
                    minutes=MINUTOS_BLOQUEO
                )
                usuario.intentos_fallidos = 0
            crud_base.actualizar(db, usuario)

        # En LOGIN_FALLIDO con correo inexistente no se guarda el correo
        # escrito (evita llenar la auditoría con datos de terceros).
        auditoria_service.registrar(
            db,
            empresa_id=usuario.empresa_id if usuario is not None else None,
            usuario_id=usuario.id if usuario is not None else None,
            accion="LOGIN_FALLIDO",
            entidad="Usuario",
            entidad_id=usuario.id if usuario is not None else None,
            detalle="Credenciales incorrectas.",
        )
        raise HTTPException(
            status_code=401,
            detail="Credenciales incorrectas.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Login correcto: se reinicia el contador de intentos fallidos.
    if usuario.intentos_fallidos or usuario.bloqueado_hasta is not None:
        usuario.intentos_fallidos = 0
        usuario.bloqueado_hasta = None
        crud_base.actualizar(db, usuario)

    # Acceso privado por empresa (portal /acceso/{slug}): si el login viene
    # de la URL de una empresa, el usuario debe pertenecer a esa empresa.
    if payload.slug:
        empresa = db.get(Empresa, usuario.empresa_id) if usuario.empresa_id else None
        if usuario.rol != Rol.SUPERADMIN and (
            empresa is None or empresa.slug != payload.slug.strip().lower()
        ):
            raise HTTPException(
                status_code=404, detail="Este acceso no corresponde a tu empresa."
            )

    # Suscripción de la empresa vencida → no se abre sesión (Fase 4 — SaaS).
    suscripcion_service.verificar_acceso(db, usuario)

    token = create_access_token(
        correo=usuario.correo,
        usuario_id=usuario.id,
        rol=usuario.rol.value,
        empresa_id=usuario.empresa_id,
        debe_cambiar=usuario.debe_cambiar_contrasena,
    )
    auditoria_service.registrar(
        db,
        empresa_id=usuario.empresa_id,
        usuario_id=usuario.id,
        accion="LOGIN_OK",
        entidad="Usuario",
        entidad_id=usuario.id,
        detalle=f"Rol {usuario.rol.value}",
    )
    return TokenResponse(
        token=token, debeCambiarContrasena=usuario.debe_cambiar_contrasena
    )


def register(db, payload: RegisterRequest) -> TokenResponse:
    correo = payload.correo.strip().lower()
    if crud_usuario.exists_correo(db, correo):
        raise HTTPException(status_code=409, detail="Ya existe un usuario con ese correo.")

    # El auto-registro público exige el slug de la empresa: nunca se asigna
    # a la primera empresa de la plataforma por defecto.
    empresa = db.scalar(
        select(Empresa).where(Empresa.slug == payload.slug.strip().lower())
    )
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada.")

    # El auto-registro solo permite el rol CLIENTE; ADMIN/MECANICO
    # solo se crean por un administrador (endpoint /api/usuarios).
    usuario = Usuario(
        nombre=payload.nombre.strip(),
        apellido=payload.apellido.strip(),
        correo=correo,
        contrasena=hash_password(payload.contrasena),
        telefono=payload.telefono,
        rol=Rol.CLIENTE,
        activo=True,
        empresa_id=empresa.id,
    )
    crud_base.crear(db, usuario)

    token = create_access_token(
        correo=usuario.correo,
        usuario_id=usuario.id,
        rol=usuario.rol.value,
        empresa_id=usuario.empresa_id,
        debe_cambiar=usuario.debe_cambiar_contrasena,
    )
    return TokenResponse(token=token, debeCambiarContrasena=usuario.debe_cambiar_contrasena)


def cambiar_contrasena(db, usuario: Usuario, payload: CambioContrasenaRequest) -> TokenResponse:
    """El usuario cambia su propia contraseña (obligatorio si es temporal)."""
    if not verify_password(payload.contrasena_actual, usuario.contrasena):
        raise HTTPException(status_code=400, detail="La contraseña actual no es correcta.")

    usuario.contrasena = hash_password(payload.contrasena_nueva)
    usuario.debe_cambiar_contrasena = False
    crud_base.actualizar(db, usuario)

    token = create_access_token(
        correo=usuario.correo,
        usuario_id=usuario.id,
        rol=usuario.rol.value,
        empresa_id=usuario.empresa_id,
        debe_cambiar=False,
    )
    return TokenResponse(token=token, debeCambiarContrasena=False)
