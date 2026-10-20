import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import http from 'node:http'

// El portal corre en el puerto 5174 (la app AutoFix usa el 5173).
const PUERTOS_BACKEND = [8081, 8000]

// Proxy propio: reenvía /api al backend probando los puertos en orden
// (mismo esquema que autofix-frontend para que el dev local no use CORS).
function proxyApi(server) {
  server.middlewares.use((req, res, next) => {
    if (!req.url.startsWith('/api')) return next()

    const pedido = { metodo: req.method, url: req.url, cabeceras: req.headers }
    const trozos = []
    req.on('data', (c) => trozos.push(c))
    req.on('end', () => {
      const cuerpo = Buffer.concat(trozos)

      const intentar = (indice) => {
        if (indice >= PUERTOS_BACKEND.length) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              detail: `No se pudo conectar con el backend (puertos ${PUERTOS_BACKEND.join(', ')}).`,
            }),
          )
          return
        }

        const puerto = PUERTOS_BACKEND[indice]
        const opciones = {
          hostname: '127.0.0.1',
          port: puerto,
          path: pedido.url,
          method: pedido.metodo,
          headers: { ...pedido.cabeceras, host: `localhost:${puerto}` },
        }

        const proxyReq = http.request(opciones, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers)
          proxyRes.pipe(res)
        })

        proxyReq.on('error', () => intentar(indice + 1))
        proxyReq.end(cuerpo)
      }

      intentar(0)
    })
  })
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'proxy-api',
      configureServer: proxyApi,
    },
  ],
  server: {
    port: 5174,
    strictPort: true,
  },
})
