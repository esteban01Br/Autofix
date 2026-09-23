<#
.SYNOPSIS
    AutoFix: inicia el backend (FastAPI) y el frontend (Vite) juntos,
    en la misma terminal y con un solo comando.

.EXAMPLE
    .\start-dev.ps1
    .\start-dev.ps1 -Setup   # solo prepara el entorno e instala dependencias
#>

param(
    [switch]$Setup
)

$ErrorActionPreference = "Stop"

$root      = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend   = Join-Path $root "autofix-backend-fastapi"
$frontend  = Join-Path $root "autofix-frontend"
$py        = Join-Path $backend ".venv\Scripts\python.exe"

function Escribir($mensaje, $color = "Cyan") {
    Write-Host "  $mensaje" -ForegroundColor $color
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host "  AutoFix - Taller mecanico (backend + frontend)"       -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Yellow
Write-Host ""

# ------------------------------------------------------------------
# 1) Preparar el backend: entorno virtual + dependencias + .env
# ------------------------------------------------------------------
if (-not (Test-Path $py)) {
    Escribir "[backend] Creando entorno virtual (.venv)..."
    Push-Location $backend
    python -m venv .venv
    Pop-Location
    if (-not (Test-Path $py)) { throw "No se pudo crear el entorno virtual del backend." }
}

Escribir "[backend] Verificando dependencias (FastAPI)..."
$depsOk = & $py -c "import fastapi, uvicorn, sqlalchemy, bcrypt, jwt, dotenv" 2>$null
if ($LASTEXITCODE -ne 0) {
    Escribir "[backend] Instalando requirements.txt..."
    & $py -m pip install -r (Join-Path $backend "requirements.txt")
    if ($LASTEXITCODE -ne 0) { throw "Fallo la instalacion de dependencias del backend." }
} else {
    Escribir "[backend] Dependencias ya instaladas." "DarkGray"
}

$envPath = Join-Path $backend ".env"
if (-not (Test-Path $envPath)) {
    Escribir "[backend] Creando .env desde la plantilla..."
    Copy-Item (Join-Path $backend ".env.example") $envPath
}

# ------------------------------------------------------------------
# 2) Preparar el frontend: node_modules
# ------------------------------------------------------------------
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    Escribir "[frontend] Instalando dependencias (npm install)..."
    Push-Location $frontend
    npm install
    Pop-Location
} else {
    Escribir "[frontend] Dependencias ya instaladas." "DarkGray"
}

# ------------------------------------------------------------------
# 3) Seed: asegurar el usuario administrador por defecto
# ------------------------------------------------------------------
Push-Location $backend
& $py -m app.seed
Pop-Location

# ------------------------------------------------------------------
# Si solo se pidio preparar el entorno, terminamos aqui.
# ------------------------------------------------------------------
if ($Setup) {
    Write-Host ""
    Escribir "Entorno listo. Ejecuta '.\start-dev.ps1' para arrancar." "Green"
    exit 0
}

# ------------------------------------------------------------------
# 4) Arrancar ambos servicios dentro de esta misma terminal
# ------------------------------------------------------------------
# De aqui en adelante los logs nativos (stderr de uvicorn/vite) se
# reciben como errores no terminantes para cortar la ejecucion.
$ErrorActionPreference = "Continue"

Escribir "[backend]  Iniciando FastAPI con uvicorn (puerto 8081)..."

# Lee host/puerto del .env si existen (fallback: 0.0.0.0 y 8081).
$envBack = @{}
if (Test-Path (Join-Path $backend ".env")) {
    Get-Content (Join-Path $backend ".env") | ForEach-Object {
        if ($_ -match "^\s*(SERVER_HOST|SERVER_PORT)\s*=\s*(.+)$") {
            $envBack[$Matches[1]] = $Matches[2].Trim()
        }
    }
}
$hostUvicorn = if ($envBack["SERVER_HOST"]) { $envBack["SERVER_HOST"] } else { "0.0.0.0" }
$puertoUvicorn = if ($envBack["SERVER_PORT"]) { $envBack["SERVER_PORT"] } else { "8081" }

$jobBackend = Start-Job -Name "AutoFix-Backend" -ScriptBlock {
    param($python, $dir, $hostName, $puerto)
    Push-Location $dir
    & $python -m uvicorn "main:app" --reload --host $hostName --port $puerto
    Pop-Location
} -ArgumentList $py, $backend, $hostUvicorn, $puertoUvicorn

Escribir "[frontend] Iniciando Vite (puerto 5173)..."

$jobFrontend = Start-Job -Name "AutoFix-Frontend" -ScriptBlock {
    param($dir)
    Push-Location $dir
    npm run dev
    Pop-Location
} -ArgumentList $frontend

Write-Host ""
Write-Host "  Backend  -> http://localhost:8081   (docs: /docs)" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173"                 -ForegroundColor Green
Write-Host ""
Write-Host "  Credenciales por defecto: admin@autofix.com / Admin123!" -ForegroundColor DarkGray
Write-Host "  Pulsa Ctrl+C para detener ambos servicios."              -ForegroundColor DarkGray
Write-Host ""

try {
    while ($true) {
        foreach ($nombre in "AutoFix-Backend", "AutoFix-Frontend") {
            $job = Get-Job -Name $nombre -ErrorAction SilentlyContinue
            if (-not $job) { continue }
            try {
                # 2>&1 fusiona stderr de uvicorn/vite; con ErrorActionPreference
                # en Continue, esos avisos no detienen el bucle.
                Receive-Job -Job $job 2>&1 | ForEach-Object { Write-Host "    $_" }
            } catch {
                Write-Host "  [$nombre] aviso: $($_.Exception.Message)" -ForegroundColor DarkYellow
            }
            if ($job.State -eq "Failed") {
                Receive-Job -Job $job -ErrorAction SilentlyContinue |
                    ForEach-Object { Write-Host "    $_" }
                throw "El proceso $nombre termino con un error (revisa el mensaje anterior)."
            }
            if ($job.State -eq "Completed") {
                throw "El proceso $nombre termino inesperadamente."
            }
        }
        Start-Sleep -Milliseconds 400
    }
}
finally {
    Write-Host ""
    Escribir "Deteniendo servicios..." "Yellow"
    Stop-Job -Name "AutoFix-Backend", "AutoFix-Frontend" -ErrorAction SilentlyContinue
    Remove-Job -Name "AutoFix-Backend", "AutoFix-Frontend" -Force -ErrorAction SilentlyContinue
    Escribir "Todo detenido. Hasta pronto." "DarkGray"
}