# Probar un respaldo restaurándolo en una base de PRUEBA

Un respaldo que nunca se probó no es un respaldo. Haz esta prueba al menos
una vez y repítela cuando cambie la versión de PostgreSQL.

> **NUNCA** restaures sobre la base de producción. Usa el proyecto de
> pruebas de Neon (`autofix-pruebas`) o una base PostgreSQL local vacía.

## 1. Consigue la URL de la base de prueba

En el panel de Neon, copia la **URL DIRECTA** (sin `-pooler`) del proyecto
de pruebas. Guárdala solo en una variable de entorno de tu terminal:

```powershell
$env:URL_PRUEBA = "postgresql://.../autofix_pruebas?sslmode=require"
```

## 2. Restaura el respaldo

```powershell
pg_restore --no-owner --no-acl --clean --if-exists -d $env:URL_PRUEBA "respaldos\autofix_AAAA-MM-DD_HHMM.dump"
```

- `--no-owner --no-acl`: no intenta recrear dueños ni permisos del servidor
  original (útil al pasar de Render a Neon).
- `--clean --if-exists`: borra los objetos existentes antes de recrearlos.
  Úsalo **solo** en la base de prueba.

Si `pg_restore` avisa que la versión del servidor es menor que la del
respaldo, instala una versión de las herramientas cliente igual o mayor.
El respaldo se creó con `pg_dump -Fc` (formato personalizado).

## 3. Comprueba que hay datos

```sql
SELECT 'empresas' AS tabla, count(*) FROM empresas
UNION ALL SELECT 'usuarios', count(*) FROM usuarios
UNION ALL SELECT 'clientes', count(*) FROM clientes
UNION ALL SELECT 'vehiculos', count(*) FROM vehiculos
UNION ALL SELECT 'citas', count(*) FROM citas
UNION ALL SELECT 'ordenes_trabajo', count(*) FROM ordenes_trabajo
UNION ALL SELECT 'repuestos', count(*) FROM repuestos
UNION ALL SELECT 'facturas', count(*) FROM facturas
UNION ALL SELECT 'pagos', count(*) FROM pagos
UNION ALL SELECT 'auditoria', count(*) FROM auditoria;
```

Compara los conteos con la base original. Si coinciden, el respaldo sirve.

## 4. (Opcional) Verifica el esquema con Alembic

Con `DATABASE_URL` apuntando a la base de prueba **directa**:

```powershell
alembic check
```

Debe responder que no hay cambios pendientes.
