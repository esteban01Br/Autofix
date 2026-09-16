# AutoFix API (FastAPI)

Backend de AutoFix (gestión de taller mecánico) reescrito en Python/FastAPI
para cumplir con la rúbrica de la asignatura, conservando el backend Java
original (`../autofix-backend`) sin modificaciones.

## Requisitos

- Python 3.10+ (probado con Python 3.14)
- pip

## Estructura del proyecto

```
autofix-backend-fastapi/
├── app/
│   ├── api/          # Rutas (APIRouter, una por recurso)
│   ├── models/       # Modelos SQLAlchemy (ORM) con relaciones
│   ├── schemas/      # Esquemas Pydantic (entrada/salida) con validaciones
│   ├── crud/         # Capa CRUD genérica y por entidad
│   ├── services/     # Lógica de negocio (stock, IVA, estados, autenticación)
│   ├── main.py       # App FastAPI, CORS, Swagger y manejadores de errores
│   ├── config.py     # Configuración (variables de entorno)
│   ├── database.py   # Engine, sesión y get_db
│   ├── security.py   # JWT (PyJWT) y hash bcrypt
│   ├── deps.py       # get_current_user / require_roles
│   ├── errors.py     # Respuestas de error sin información sensible
│   ├── seed.py       # Crea el administrador por defecto
│   └── utils.py      # Utilidades (fechas)
├── tests/            # Pruebas con pytest + TestClient
├── requirements.txt
├── .env.example      # Plantilla de variables de entorno
└── run.py            # Arranque del servidor
```

## Puesta en marcha

```bash
# 1) Entorno virtual e instalación
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt

# 2) Variables de entorno (opcional, ya hay valores por defecto)
copy .env.example .env

# 3) Crear el administrador por defecto
python -m app.seed

# 4) Ejecutar el servidor (http://localhost:8081)
python run.py
```

Acceso por defecto: `admin@autofix.com` / `Admin123!`.

Documentación interactiva (Swagger) en `http://localhost:8081/docs`.

## Pruebas

```bash
.venv\Scripts\python.exe -m pytest tests -q
```

## Variables de entorno

| Variable | Descripción | Valor por defecto |
| --- | --- | --- |
| `DATABASE_URL` | Cadena de conexión SQLAlchemy | `sqlite:///./autofix.db` |
| `SECRET_KEY` | Clave secreta para firmar JWT | `cambiar-esta-clave-en-produccion` |
| `ALGORITHM` | Algoritmo JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token (min) | `1440` |
| `CORS_ORIGINS` | Orígenes permitidos (JSON) | `["http://localhost:5173"]` |
| `SERVER_HOST` | Host de uvicorn | `0.0.0.0` |
| `SERVER_PORT` | Puerto de uvicorn | `8081` |
| `DEBUG` | Modo debug | `false` |

## Contrato de la API (resumen)

- **Autenticación** (`/api/auth`): `POST /register`, `POST /login` (devolver:
  `{token, usuario}`; login fallido → 401 «Credenciales incorrectas.»),
  `GET /me`.
- **Recursos** (`/api/...`): `usuarios`, `clientes`, `vehiculos`, `citas`,
  `mecanicos`, `ordenes`, `detalles`, `repuestos`, `facturas`. Listados con
  filtros (`busqueda`, campos específicos), ordenamiento (`orden`,
  `direccion`), paginación (`limit`, `offset`) y cabecera `X-Total-Count`.
- **Roles**: leer cualquier usuario autenticado; crear/actualizar/eliminar solo
  administradores (401/403).
- **Lógica de negocio**: el IVA de factura es 19%; al agregar un detalle se
  descuenta stock y al eliminarlo se restaura; al marcar una orden como
  ENTREGADO se registra la fecha de salida; no se puede facturar dos veces la
  misma orden ni eliminar una orden facturada.