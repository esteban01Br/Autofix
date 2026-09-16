"""Crea un usuario administrador por defecto (seguro de ejecutar varias veces).

Las credenciales se leen de variables de entorno (con fallback solo para
desarrollo local). Uso:
    python -m app.seed
"""

import os

from app.crud import usuario as crud_usuario
from app.database import Base, SessionLocal, engine
from app.models.enums import Rol
from app.models.usuario import Usuario
from app.security import hash_password

CORREO_ADMIN: str = os.getenv("AUTOFIX_ADMIN_EMAIL", "admin@autofix.com")
CONTRASENA_ADMIN: str = os.getenv("AUTOFIX_ADMIN_PASSWORD", "Admin123!")


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if crud_usuario.exists_correo(db, CORREO_ADMIN):
            print(f"El administrador ya existe: {CORREO_ADMIN}")
            return

        admin = Usuario(
            nombre="Admin",
            apellido="AutoFix",
            correo=CORREO_ADMIN,
            contrasena=hash_password(CONTRASENA_ADMIN),
            telefono=None,
            rol=Rol.ADMIN,
            activo=True,
        )
        db.add(admin)
        db.commit()
        print(f"Administrador creado: {CORREO_ADMIN} / {CONTRASENA_ADMIN}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()