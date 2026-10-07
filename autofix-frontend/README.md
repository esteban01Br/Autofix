# AutoFix Frontend (React + Vite)

Interfaz web de AutoFix, el sistema de gestión para taller mecánico.
SPA en React con tema oscuro personalizado, diseño responsive y escáner
de códigos de barras con la cámara del dispositivo.

## Tecnologías

- **React 19** + **Vite 8** (con `@vitejs/plugin-react-swc`)
- **Tailwind CSS 4** (tema oscuro del taller)
- **React Router 7** (rutas protegidas por rol)
- **Axios** (cliente HTTP con interceptor de token JWT)
- **Lucide** (iconos)
- **ZXing** (`@zxing/browser`) — escáner de códigos de barras con la cámara

## Estructura

```
src/
├── pages/            # Login, Dashboard, Clientes, Vehículos, Citas,
│                     # Mecánicos, Órdenes, Repuestos, Facturas, Usuarios
├── components/       # Sidebar, Header, Modal, EscanerCodigo, Badge,
│                     # EmptyState, Spinner, ConfirmDialog, PageHeader...
├── layouts/          # DashboardLayout (menú lateral responsive)
├── services/         # Clientes HTTP por módulo (api.js: axios + JWT)
├── context/          # AuthContext (sesión) y ToastContext (avisos)
└── lib/              # Utilidades (formato de moneda, errores)
```

## Desarrollo local

El proxy de Vite (ver `vite.config.js`) reenvía `/api` al backend local
automáticamente, así que no hace falta configurar nada:

```bash
npm install
npm run dev     # http://localhost:5173
```

> Desde la raíz del repo, `..\start-dev.ps1` levanta frontend + backend juntos.

## Variables de entorno

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL del backend en producción (ej. `https://autofix-api.onrender.com`). En desarrollo no hace falta (usa el proxy). Se define en Netlify y se incrusta al compilar. |

## Compilar para producción

```bash
npm run build   # genera dist/
```

El archivo `public/_redirects` se copia a `dist/` y le indica a Netlify que
todas las rutas las maneja React Router (SPA). El `netlify.toml` de la raíz
del repo configura el build automáticamente.

## Módulos

- **Login** (con validación y mensajes claros de error)
- **Dashboard** (métricas del taller y órdenes recientes)
- **Usuarios** (solo ADMIN)
- **Clientes** y **Vehículos**
- **Citas** (agendamiento con estados)
- **Mecánicos** (solo ADMIN)
- **Órdenes de trabajo** (estados, repuestos consumidos, mecánico asignado)
- **Repuestos** (inventario + **escáner de código de barras** 📷)
- **Facturas** (IVA 19% automático)

## Escáner de códigos de barras

En el módulo **Repuestos**, el botón **Escanear** abre la cámara:

- Código **nuevo** → abre el formulario de registro con el código ya diligenciado.
- Código **existente** → abre el ajuste de stock de ese repuesto.

La cámara requiere HTTPS (Netlify) o `localhost`; el navegador pedirá
permiso la primera vez. Soporta EAN-13, EAN-8, CODE-128, CODE-39 y QR.
