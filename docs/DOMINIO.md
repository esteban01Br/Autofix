# Conectar un dominio propio a AutoFix

Esta guía describe cómo pasar el portal y el panel de `*.pages.dev` a un dominio
propio. No se asume ningún nombre de dominio: sustituye `tudominio.com` por el
que tengas registrado.

Arquitectura actual:

| Pieza | Hosting | Proyecto / URL actual |
| --- | --- | --- |
| Portal de ventas | Netlify | `autofix-portal` (despliegue Netlify) |
| Panel del taller | Netlify | `autofix-frontend` (despliegue Netlify) |
| API | Render | `autofix-api-tm6d.onrender.com` |

## 1. Elegir los nombres

Define dos nombres (o uno principal y un subdominio):

- Portal: por ejemplo `tudominio.com` o `www.tudominio.com`.
- Panel: por ejemplo `app.tudominio.com`.

No hace falta mover la API a un dominio propio para que esto funcione, pero
también puedes usar algo como `api.tudominio.com` si más adelante lo deseas.

## 2. Conectar el dominio en Netlify

Repite estos pasos en **cada** sitio de Netlify (portal y panel):

1. Ve a **Site settings → Domain → Add custom domain**.
2. Escribe el dominio elegido. Netlify generará el registro DNS automáticamente si el dominio está en su nombre, o te indicará los pasos si está en otro proveedor.
3. Espera a que el estado quede **Active** y verifica que Netlify emitió el certificado HTTPS.
4. Repite con el otro proyecto usando su propio dominio.

Recomendaciones:

- Espera a que el certificado esté activo antes de cambiar las variables de la
  aplicación.
- Mantén los archivos `public/_headers` y `public/_redirects` tal como están:
  las cabeceras de seguridad y el fallback de SPA siguen aplicando en el dominio
  propio.
- No borres los dominios `*.pages.dev` hasta comprobar que todo funciona.

## 3. Actualizar CORS en Render

La API solo acepta peticiones de los orígenes que estén en `CORS_ORIGINS`
(variable definida en el panel de Render, no en `render.yaml`).

1. Render Dashboard → servicio `autofix-api` → **Environment**.
2. Edita `CORS_ORIGINS` con los orígenes completos, separados por coma y **sin**
   barra final. Incluye el esquema (`https://`):

   ```text
   https://tudominio.com,https://www.tudominio.com,https://app.tudominio.com
   ```

3. Si durante la transición quieres seguir usando la URL antigua, agrega también
   los orígenes actuales:

   ```text
   https://autofix-portal.pages.dev,https://autofix-app.pages.dev
   ```

   *(Estos serán aceptados temporalmente mientras migras a los dominios Netlify.)*

4. Guarda y espera a que Render reinicie el servicio. Prueba el login desde el
   dominio nuevo; si el navegador bloquea la petición por CORS, revisa que el
   origen aparezca exactamente igual (esquema, subdominio y sin `/` final).

No escribas esta lista ni credenciales en archivos del repositorio.

## 4. Variables de Vite

Las URLs ya no están fijas en el código: se leen de variables de entorno de
Vite y los valores actuales quedan solo como respaldo. Configúralas en la
sección **Environment variables** de cada sitio Netlify (portal y panel) o en un
`.env.local` para pruebas locales.

Las variables de Vite se incorporan al proyecto durante el build. **Es obligatorio
desplegar dos veces**: primero al crear los sitios Netlify, y segundo después de
cambiar las variables, para que Vite las vuelva a incrustar.

### Portal (`autofix-portal`)

| Variable | Valor | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL pública de la API | `https://autofix-api-tm6d.onrender.com` |
| `VITE_APP_URL` | URL del panel | `https://app.tudominio.com` |

### Panel (`autofix-frontend`)

| Variable | Valor | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL pública de la API | `https://autofix-api-tm6d.onrender.com` |
| `VITE_PORTAL_URL` | URL del portal | `https://tudominio.com` |

Después de cambiar variables en Netlify, vuelve a desplegar el
proyecto para que Vite las incorpore al build.

## 5. Actualizar metadatos y enlaces absolutos

Al definir el dominio definitivo, revisa estos puntos:

- `autofix-portal/index.html`: `canonical`, `og:title`, `og:description` y
  `og:site_name`.
- `autofix-frontend/index.html`: `canonical` y metadatos `og:*`.
- `autofix-portal/src/config/negocio.js`: nombre, correo de contacto y ciudad
  del responsable (déjalos vacíos si aún no tienes los datos reales).
- Enlaces externos que se compartan con clientes (por ejemplo la URL de acceso
  privada que muestra la pantalla de compra) usarán automáticamente el dominio
  desde el que se abra el portal.

## 6. Orden recomendado de despliegue

1. Conecta los dominios en Netlify y espera el certificado.
2. Configura `VITE_APP_URL` y `VITE_PORTAL_URL` con los dominios nuevos.
3. Configura `VITE_API_URL` en ambos proyectos.
4. Agrega los dominios nuevos a `CORS_ORIGINS` en Render (mantén los viejos
   durante la transición).
5. Redespliega portal y panel.
6. Prueba: landing, compra, login, handoff al panel y una llamada autenticada.
7. Cuando todo funcione, retira de `CORS_ORIGINS` los orígenes que ya no uses.