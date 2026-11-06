# Despliegue en Netlify

Esta guía cubre el despliegue de AutoFix en Netlify, separando el frontend del panel y el portal de ventas.

## 1. Portal de ventas (`autofix-portal`)

### Configuración base

En el panel de Netlify, añade un nuevo sitio:

- **Directorio de despliegue**: `autofix-portal`
- **Comando de build**: `npm run build`
- **Directorio de publicación**: `dist`
- **Versión de Node**: `20`

### Variables de entorno en Netlify

Añade las siguientes variables en la sección **Environment variables** del sitio Netlify:

| Variable | Valor en producción | Valor en desarrollo |
|---|---|---|
| `VITE_API_URL` | `https://autofix-api-tm6d.onrender.com` | Deja vacío (usará el proxy de Vite) |
| `VITE_APP_URL` | URL del despliegue Netlify del portal (ej. `https://tu-sitio.netlify.app`) | `http://localhost:5173` |

### Archivos de configuración

- `autofix-portal/netlify.toml` — ya creado con las secciones `[build]` y `[build.environment]`.
- `autofix-portal/public/_redirects` — conserva el contenido (redirige SPA).
- `autofix-portal/public/_headers` — conserva el contenido (cabeceras de seguridad).

### Legal y páginas públicas

- `/privacidad`, `/terminos`, `/contacto` — páginas públicas accesibles desde el footer.
- `public/robots.txt` — generado para los motores de búsqueda.

## 2. Panel del taller (`autofix-frontend`)

### Configuración base

En el panel de Netlify, añade un nuevo sitio:

- **Directorio de despliegue**: `autofix-frontend`
- **Comando de build**: `npm run build`
- **Directorio de publicación**: `dist`
- **Versión de Node**: `20`

### Variables de entorno en Netlify

| Variable | Valor en producción | Valor en desarrollo |
|---|---|---|
| `VITE_API_URL` | `https://autofix-api-tm6d.onrender.com` | Deja vacío (usará el proxy de Vite) |
| `VITE_PORTAL_URL` | URL del despliegue Netlify del portal (ej. `https://tu-sitio.netlify.app`) | `http://localhost:5174` |
| `VITE_APP_URL` | URL del propio panel (ej. `https://tu-panel.netlify.app`) | `http://localhost:5174` |

### Archivos de configuración

- `autofix-frontend/netlify.toml` — ya creado.
- `autofix-frontend/public/_redirects` — **quita el comentario "Cloudflare Pages"** (quedará solo la regla `/* /index.html 200`).
- `autofix-frontend/public/_headers` — conserva el contenido de cabeceras de seguridad.

### Legal y enlaces en el UI

Los componentes `Footer`, `RegistroEmpresa`, `Login` y `Comprar` usan las variables `VITE_PORTAL_URL` para enlazar a `/privacidad`, `/terminos` y `/contacto`. En producción estas URLs serán los dominios Netlify del portal.

## 3. Backend (Render)

El backend FastAPI sigue desplegado en **Render** como servicio web. No requiere cambios en la configuración actual, solo asegúrate de tener definidas en Render las siguientes variables de entorno (con `sync: false`):

- `CORS_ORIGINS` — origenes separados por comma (la URL del frontend en Netlify).
- `SECRET_KEY` — generada por Render.
- `DATABASE_URL` — desde la base de datos PostgreSQL vinculada.
- `AUTOFIX_ADMIN_EMAIL`, `AUTOFIX_ADMIN_PASSWORD`, `AUTOFIX_SUPERADMIN_EMAIL`, `AUTOFIX_SUPERADMIN_PASSWORD` — credenciales iniciales.
- `VITE_API_URL`, `VITE_PORTAL_URL`, `VITE_APP_URL` **no** forman parte de Render; son exclusivas de Vite en el frontend.

## 4. Pasos después del despliegue

1. Una vez que ambos sitios de Netlify estén vivos, ve a cada uno y añade el dominio propio (si lo tienes) o usa el subdominio `.netlify.app`.
2. Verifica que el portal sea accesible en `VITE_APP_URL` y que el panel en `VITE_APP_URL`.
3. Prueba el flujo: entra al portal → login → redirección al panel con fragmento `#token=...`.
4. Revisa los logs de Netlify si hay errores de build; el comando `npm run build` debe terminar exitosamente en ambos proyectos.
5. Si agregas un dominio personalizado, recuerda configurar los DNS apuntando a Netlify y esperar la verificación SSL.

## 5. Rollback

Si algo falla, en Netlify puedes usar el historial de despliegues para volver a una versión anterior. Los cambios de variables de entorno son inmediatos tras el próximo despliegue.