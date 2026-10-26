"""Micro-migraciones para bases de datos existentes.

El proyecto crea las tablas con ``Base.metadata.create_all`` (sin Alembic),
lo cual crea tablas nuevas pero **no agrega columnas** a tablas que ya
existen. Estas funciones complementan eso de forma idempotente: se pueden
ejecutar en cada arranque sin riesgo.

Nota: se ejecutan en AUTOCOMMIT porque algunos pasos lo requieren
(PRAGMA de SQLite no funciona dentro de transacciones y
``ALTER TYPE ... ADD VALUE`` de PostgreSQL tampoco en versiones antiguas).
"""

from datetime import timedelta

from sqlalchemy import inspect, text

from app.database import engine
from app.utils import ahora_utc, generar_slug

# Tablas operativas que reciben empresa_id (usuarios tiene flujo propio).
TABLAS_CON_EMPRESA = [
    "clientes",
    "vehiculos",
    "citas",
    "mecanicos",
    "ordenes_trabajo",
    "repuestos",
    "facturas",
]


def _es_sqlite() -> bool:
    return engine.dialect.name == "sqlite"


def _columnas(insp, tabla: str) -> set[str]:
    return {c["name"] for c in insp.get_columns(tabla)}


# ------------------------------------------------------------------
# Código de barras en repuestos (primera migración del proyecto)
# ------------------------------------------------------------------
def _asegurar_codigo_barras_repuestos(conn, insp) -> None:
    if "repuestos" not in insp.get_table_names():
        return  # Tabla nueva: create_all la crea completa.
    if "codigo_barras" not in _columnas(insp, "repuestos"):
        conn.execute(
            text("ALTER TABLE repuestos ADD COLUMN codigo_barras VARCHAR(50)")
        )


# ------------------------------------------------------------------
# Fase 1 multiempresa
# ------------------------------------------------------------------
def _empresa_defecto_id(conn) -> int:
    """Devuelve el id de la empresa por defecto, creándola si no existe.

    Los valores NOT NULL se incluyen explícitamente porque un INSERT
    directo en SQL no aplica los defaults de Python del modelo.
    """
    fila = conn.execute(text("SELECT id FROM empresas ORDER BY id LIMIT 1")).first()
    if fila:
        return fila[0]
    conn.execute(
        text(
            "INSERT INTO empresas (nombre, nit, color_primario, color_secundario,"
            " iva_porcentaje, consecutivo_factura, activa, fecha_creacion)"
            " VALUES ('AutoFix', '900.000.000-1', '#663af3', '#05060f',"
            " 19.00, 0, TRUE, CURRENT_TIMESTAMP)"
        )
    )
    return conn.execute(text("SELECT id FROM empresas ORDER BY id LIMIT 1")).first()[0]


def _migrar_usuarios(conn, insp, empresa_id: int) -> None:
    """Agrega empresa_id/sucursal_id a usuarios.

    En SQLite la tabla debe reconstruirse: el CHECK del enum ``rol`` de la
    tabla vieja no conoce SUPERADMIN y SQLite no permite alterarlo.
    """
    if "usuarios" not in insp.get_table_names():
        return

    # Siempre asegurar la columna debe_cambiar_contrasena (añadida tras la
    # migración inicial multiempresa; puede faltar en bases parcialmente migradas).
    if "debe_cambiar_contrasena" not in _columnas(insp, "usuarios"):
        if _es_sqlite():
            conn.execute(
                text(
                    "ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena"
                    " INTEGER NOT NULL DEFAULT 0"
                )
            )
        else:
            conn.execute(
                text(
                    "ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena"
                    " BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        insp = inspect(engine)

    if "empresa_id" in _columnas(insp, "usuarios"):
        return

    if _es_sqlite():
        from app.models.usuario import Usuario

        # legacy_alter_table evita que el RENAME reescriba las llaves
        # foráneas de otras tablas (clientes/mecanicos -> usuarios).
        conn.execute(text("PRAGMA legacy_alter_table=ON"))
        conn.execute(text("PRAGMA foreign_keys=OFF"))
        conn.execute(text("ALTER TABLE usuarios RENAME TO usuarios_vieja"))
        # Los índices se mueven con la tabla renombrada conservando su
        # nombre: hay que soltarlos para poder crearlos en la tabla nueva.
        indices = conn.execute(text("PRAGMA index_list('usuarios_vieja')")).fetchall()
        for fila in indices:
            nombre_indice = fila[1]
            if str(nombre_indice).startswith("sqlite_autoindex"):
                continue  # los auto-índices mueren con la tabla al soltarla
            conn.execute(text(f'DROP INDEX IF EXISTS "{nombre_indice}"'))
        Usuario.__table__.create(bind=conn)
        conn.execute(
            text(
                "INSERT INTO usuarios (id, nombre, apellido, correo, contrasena,"
                " telefono, rol, activo, empresa_id, sucursal_id,"
                " fecha_creacion, fecha_actualizacion)"
                f" SELECT id, nombre, apellido, correo, contrasena, telefono,"
                f" rol, activo, {empresa_id}, NULL,"
                " fecha_creacion, fecha_actualizacion FROM usuarios_vieja"
            )
        )
        conn.execute(text("DROP TABLE usuarios_vieja"))
        conn.execute(text("PRAGMA foreign_keys=ON"))
        conn.execute(text("PRAGMA legacy_alter_table=OFF"))
    else:
        conn.execute(
            text("ALTER TABLE usuarios ADD COLUMN empresa_id INTEGER REFERENCES empresas (id)")
        )
        conn.execute(
            text("ALTER TABLE usuarios ADD COLUMN sucursal_id INTEGER REFERENCES sucursales (id)")
        )
        conn.execute(
            text(
                "ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena BOOLEAN NOT NULL DEFAULT FALSE"
            )
        )
        conn.execute(
            text(
                "UPDATE usuarios SET empresa_id = :eid"
                " WHERE empresa_id IS NULL AND rol <> 'SUPERADMIN'"
            ),
            {"eid": empresa_id},
        )


def _agregar_empresa_id(conn, insp, tabla: str, empresa_id: int) -> None:
    if tabla not in insp.get_table_names():
        return
    if "empresa_id" in _columnas(insp, tabla):
        return

    if _es_sqlite():
        # SQLite permite NOT NULL con default constante en ADD COLUMN;
        # la llave foránea se valida a nivel ORM (SQLite no permite
        # REFERENCES con default no nulo en ADD COLUMN).
        conn.execute(
            text(f"ALTER TABLE {tabla} ADD COLUMN empresa_id INTEGER NOT NULL DEFAULT {empresa_id}")
        )
    else:
        conn.execute(text(f"ALTER TABLE {tabla} ADD COLUMN empresa_id INTEGER"))
        conn.execute(
            text(f"UPDATE {tabla} SET empresa_id = :eid WHERE empresa_id IS NULL"),
            {"eid": empresa_id},
        )
        conn.execute(text(f"ALTER TABLE {tabla} ALTER COLUMN empresa_id SET NOT NULL"))
        conn.execute(
            text(
                f"ALTER TABLE {tabla} ADD CONSTRAINT fk_{tabla}_empresa"
                " FOREIGN KEY (empresa_id) REFERENCES empresas (id)"
            )
        )


def _migrar_roles_postgres(conn) -> None:
    """Agrega los roles nuevos al enum nativo de PostgreSQL (idempotente)."""
    if _es_sqlite():
        return
    for rol in ("SUPERADMIN", "GERENTE", "ASESOR", "BODEGUERO", "CAJERO"):
        conn.execute(text(f"ALTER TYPE rol ADD VALUE IF NOT EXISTS '{rol}'"))


def _migrar_indice_codigo_barras(conn, insp) -> None:
    """El código de barras pasa de único global a único por empresa."""
    if "repuestos" not in insp.get_table_names():
        return
    if "empresa_id" not in _columnas(insp, "repuestos"):
        return
    conn.execute(text("DROP INDEX IF EXISTS ix_repuestos_codigo_barras"))
    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_repuestos_empresa_codigo"
            " ON repuestos (empresa_id, codigo_barras)"
        )
    )


def _migrar_indice_placa(conn, insp) -> None:
    """La placa pasa de única global a única por empresa."""
    if "vehiculos" not in insp.get_table_names():
        return
    if "empresa_id" not in _columnas(insp, "vehiculos"):
        return
    conn.execute(text("DROP INDEX IF EXISTS ix_vehiculos_placa"))
    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_vehiculos_empresa_placa"
            " ON vehiculos (empresa_id, placa)"
        )
    )


def _migrar_stock_minimo_y_fotos(conn, insp) -> None:
    """Agrega stock_minimo a repuestos y fotos a vehículos."""
    if "repuestos" in insp.get_table_names() and "stock_minimo" not in _columnas(insp, "repuestos"):
        conn.execute(
            text("ALTER TABLE repuestos ADD COLUMN stock_minimo INTEGER NOT NULL DEFAULT 0")
        )
    if "vehiculos" in insp.get_table_names() and "fotos" not in _columnas(insp, "vehiculos"):
        conn.execute(text("ALTER TABLE vehiculos ADD COLUMN fotos TEXT"))


def _migrar_numero_facturas(conn, insp) -> None:
    """Agrega el consecutivo FAC-0001 por empresa y lo rellena."""
    if "facturas" not in insp.get_table_names():
        return
    if "empresa_id" not in _columnas(insp, "facturas"):
        return

    if "numero" not in _columnas(insp, "facturas"):
        conn.execute(text("ALTER TABLE facturas ADD COLUMN numero VARCHAR(20)"))
        # Consecutivo por empresa según el orden de creación (id).
        if _es_sqlite():
            conn.execute(
                text(
                    "UPDATE facturas SET numero = printf('FAC-%04d',"
                    " (SELECT COUNT(*) FROM facturas f2"
                    "  WHERE f2.empresa_id = facturas.empresa_id"
                    "  AND f2.id <= facturas.id))"
                    " WHERE numero IS NULL"
                )
            )
        else:
            conn.execute(
                text(
                    "UPDATE facturas SET numero = 'FAC-' || lpad("
                    " (SELECT COUNT(*) FROM facturas f2"
                    "  WHERE f2.empresa_id = facturas.empresa_id"
                    "  AND f2.id <= facturas.id)::text, 4, '0')"
                    " WHERE numero IS NULL"
                )
            )
            conn.execute(text("ALTER TABLE facturas ALTER COLUMN numero SET NOT NULL"))

    conn.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS uq_facturas_empresa_numero"
            " ON facturas (empresa_id, numero)"
        )
    )
    # El contador de cada empresa arranca desde sus facturas existentes.
    conn.execute(
        text(
            "UPDATE empresas SET consecutivo_factura ="
            " (SELECT COUNT(*) FROM facturas WHERE facturas.empresa_id = empresas.id)"
        )
    )


def _migrar_pagos(conn, insp) -> None:
    """Agrega estado_pago/monto_pagado a facturas (Fase 3 — pagos).

    La tabla ``pagos`` la crea ``create_all`` (es nueva y su tipo enum
    ``metodo_pago`` se crea junto); aquí solo complementamos columnas
    de una tabla ``facturas`` ya existente.
    """
    if "facturas" not in insp.get_table_names():
        return
    cols = _columnas(insp, "facturas")

    if "monto_pagado" not in cols:
        conn.execute(
            text(
                "ALTER TABLE facturas ADD COLUMN monto_pagado"
                " NUMERIC(10,2) NOT NULL DEFAULT 0"
            )
        )

    if "estado_pago" not in cols:
        if _es_sqlite():
            # SQLite: VARCHAR con default constante (sin CHECK: la tabla
            # vieja no lo tiene y el ORM escribe valores válidos).
            conn.execute(
                text(
                    "ALTER TABLE facturas ADD COLUMN estado_pago VARCHAR(20)"
                    " NOT NULL DEFAULT 'PENDIENTE'"
                )
            )
        else:
            # PostgreSQL: el tipo enum debe existir antes del ADD COLUMN.
            existe = conn.execute(
                text(
                    "SELECT EXISTS (SELECT 1 FROM pg_type"
                    " WHERE typname = 'estado_pago_factura')"
                )
            ).scalar()
            if not existe:
                conn.execute(
                    text(
                        "CREATE TYPE estado_pago_factura AS ENUM"
                        " ('PENDIENTE','PARCIAL','PAGADA')"
                    )
                )
            conn.execute(
                text(
                    "ALTER TABLE facturas ADD COLUMN estado_pago"
                    " estado_pago_factura NOT NULL DEFAULT 'PENDIENTE'"
                )
            )


def _migrar_slug_y_suscripciones(conn, insp) -> None:
    """Agrega slug a empresas y crea la suscripción de las que no tienen.

    Fase 4 (SaaS): cada empresa necesita su URL de acceso confidencial
    y una suscripción vigente para poder iniciar sesión.
    """
    if "empresas" not in insp.get_table_names():
        return

    if "slug" not in _columnas(insp, "empresas"):
        conn.execute(text("ALTER TABLE empresas ADD COLUMN slug VARCHAR(80)"))
        usados: set[str] = set()
        filas = conn.execute(
            text("SELECT id, nombre FROM empresas ORDER BY id")
        ).fetchall()
        for fid, fnombre in filas:
            base = generar_slug(fnombre or "")
            candidato, intento = base, 2
            while candidato in usados:
                candidato = f"{base}-{intento}"
                intento += 1
            usados.add(candidato)
            conn.execute(
                text("UPDATE empresas SET slug = :slug WHERE id = :id"),
                {"slug": candidato, "id": fid},
            )
        conn.execute(
            text("CREATE UNIQUE INDEX IF NOT EXISTS uq_empresas_slug ON empresas (slug)")
        )

    # Suscripción de cortesía (12 meses) para empresas ya existentes.
    if "suscripciones" not in insp.get_table_names():
        return
    registradas = {
        fila[0]
        for fila in conn.execute(text("SELECT empresa_id FROM suscripciones")).fetchall()
    }
    fin = (ahora_utc() + timedelta(days=365)).isoformat(sep=" ")
    for (eid,) in conn.execute(text("SELECT id FROM empresas")).fetchall():
        if eid in registradas:
            continue
        conn.execute(
            text(
                "INSERT INTO suscripciones (empresa_id, plan, estado,"
                " fecha_inicio, fecha_fin, monto, fecha_creacion)"
                " VALUES (:eid, 'BASICO', 'ACTIVA',"
                " CURRENT_TIMESTAMP, :fin, 0, CURRENT_TIMESTAMP)"
            ),
            {"eid": eid, "fin": fin},
        )


def _migrar_cotizaciones(conn, insp) -> None:
    """Agrega el consecutivo COT-0001 por empresa (Fase 3 — cotizaciones).

    Las tablas ``cotizaciones`` y ``detalle_cotizacion`` las crea
    ``create_all`` (son nuevas); aquí solo complementamos la columna del
    consecutivo en ``empresas`` ya existente.
    """
    if "empresas" not in insp.get_table_names():
        return
    if "consecutivo_cotizacion" not in _columnas(insp, "empresas"):
        conn.execute(
            text(
                "ALTER TABLE empresas ADD COLUMN consecutivo_cotizacion"
                " INTEGER NOT NULL DEFAULT 0"
            )
        )
    # El contador arranca desde las cotizaciones ya registradas.
    if "cotizaciones" in insp.get_table_names():
        conn.execute(
            text(
                "UPDATE empresas SET consecutivo_cotizacion ="
                " (SELECT COUNT(*) FROM cotizaciones"
                "  WHERE cotizaciones.empresa_id = empresas.id)"
            )
        )


def _migrar_proveedores(conn, insp) -> None:
    """Agrega el vínculo repuesto→proveedor (Fase 3 — proveedores).

    La tabla ``proveedores`` la crea ``create_all`` (es nueva); aquí solo
    complementamos la columna ``proveedor_id`` en ``repuestos`` ya existente.
    """
    if "repuestos" not in insp.get_table_names():
        return
    if "proveedor_id" not in _columnas(insp, "repuestos"):
        conn.execute(
            text(
                "ALTER TABLE repuestos ADD COLUMN proveedor_id INTEGER"
                " REFERENCES proveedores(id)"
            )
        )


def _migrar_a_multiempresa(conn, insp) -> None:
    if "empresas" not in insp.get_table_names():
        return  # create_all aún no la crea (no debería pasar).

    # Asegurar columnas añadidas tras la migración inicial (idempotente),
    # incluso en bases que ya estaban migradas a multiempresa.
    if "usuarios" in insp.get_table_names() and "debe_cambiar_contrasena" not in _columnas(
        insp, "usuarios"
    ):
        if _es_sqlite():
            conn.execute(
                text(
                    "ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena"
                    " INTEGER NOT NULL DEFAULT 0"
                )
            )
        else:
            conn.execute(
                text(
                    "ALTER TABLE usuarios ADD COLUMN debe_cambiar_contrasena"
                    " BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )
        insp = inspect(engine)

    _migrar_roles_postgres(conn)

    # Solo las bases con datos legados necesitan empresa por defecto
    # para rellenar; en bases nuevas la crea el seed.
    hay_legado = (
        "usuarios" in insp.get_table_names()
        and "empresa_id" not in _columnas(insp, "usuarios")
    )
    empresa_id = _empresa_defecto_id(conn) if hay_legado else None

    if empresa_id is not None:
        _migrar_usuarios(conn, insp, empresa_id)
        for tabla in TABLAS_CON_EMPRESA:
            _agregar_empresa_id(conn, insp, tabla, empresa_id)
        # El inspector cachea el esquema: se refresca para que los pasos
        # siguientes vean las columnas recién agregadas.
        insp = inspect(engine)

    _migrar_indice_codigo_barras(conn, insp)
    _migrar_indice_placa(conn, insp)
    _migrar_stock_minimo_y_fotos(conn, insp)
    _migrar_numero_facturas(conn, insp)
    _migrar_pagos(conn, insp)
    _migrar_slug_y_suscripciones(conn, insp)
    _migrar_cotizaciones(conn, insp)
    _migrar_proveedores(conn, insp)


# ------------------------------------------------------------------
def aplicar_migraciones() -> None:
    """Ejecuta todas las micro-migraciones pendientes (idempotente)."""
    insp = inspect(engine)
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        _asegurar_codigo_barras_repuestos(conn, insp)
        _migrar_a_multiempresa(conn, insp)
