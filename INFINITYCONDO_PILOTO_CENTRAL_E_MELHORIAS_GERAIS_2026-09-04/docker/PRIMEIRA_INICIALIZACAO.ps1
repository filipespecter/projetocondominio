$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "=== InfinityCondo - Primeira inicializacao Docker ===" -ForegroundColor Cyan

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker nao foi encontrado no PATH."
}

docker info *> $null
if ($LASTEXITCODE -ne 0) { throw "Docker Engine nao esta rodando. Abra o Docker Desktop." }

if (-not (Test-Path "./backend/.env.docker")) {
  Copy-Item "./backend/.env.docker.example" "./backend/.env.docker"
  Write-Host "Criado backend/.env.docker a partir do exemplo." -ForegroundColor Yellow
}

Write-Host "Construindo e subindo banco + backend..." -ForegroundColor Cyan
docker compose up -d --build postgres backend
if ($LASTEXITCODE -ne 0) { throw "Falha ao subir postgres/backend." }

Write-Host "Aguardando backend ficar saudavel..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 2
  try {
    $r = Invoke-RestMethod -Uri "http://localhost:3333/api/health" -TimeoutSec 3
    if ($r.success -eq $true) { $ok = $true; break }
  } catch {}
}
if (-not $ok) {
  docker compose logs --tail=120 backend
  throw "Backend nao ficou saudavel no tempo esperado."
}

Write-Host "Aplicando migrations no banco Docker..." -ForegroundColor Cyan
docker compose exec -T backend npm run prisma:deploy
if ($LASTEXITCODE -ne 0) { throw "Falha ao aplicar migrations." }

Write-Host "Executando seed da Central Star e planos de homologacao..." -ForegroundColor Cyan
docker compose exec -T backend node prisma/seed.js
if ($LASTEXITCODE -ne 0) { throw "Falha no seed." }

Write-Host "Subindo frontend..." -ForegroundColor Cyan
docker compose up -d --build frontend
if ($LASTEXITCODE -ne 0) { throw "Falha ao subir frontend." }

Write-Host ""
Write-Host "AMBIENTE PRONTO" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173"
Write-Host "API:      http://localhost:3333/api"
Write-Host "Health:   http://localhost:3333/api/health"
Write-Host "Postgres local de homologacao: localhost:5433"
Write-Host ""
Write-Host "Central Star (somente ambiente Docker local):" -ForegroundColor Yellow
Write-Host "Usuario: staradmin"
Write-Host "Senha: consulte backend/.env.docker"
Write-Host ""
Write-Host "IMPORTANTE: essas credenciais sao apenas de desenvolvimento/homologacao."
