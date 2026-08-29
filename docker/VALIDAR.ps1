$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "[1/5] Docker Compose config" -ForegroundColor Cyan
docker compose config --quiet
Write-Host "[2/5] Containers" -ForegroundColor Cyan
docker compose ps
Write-Host "[3/5] Health API" -ForegroundColor Cyan
Invoke-RestMethod http://localhost:3333/api/health | ConvertTo-Json -Depth 5
Write-Host "[4/5] Testes backend" -ForegroundColor Cyan
docker compose exec -T backend npm test
Write-Host "[5/5] Prisma validate" -ForegroundColor Cyan
docker compose exec -T backend npx prisma validate
Write-Host "VALIDACAO DOCKER CONCLUIDA" -ForegroundColor Green
