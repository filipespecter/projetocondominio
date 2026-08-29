$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
docker compose ps
Write-Host ""
try { Invoke-RestMethod http://localhost:3333/api/health | ConvertTo-Json -Depth 5 } catch { Write-Host $_.Exception.Message -ForegroundColor Red }
