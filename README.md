# 🛠️ AutoFix — Sistema de gestión para taller mecánico

> **Servicio técnico automotriz más simple, ordenado y rentable.**
> AutoFix es una aplicación web que permite administrar por completo un taller
> mecánico: clientes, vehículos, citas, órdenes de trabajo, inventario de
> repuestos y facturación, todo desde un solo panel con acceso por roles.

---

## ¿Para qué sirve AutoFix?

AutoFix digitaliza todo el ciclo de trabajo de un taller mecánico. En lugar de
manejar papel, hojas de cálculo o anotaciones sueltas, el dueño del taller y su
equipo registran cada operación en un solo sistema:

1. **Se registra el cliente y su vehículo.**
2. **Se agenda una cita** para el servicio.
3. **Se asigna el mecánico** y se abre **una orden de trabajo** (diagnóstico, reparación, entrega).
4. **Se consumen repuestos del inventario** — el stock se descuenta automáticamente.
5. **Se genera la factura** con IVA 19% calculado de forma automática.

A lo largo de todo el proceso, cada orden queda **trazable**: se sabe en qué
etapa está, qué repuestos usó, cuándo ingresó y cuándo salió, y a qué cliente se
le entregó.

---

## Funcionalidades principales

| Módulo | Qué permite hacer |
| --- | --- |
| **Panel (Dashboard)** | Resumen del taller: vehículos, citas, órdenes y repuestos registrados, con órdenes recientes. |
| **Inicio de sesión seguro** | Acceso con correo y contraseña encriptada (bcrypt) y token JWT. Mensajes claros cuando las credenciales son incorrectas. |
| **Usuarios** *(solo admin)* | Crear y administrar usuarios con roles: `ADMIN`, `MECANICO`, `CLIENTE`. |
| **Clientes** | Registro y búsqueda de clientes con su información de contacto. |
| **Vehículos** | Registro de vehículos por cliente (placa, marca, modelo, año, etc.). |
| **Citas** | Agendamiento de citas con estados: `PENDIENTE`, `CONFIRMADA`, `CANCELADA`, `FINALIZADA`. |
| **Mecánicos** | Administración del equipo de mecánicos. |
| **Órdenes de trabajo** | Órdenes con estados (`RECIBIDO`, `DIAGNÓSTICO`, `EN REPARACIÓN`, `ESPERANDO REPUESTOS`, `LISTO`, `ENTREGADO`) y registro automático de la fecha de salida. |
| **Repuestos** | Inventario con **descuento automático de stock** al usarlos en una orden y restauración al eliminarlos. |
| **Facturas** | Facturación automática por orden de trabajo con **IVA 19%**, sin posibilidad de doble facturación. |
| **Búsqueda rápida** | Barra de búsqueda en el encabezado para ir directo a cualquier módulo. |

### Acceso por roles

- **`ADMIN`**: acceso total (incluye usuarios, mecánicos y facturación).
- **`MECANICO`**: clientes, vehículos, citas, órdenes, repuestos y facturas.
- **`CLIENTE`**: panel, vehículos, citas y facturas.

---

## ¿Por qué es una buena aplicación para utilizar?

- 💰 **Ahorra tiempo:** facturas, stock y estados se generan solos; no hay que hacer cuentas manuales.
- ✅ **Evita errores:** el IVA se calcula automáticamente y no se permite facturar dos veces la misma orden.
- 📦 **Control de inventario en tiempo real:** el stock baja solo cuando se asigna un repuesto.
- 🧾 **Trazabilidad completa:** cada orden se puede seguir de principio a fin, con cliente, vehículo y mecánico.
- 🔒 **Segura:** contraseñas con bcrypt, tokens JWT y permisos por rol.
- 🖥️ **Un solo comando:** backend y frontend se levantan juntos con `.\start-dev.ps1`.
- 📱 **Diseño moderno y responsive:** funciona en computador, tablet y celular.

---

## Cómo ejecutar la aplicación

### Requisitos

- **Python 3.10+** (el backend corre en FastAPI en un entorno virtual propio).
- **Node.js 18+** (el frontend corre con Vite + React).
- **Windows** (PowerShell).

### Puesta en marcha (un solo comando)

Abre una terminal en la carpeta raíz del proyecto (`...\Autofix`) y ejecuta:

```powershell
.\start-dev.ps1
```

El script **prepara todo automáticamente** si es la primera vez:

1. Crea el entorno virtual del backend y instala `requirements.txt`.
2. Copia `.env.example` → `.env` si no existe.
3. Ejecuta el *seed* para crear el administrador por defecto.
4. Instala las dependencias del frontend si faltan.
5. Arranca **backend (uvicorn) y frontend a la vez en la misma terminal** y mantiene ambos a la vista.

> Si solo quieres preparar el entorno sin arrancar, usa: `.\start-dev.ps1 -Setup`

### Direcciones

| Servicio | URL |
| --- | --- |
| **Frontend (Vite)** | <http://localhost:5173> |
| **Backend (FastAPI)** | <http://localhost:8081> |
| **Documentación de la API (Swagger)** | <http://localhost:8081/docs> |

### Credenciales de acceso por defecto

| Campo | Valor |
| --- | --- |
| Correo | `admin@autofix.com` |
| Contraseña | `Admin123!` |

Para detener ambos servicios, presiona **`Ctrl+C`** en la terminal.

---

## Stack tecnológico

### Frontend (`autofix-frontend`)
- **React 19** + **Vite 8**
- **Tailwind CSS 4** (tema oscuro personalizado)
- **React Router** (navegación por módulos)
- **Axios** (consumo de la API) y **Lucide** (iconos)

### Backend (`autofix-backend-fastapi`)
- **Python** + **FastAPI**
- **SQLAlchemy 2** (ORM) + **SQLite** (sin necesidad de instalar base de datos)
- **JWT** (PyJWT) + **bcrypt** para autenticación segura
- **Pydantic** para validación de datos
- Tests con **pytest**

### Estructura del proyecto

```
Autofix/
├── start-dev.ps1                # Levanta backend + frontend (un solo comando)
├── autofix-backend-fastapi/     # API REST (FastAPI)
│   ├── app/                     # routers, models, schemas, crud, services...
│   ├── tests/                   # Pruebas automatizadas
│   └── run.py                   # Arranque del servidor
└── autofix-frontend/            # SPA (React + Vite)
    └── src/
        ├── pages/               # Login, Dashboard, Clientes, Vehículos, Citas...
        ├── components/          # Sidebar, Header, Tablas, Badges...
        ├── services/            # Clientes HTTP por módulo
        └── context/             # Sesión (auth) y notificaciones
```

---

## Documentación adicional

- **Backend:** `autofix-backend-fastapi/README.md` (instalación, contrato de la API, variables de entorno).
- **Frontend:** `autofix-frontend/README.md`.
- **API viva:** Swagger en <http://localhost:8081/docs>.