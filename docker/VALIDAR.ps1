$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Write-Host "[1/7] Docker Compose config" -ForegroundColor Cyan
docker compose config --quiet
Write-Host "[2/7] Containers" -ForegroundColor Cyan
docker compose ps
Write-Host "[3/7] Health API" -ForegroundColor Cyan
Invoke-RestMethod http://localhost:3333/api/health | ConvertTo-Json -Depth 5
Write-Host "[4/7] Testes backend" -ForegroundColor Cyan
docker compose exec -T backend npm test
Write-Host "[5/7] Prisma validate" -ForegroundColor Cyan
docker compose exec -T backend npx prisma validate
Write-Host "[6/7] Lint frontend" -ForegroundColor Cyan
docker compose exec -T frontend npm run lint
Write-Host "[7/7] Build frontend/PWA" -ForegroundColor Cyan
docker compose exec -T frontend npm run build
Write-Host "VALIDACAO FINAL CONCLUIDA" -ForegroundColor Green
