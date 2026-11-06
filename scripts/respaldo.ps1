# Respaldo de la base de datos de AutoFix
#
# Uso (PowerShell, desde la raiz del repositorio):
#   1) En la MISMA terminal, define la URL DIRECTA de PostgreSQL/Neon:
#        $env:AUTOFIX_DB_URL_RESPALDO = "postgresql://.../autofix?sslmode=require"
#      La URL NUNCA debe escribirse en un archivo del repositorio.
#   2) Ejecuta:
#        .\scripts\respaldo.ps1
#
# Requiere las herramientas cliente de PostgreSQL (pg_dump) en el PATH.
# En Windows se instalan con el paquete oficial de PostgreSQL o con:
#   winget install PostgreSQL.PostgreSQL
#
# Los respaldos se guardan en .\respaldos\ y esa carpeta esta en .gitignore.

$ErrorActionPreference = "Stop"

$url = $env:AUTOFIX_DB_URL_RESPALDO
if ([string]::IsNullOrWhiteSpace($url)) {
    Write-Error "Falta la variable de entorno AUTOFIX_DB_URL_RESPALDO con la URL DIRECTA de la base (no la del pooler)."
    exit 1
}

$pgDump = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDump) {
    Write-Error @"
No se encontro 'pg_dump' en el PATH.
Instala las herramientas cliente de PostgreSQL (por ejemplo:
  winget install PostgreSQL.PostgreSQL
o el instalador oficial) y vuelve a abrir la terminal.
"@
    exit 1
}

$raiz = Split-Path -Parent $PSScriptRoot
$carpeta = Join-Path $raiz "respaldos"
if (-not (Test-Path $carpeta)) {
    New-Item -ItemType Directory -Path $carpeta | Out-Null
}

$fecha = Get-Date
$nombre = "autofix_{0}.dump" -f $fecha.ToString("yyyy-MM-dd_HHmm")
$destino = Join-Path $carpeta $nombre

Write-Host "Creando respaldo en: $destino"
# -Fc = formato personalizado comprimido (permite pg_restore selectivo).
& $pgDump $url -Fc -f $destino
if ($LASTEXITCODE -ne 0) {
    Write-Error "pg_dump fallo con codigo $LASTEXITCODE. Revisa la URL y la version de pg_dump."
    exit $LASTEXITCODE
}
if (-not (Test-Path $destino)) {
    Write-Error "No se genero el archivo de respaldo."
    exit 1
}

# Borrar respaldos de mas de 30 dias en esta carpeta.
$limite = $fecha.AddDays(-30)
Get-ChildItem $carpeta -Filter "autofix_*.dump" -File |
    Where-Object { $_.LastWriteTime -lt $limite } |
    ForEach-Object {
        Write-Host "Borrando respaldo antiguo: $($_.Name)"
        Remove-Item $_.FullName -Force
    }

$info = Get-Item $destino
$mb = [math]::Round($info.Length / 1MB, 2)
Write-Host ""
Write-Host "Respaldo completado."
Write-Host "  Archivo: $($info.FullName)"
Write-Host "  Tamano : $mb MB"
Write-Host "  Fecha  : $($info.LastWriteTime)"
