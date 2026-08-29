$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "ATENCAO: isto apaga SOMENTE os volumes Docker locais do InfinityCondo." -ForegroundColor Yellow
$confirm = Read-Host "Digite RESETAR para continuar"
if ($confirm -ne "RESETAR") { Write-Host "Cancelado."; exit 0 }
docker compose down -v
Write-Host "Banco Docker de homologacao removido. Rode PRIMEIRA_INICIALIZACAO.ps1 novamente." -ForegroundColor Green
