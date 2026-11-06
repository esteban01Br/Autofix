# AutoFix Portal de Ventas

Portal público del SaaS AutoFix: landing, planes, compra de suscripciones
(compra simulada) y **login**. Es una app Vite separada de `autofix-frontend`.

## Flujo

1. **Landing** (`/`): características y planes (catálogo desde `GET /api/suscripciones/planes`).
2. **Compra** (`/comprar/:planId`): registro de la empresa con el plan elegido
   (`POST /api/empresas/registro`) → crea empresa + suscripción de 12 meses.
3. **Éxito** (`/exito`): muestra la **URL privada de acceso** de la empresa
   (`/acceso/{slug}`) y deja entrar al administrador.
4. **Acceso por empresa** (`/acceso/{slug}`): página de login con el nombre y
   los colores de la empresa; el login va vinculado a ese `slug` (si el
   usuario no pertenece a esa empresa, la API responde 404).
5. Tras iniciar sesión, el portal entrega la sesión a la app con
   `APP_URL/?token=…` (la app no tiene login propio).

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL de la API (opcional en dev: usa proxy) | `https://autofix-api-tm6d.onrender.com` |
| `VITE_APP_URL` | URL de la app operativa (para entrar al panel) | `https://TU-PANEL.netlify.app` |

En desarrollo no hace falta ninguna: el proxy de Vite reenvía `/api` al
backend local (puertos 8081/8000) y la app se asume en `localhost:5173`.

## Desarrollo local

```powershell
npm install
npm run dev    # http://localhost:5174
```

(El launcher `.\start-dev.ps1` de la raíz ya arranca backend, app y portal.)

## Despliegue en Netlify

1. Crear un **sitio nuevo** en Netlify conectado al mismo repositorio.
2. Base directory: `autofix-portal`
3. Build command: `npm run build`
4. Publish directory: `dist`

En **Site settings → Environment variables**:
- `VITE_API_URL` = URL de la API en Render
- `VITE_APP_URL` = URL del sitio Netlify

La cámara requiere HTTPS (Netlify) o `localhost`; el navegador pedirá permiso la primera vez.

## Módulos

- **Landing** (con características y planes)
- **Compra** (registro de empresa y plan elegido)
- **Éxito** (URL privada de acceso)
- **Acceso por empresa** (login vinculado al `slug` de la empresa)

## Escáner de códigos de barras

En el módulo de repuestos, el botón **Escanear** abre la cámara:

- Código **nuevo** → abre el formulario de registro con el código ya diligenciado.
- Código **existente** → abre el ajuste de stock de ese repuesto.

La cámara requiere HTTPS (Netlify) o `localhost`; el navegador pedirá
permiso la primera vez.