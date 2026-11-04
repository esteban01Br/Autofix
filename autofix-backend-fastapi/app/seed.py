"""Datos iniciales de AutoFix (seguro de ejecutar varias veces).

- Empresa por defecto "AutoFix" (para datos de desarrollo/legados).
- Usuario administrador de esa empresa.
- Usuario SUPERADMIN de la plataforma (ve todas las empresas).

Las credenciales se leen de variables de entorno obligatorias (definidas en
el archivo .env). Uso:
    python -m app.seed
"""

import os

from sqlalchemy import select

from app.config import settings
from app.crud import usuario as crud_usuario
from app.database import Base, SessionLocal, engine
from app.migrations import aplicar_migraciones
from app.models.empresa import Empresa
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.security import hash_password

VARIABLES_CREDENCIALES = (
    "AUTOFIX_ADMIN_EMAIL",
    "AUTOFIX_ADMIN_PASSWORD",
    "AUTOFIX_SUPERADMIN_EMAIL",
    "AUTOFIX_SUPERADMIN_PASSWORD",
)


def _exigir_credenciales_en_produccion() -> None:
    """En producción falla rápido si faltan las credenciales del seed.

    Nunca se usan claves por defecto: las cuatro variables son obligatorias.
    """
    if not settings.ES_PRODUCCION:
        return

    faltan = [
        nombre
        for nombre in VARIABLES_CREDENCIALES
        if not os.getenv(nombre, "").strip()
    ]
    if faltan:
        raise RuntimeError(
            "SEGURIDAD: en producción debes definir " + ", ".join(faltan)
        )


def _variable_obligatoria(nombre: str) -> str:
    valor = os.getenv(nombre, "").strip()
    if not valor:
        raise RuntimeError(
            f"Falta la variable de entorno {nombre}. "
            "Defínela en el archivo .env antes de ejecutar el seed."
        )
    return valor


def _leer_credenciales() -> tuple[str, str, str, str]:
    """Lee y valida las credenciales iniciales desde el entorno."""
    correo_admin = _variable_obligatoria("AUTOFIX_ADMIN_EMAIL")
    contrasena_admin = _variable_obligatoria("AUTOFIX_ADMIN_PASSWORD")
    correo_superadmin = _variable_obligatoria("AUTOFIX_SUPERADMIN_EMAIL")
    contrasena_superadmin = _variable_obligatoria("AUTOFIX_SUPERADMIN_PASSWORD")

    for nombre, contrasena in (
        ("AUTOFIX_ADMIN_PASSWORD", contrasena_admin),
        ("AUTOFIX_SUPERADMIN_PASSWORD", contrasena_superadmin),
    ):
        if len(contrasena) < 12:
            raise RuntimeError(
                f"La variable {nombre} debe tener al menos 12 caracteres."
            )

    return (
        correo_admin,
        contrasena_admin,
        correo_superadmin,
        contrasena_superadmin,
    )


def _asegurar_empresa_defecto(db) -> Empresa:
    """Devuelve la primera empresa; si no hay ninguna, crea 'AutoFix'."""
    empresa = db.scalar(select(Empresa).order_by(Empresa.id).limit(1))
    if empresa is None:
        empresa = Empresa(nombre="AutoFix", nit="900.000.000-1", slug="autofix")
        db.add(empresa)
        db.commit()
        db.refresh(empresa)
        print(f"Empresa por defecto creada: {empresa.nombre} (id {empresa.id})")
    return empresa


def _asegurar_usuario(
    db, *, correo: str, contrasena: str, rol: Rol, empresa_id: int | None
) -> None:
    if crud_usuario.exists_correo(db, correo):
        # Si el usuario existe sin empresa (y debería tener), se la asigna.
        usuario = crud_usuario.get_by_correo(db, correo)
        if empresa_id is not None and usuario.empresa_id is None:
            usuario.empresa_id = empresa_id
            db.commit()
            print(f"Usuario {correo} vinculado a la empresa {empresa_id}")
        else:
            print(f"El usuario ya existe: {correo}")
        return

    usuario = Usuario(
        nombre="Super" if rol == Rol.SUPERADMIN else "Admin",
        apellido="Plataforma" if rol == Rol.SUPERADMIN else "AutoFix",
        correo=correo,
        contrasena=hash_password(contrasena),
        telefono=None,
        rol=rol,
        activo=True,
        empresa_id=empresa_id,
    )
    db.add(usuario)
    db.commit()
    print(f"Usuario creado: {correo} (rol {rol.value})")


def seed() -> None:
    _exigir_credenciales_en_produccion()
    correo_admin, contrasena_admin, correo_superadmin, contrasena_superadmin = (
        _leer_credenciales()
    )

    Base.metadata.create_all(bind=engine)
    aplicar_migraciones()
    db = SessionLocal()
    try:
        empresa = _asegurar_empresa_defecto(db)
        _asegurar_usuario(
            db,
            correo=correo_admin,
            contrasena=contrasena_admin,
            rol=Rol.ADMIN,
            empresa_id=empresa.id,
        )
        _asegurar_usuario(
            db,
            correo=correo_superadmin,
            contrasena=contrasena_superadmin,
            rol=Rol.SUPERADMIN,
            empresa_id=None,
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
