"""Datos iniciales de AutoFix (seguro de ejecutar varias veces).

- Empresa por defecto "AutoFix" (para datos de desarrollo/legados).
- Usuario administrador de esa empresa.
- Usuario SUPERADMIN de la plataforma (ve todas las empresas).

Las credenciales se leen de variables de entorno (con fallback solo para
desarrollo local). Uso:
    python -m app.seed
"""

import os

from sqlalchemy import select

from app.crud import usuario as crud_usuario
from app.database import Base, SessionLocal, engine
from app.migrations import aplicar_migraciones
from app.models.empresa import Empresa
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.security import hash_password

CORREO_ADMIN: str = os.getenv("AUTOFIX_ADMIN_EMAIL", "admin@autofix.com")
CONTRASENA_ADMIN: str = os.getenv("AUTOFIX_ADMIN_PASSWORD", "Admin123!")

CORREO_SUPERADMIN: str = os.getenv("AUTOFIX_SUPERADMIN_EMAIL", "superadmin@autofix.com")
CONTRASENA_SUPERADMIN: str = os.getenv("AUTOFIX_SUPERADMIN_PASSWORD", "Super123!")


def _asegurar_empresa_defecto(db) -> Empresa:
    """Devuelve la primera empresa; si no hay ninguna, crea 'AutoFix'."""
    empresa = db.scalar(select(Empresa).order_by(Empresa.id).limit(1))
    if empresa is None:
        empresa = Empresa(nombre="AutoFix", nit="900.000.000-1")
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
    print(f"Usuario creado: {correo} / {contrasena} (rol {rol.value})")


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    aplicar_migraciones()
    db = SessionLocal()
    try:
        empresa = _asegurar_empresa_defecto(db)
        _asegurar_usuario(
            db,
            correo=CORREO_ADMIN,
            contrasena=CONTRASENA_ADMIN,
            rol=Rol.ADMIN,
            empresa_id=empresa.id,
        )
        _asegurar_usuario(
            db,
            correo=CORREO_SUPERADMIN,
            contrasena=CONTRASENA_SUPERADMIN,
            rol=Rol.SUPERADMIN,
            empresa_id=None,
        )
    finally:
        db.close()


if __name__ == "__main__":
    seed()
