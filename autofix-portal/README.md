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

| Variable        | Descripción                                   | Ejemplo                                    |
| --------------- | --------------------------------------------- | ------------------------------------------ |
| `VITE_API_URL`  | URL de la API (opcional en dev: usa proxy)    | `https://autofix-api-tm6d.onrender.com`    |
| `VITE_APP_URL`  | URL de la app operativa (para entrar al panel) | `https://subtle-figolla-fb4cd0.netlify.app` |

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
2. Configuración del sitio:
   - **Base directory**: `autofix-portal`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   (ya vienen en `netlify.toml` si se usa esa base directory).
3. En *Site settings → Environment variables*:
   - `VITE_API_URL` = URL de la API en Render
   - `VITE_APP_URL` = URL del sitio Netlify de la app (`autofix-frontend`)
4. En **Render** (la API), agregar el origen del portal a `CORS_ORIGINS`,
   p. ej.: `https://TU-PORTAL.netlify.app` (lista separada por comas).
5. En el sitio Netlify de la **app** (`autofix-frontend`), definir
   `VITE_PORTAL_URL` = URL de este portal (para que `/login` redirija aquí).
