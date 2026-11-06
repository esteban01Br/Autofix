# Base de datos de AutoFix: Neon, Alembic, respaldos y acceso a datos

Este documento reúne las tareas que **ejecuta el usuario** (dueño/soporte).
El agente deja todo preparado; las acciones contra producción y contra el
panel de Neon/Render las hace una persona con acceso.

> **Regla de oro:** nunca escribas URLs de conexión, contraseñas ni llaves en
> archivos del repositorio (es público). Úsalas solo como variables de
> entorno de tu terminal o como secretos del panel de Render.

---

## 1. Entornos separados

| Entorno | Base de datos | Para qué |
|---|---|---|
| Desarrollo local | SQLite (`autofix.db`) | Trabajar en el equipo |
| Pruebas automáticas | SQLite temporal (`tests/test_autofix.db`) | `pytest` |
| Pruebas PostgreSQL | Proyecto Neon **autofix-pruebas** (Free, sin datos reales) | Probar migraciones |
| Producción | Proyecto Neon de producción (Launch) | Clientes reales |

`tests/conftest.py` aborta la suite si `DATABASE_URL` apunta a algo que no
sea SQLite. Así nadie corre las pruebas contra producción por error.

### Conexión a Neon: pooler vs. directa

Neon entrega dos cadenas para la misma base:

- **Pooler** (el host contiene `-pooler`): la usa la **aplicación** en
  `DATABASE_URL`. Es la que mejor soporta muchas conexiones cortas.
- **Directa** (sin `-pooler`): la usan **Alembic, `pg_dump` y `pg_restore`**.
  Se configura aparte en `DATABASE_URL_DIRECTA` (opcional). `alembic/env.py`
  la prefiere cuando existe.

Ambas incluyen `sslmode=require`; no quites ese parámetro.

El motor de SQLAlchemy configura, solo para PostgreSQL:

- `pool_pre_ping=True` (reconecta si Neon cerró la conexión por inactividad),
- `pool_size` / `max_overflow` (variables `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`),
- `pool_recycle=300`,
- `connect_timeout` (variable `DB_CONNECT_TIMEOUT`, por defecto 15 s).

Si con el pooler aparecen errores de *prepared statements*, prueba añadir
`connect_args={"prepare_threshold": None}` en `app/database.py` y valida
contra el proyecto de pruebas. **No se asume que sea necesario.**

---

## 2. Migraciones con Alembic

### Comandos básicos (desde `autofix-backend-fastapi`)

```powershell
# Aplicar todas las migraciones
alembic upgrade head

# Ver la revisión actual
alembic current

# Comprobar si los modelos y la base están sincronizados
alembic check
```

### Cambios futuros de tablas

1. Edita el modelo en `app/models/`.
2. `alembic revision --autogenerate -m "descripcion corta"`.
3. **Revisa** el archivo generado en `alembic/versions/` (nunca a ciegas).
4. `alembic upgrade head` en local y corre `pytest`.
5. Despliega: el arranque ejecutará las migraciones pendientes.

Nunca modifiques tablas de producción a mano. Los cambios destructivos se
hacen en dos despliegues: primero se deja de usar la columna, después se
borra.

> **Pendiente de verificación:** el baseline se validó en SQLite. Falta
> probarlo en el PostgreSQL del proyecto `autofix-pruebas` (los `Enum` y los
> índices se comportan distinto). Mientras no se haga, no se debe afirmar
> que funciona en PostgreSQL.

---

## 3. Pasar producción de Render a Neon (secuencia segura)

La ejecuta el usuario. No borres la base de Render hasta terminar y tener
un respaldo propio reciente.

1. **Respaldo inicial** de la base actual de Render (ver §4). Usa un
   `pg_dump` de versión **igual o mayor** a la del servidor de Render y
   anota esa versión.
2. **Despliega en Render la versión actual** (con `app/migrations.py` activo)
   y espera a que arranque. Ese arranque agrega las columnas nuevas a las
   tablas existentes, incluidas las de aceptación de términos.
3. Haz un **`pg_dump` final** y guárdalo fuera del repositorio.
4. **Crea el proyecto de producción en Neon** (plan Launch), con una versión
   de PostgreSQL igual o mayor a la de Render y en la región más cercana al
   servicio web. Base vacía.
5. **Restaura** el respaldo con la URL **directa** de Neon:

   ```powershell
   pg_restore --no-owner --no-acl -d "URL_DIRECTA_NEON" respaldo_final.dump
   ```

6. **Verifica conteos** de las tablas principales en Render y en Neon
   (usuarios, empresas, clientes, vehículos, citas, órdenes, repuestos,
   facturas, pagos, auditoría). Deben coincidir.
7. Con `DATABASE_URL` (y si aplica `DATABASE_URL_DIRECTA`) apuntando a Neon,
   desde tu terminal local:

   ```powershell
   $env:DATABASE_URL_DIRECTA = "postgresql://.../autofix?sslmode=require"  # solo en la terminal
   alembic check
   ```

   Debe decir que **no hay cambios pendientes**. Si lista diferencias,
   **no selles**: resuélvelas con una migración revisada.

8. **Sella** la versión de Alembic (solo escribe `alembic_version`; no
   modifica tablas):

   ```powershell
   alembic stamp head
   ```

9. En el **panel de Render**, cambia `DATABASE_URL` a la URL del **pooler**
   de Neon y redespliega.
10. Prueba: login, crear una orden, facturar, registrar un pago y ver el
    resumen de productividad.
11. Solo entonces considera retirar la base de Render (y revisa antes en la
    documentación de Render qué ocurre al quitar un recurso del Blueprint).

> Lo que se escriba en Render **después** del `pg_dump` final no pasa a
> Neon. Haz el cambio en un horario de poco uso y avisa a los usuarios.

### `render.yaml`

No se modifica hasta confirmar que el traslado funcionó. Cuando se confirme:
`DATABASE_URL` deja de ser `fromDatabase` y pasa a `sync: false`, y el valor
se pega únicamente en el panel de Render.

---

## 4. Copias de seguridad propias

Neon Launch conserva hasta 7 días de historial; el plan Free, 6 horas. Aun
así conviene tener copias **fuera de Neon**.

### Crear un respaldo

```powershell
$env:AUTOFIX_DB_URL_RESPALDO = "postgresql://.../autofix?sslmode=require"  # URL directa
.\scripts\respaldo.ps1
```

El script guarda en `respaldos\autofix_AAAA-MM-DD_HHMM.dump`, muestra el
tamaño y borra los respaldos de más de 30 días. `respaldos/` y `*.dump`
están en `.gitignore`: **un respaldo contiene datos de clientes y nunca debe
subirse al repositorio.**

### Probar la restauración

Sigue `scripts/restaurar-prueba.md`. Un respaldo que nunca se probó no es un
respaldo. Hazlo al menos una vez y repítelo si cambia la versión de
PostgreSQL.

### Sobre automatizar

No uses artefactos de GitHub Actions para guardar respaldos de producción:
en repositorios públicos los artefactos se pueden descargar. Si se
automatiza, usa almacenamiento privado (por ejemplo un bucket privado de
Cloudflare R2 u otro) y cifra el archivo antes de subirlo. Es una fase
aparte.

---

## 5. Ver los datos fácilmente

### 5.1 Para el dueño / soporte (técnico): herramienta gráfica

Opciones gratuitas: **DBeaver Community**, **pgAdmin 4** o **Beekeeper
Studio**.

Datos de conexión: los que muestra el panel de Neon (host, puerto 5432,
nombre de la base, usuario y clave), con SSL activado. Para mirar datos usa
la **URL directa**.

**Crea un usuario de solo lectura** (lo corres una vez con una cuenta
administradora; la clave la inventas tú y no se escribe en el repo):

```sql
CREATE ROLE lector LOGIN PASSWORD '<CLAVE_FUERTE_AQUI>';
GRANT CONNECT ON DATABASE <NOMBRE_DE_LA_BASE> TO lector;
GRANT USAGE ON SCHEMA public TO lector;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO lector;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO lector;

-- Los hashes de contraseña no deben verse ni en solo lectura:
REVOKE SELECT ON usuarios FROM lector;
CREATE VIEW v_usuarios AS
  SELECT id, nombre, apellido, correo, telefono, rol, activo, empresa_id
  FROM usuarios;
GRANT SELECT ON v_usuarios TO lector;
```

Notas:

- Verifica los nombres reales de las columnas en `app/models/usuario.py`
  antes de dar el SQL por bueno (hoy son los indicados arriba).
- La vista creada a mano no está en los modelos. Si quieres versionarla,
  créala con `op.execute(...)` en una migración de Alembic, no a mano en
  producción.
- Revisa en el panel de Neon si tu plan permite restringir IPs y, si
  existe, limita las que se conectan. No se asume que la opción exista.
- Trabaja con el usuario `lector` salvo tareas puntuales. El propietario de
  la base no se usa a diario ni se comparte.

### 5.2 Para los clientes del servicio (no técnicos): exportar desde la app

Nunca se da acceso directo a PostgreSQL. Cada cliente ve y saca sus datos
desde la aplicación:

- Botón **Exportar** en las listas de Clientes, Vehículos, Citas, Órdenes,
  Repuestos y Facturas. Solo lo ve el rol **ADMIN** y siempre exporta
  únicamente los datos de su propia empresa.
- En **Mi empresa**, botón **Descargar todos mis datos** (ZIP con un CSV
  por entidad).
- El CSV abre en Excel en español: UTF-8 con BOM, separador `;`, fechas en
  hora de Colombia y dinero como número. Las celdas de texto que empiezan
  con `=`, `+`, `-` o `@` se neutralizan para evitar fórmulas.
- Cada exportación queda registrada en auditoría con la acción
  `EXPORTAR_DATOS`.

### 5.3 Panel de plataforma (SUPERADMIN)

El rol SUPERADMIN ya tiene la página **Empresas**. Para soporte conviene
ampliarla (conteos por empresa, estado de suscripción, última actividad) en
vez de abrir la base de datos a más personas.

---

## 6. Neon: decisiones y costos

Datos tomados de las páginas oficiales de Neon y Render (noviembre de
2026). **Los precios cambian: confírmalos antes de pagar.**

Comparación hecha para producción:

- **Render Postgres de pago:** precio fijo (plan de 1 GB de RAM y 1 GB de
  disco); GB extra con costo adicional. Recuperación a un punto en el tiempo
  de 3 días (Hobby) o 7 (Pro, pago aparte).
- **Neon Launch:** sin mínimo mensual; cobro por CU-hora de cómputo y por
  GB-mes de almacenamiento; historial de hasta 7 días; *scale-to-zero* tras
  5 minutos que **sí se puede desactivar**; ramas (10 por proyecto).
- **Neon Free (solo pruebas):** 1 GB por proyecto, historial de 6 horas y
  *scale-to-zero* obligatorio a los 5 minutos.

### Decisiones que debe tomar el usuario

1. **Scale-to-zero en producción:** activado = pagas solo cuando hay uso,
   pero la primera consulta tras 5 min de inactividad tarda más;
   desactivado = sin esperas, pero pagas cómputo las 24 horas. Verifica el
   costo en la calculadora de precios de Neon.
2. **Región:** la base debe estar en la misma región (o la más cercana) al
   servicio web de Render. Mira la región de tu servicio en el panel de
   Render y compárala con las regiones que ofrece Neon al crear el proyecto.
   Si no hay una cercana, la latencia sube: replantea antes de migrar.
3. **Servicio web gratuito de Render:** se duerme por inactividad. Junto con
   el scale-to-zero de Neon, el primer acceso del día sufre dos arranques en
   frío. Para clientes de pago, considera subir el servicio web a un plan de
   pago y desactivar el scale-to-zero.
4. **Ramas de Neon:** sirven para probar una migración sobre una copia. Una
   rama de producción contiene datos reales: trátala con el mismo cuidado y
   bórrala al terminar.

> **Ojo con la facturación:** la página de precios de Neon indica que los
> planes se aplican por **organización**. Lo más probable es que necesites
> dos organizaciones (una Free para pruebas y otra Launch para producción),
> para no facturar por uso la base de pruebas. Confírmalo en el panel antes
> de pagar.

---

## 7. Datos personales (preparación, no asesoría legal)

AutoFix guarda datos personales de personas (nombres, teléfonos, correos,
placas, historial de servicios) en nombre de cada taller. En Colombia aplica
la **Ley 1581 de 2012**. El usuario debe consultarlo con un abogado antes de
vender.

Lo que ya está preparado en el producto:

- Páginas públicas en el portal: **Términos y condiciones** (`/terminos`) y
  **Política de tratamiento de datos** (`/privacidad`), enlazadas en el pie
  de página y en el registro de empresa. El texto es una base de trabajo:
  debe revisarlo/completarlo el responsable del negocio.
- Casilla **obligatoria** de aceptación al registrar una empresa. El backend
  rechaza el registro sin aceptación y guarda la fecha y la versión del
  texto aceptado (`empresas.fecha_aceptacion_terminos`,
  `empresas.version_terminos`).
- La exportación de datos sirve para atender solicitudes de acceso. Una
  función de borrado a solicitud queda como fase futura y debe definirse con
  el abogado (hay datos que se deben conservar, como las facturas).
