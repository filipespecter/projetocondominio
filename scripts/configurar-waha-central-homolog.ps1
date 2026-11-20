#requires -Version 5.1
param([ValidateRange(1,20)][int]$MaxInstances=2)
$ErrorActionPreference = 'Stop'
function Check([string]$step) { if ($LASTEXITCODE -ne 0) { throw "Falha: $step. Pare; nao compartilhe credenciais." } }
if ((& git.exe branch --show-current).Trim() -ne 'homolog') { throw 'Somente homolog.' }
$ctx = (& docker context show).Trim(); Check 'contexto Docker'
$endpoint = (& docker context inspect $ctx --format '{{.Endpoints.docker.Host}}').Trim(); Check 'endpoint Docker'
if ($env:DOCKER_HOST) { $endpoint = $env:DOCKER_HOST }
if ($endpoint -notmatch '^(npipe:|unix:|tcp://(127\.0\.0\.1|localhost)(:|/|$))') { throw 'Docker remoto recusado.' }
$config = (& docker compose config --format json | Out-String) | ConvertFrom-Json; Check 'Compose'
$database = [Uri]$config.services.backend.environment.DATABASE_URL
if ($config.name -ne 'infinitycondo-local' -or $database.Host -ne 'postgres' -or $database.AbsolutePath -ne '/infinitycondo_homolog' -or $config.services.backend.environment.NODE_ENV -eq 'production') { throw 'Somente Homolog local.' }
Remove-Variable config,database
$privateDir = Join-Path $env:LOCALAPPDATA 'InfinityCondo\WAHA'
$legacy = Join-Path $privateDir 'registry.json'
if (Test-Path -LiteralPath $legacy) {
    $legacyData = Get-Content -LiteralPath $legacy -Raw | ConvertFrom-Json
    if (@($legacyData.PSObject.Properties).Count -gt 0) { throw 'Existe uma preparacao manual anterior. Pare para revisar, sem importar ou vincular automaticamente.' }
}
$controlDir = Join-Path $privateDir 'control'
$stateDir = Join-Path $privateDir 'state'
New-Item -ItemType Directory -Force -Path $controlDir,$stateDir | Out-Null
$owner = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $privateDir /inheritance:r /grant:r "${owner}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null; Check 'permissoes privadas'
$keyFile = Join-Path $controlDir 'control.key'
if (-not (Test-Path -LiteralPath $keyFile)) {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    ([BitConverter]::ToString($bytes).Replace('-','').ToLowerInvariant()) | Set-Content -LiteralPath $keyFile -Encoding ASCII
}
if ((Get-Content -LiteralPath $keyFile -Raw).Trim() -notmatch '^[a-f0-9]{64}$') { throw 'Chave interna existente invalida. Nao foi sobrescrita.' }
$registryFile = Join-Path $stateDir 'registry.json'
if (-not (Test-Path -LiteralPath $registryFile)) { '{}' | Set-Content -LiteralPath $registryFile -Encoding ASCII }
$null = Get-Content -LiteralPath $registryFile -Raw | ConvertFrom-Json
$controlNetwork = 'infinitycondo-waha-control'
$networks = @(& docker network ls --format '{{.Name}}'); Check 'redes locais'
if ($networks -notcontains $controlNetwork) {
    & docker network create --internal --label 'tech.infinitycondo.waha.control=1' $controlNetwork | Out-Null; Check 'rede privada do preparador'
} else {
    $networkInfo = (& docker network inspect $controlNetwork | Out-String | ConvertFrom-Json)[0]; Check 'rede existente'
    if ($networkInfo.Labels.'tech.infinitycondo.waha.control' -ne '1' -or -not $networkInfo.Internal) { throw 'Rede existente divergente. Nada removido.' }
}
$agentName = 'infinitycondo-waha-provisioner'
$containers = @(& docker ps -a --format '{{.Names}}'); Check 'containers locais'
if ($containers -contains $agentName) {
    $agent = (& docker inspect $agentName | Out-String | ConvertFrom-Json)[0]; Check 'preparador existente'
    if ($agent.Config.Labels.'tech.infinitycondo.waha.agent' -ne '1') { throw 'Preparador existente divergente. Nada removido.' }
}
$wahaImage = 'devlikeapro/waha:gows@sha256:1f7faeb0227ad5edb5711f7058bfce807ea65e5f92234af0778e4db140f6eb46'
& docker pull $wahaImage; Check 'imagem WAHA fixada'
$buildDir = Join-Path $privateDir ('build-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $buildDir | Out-Null
try {
    Copy-Item -LiteralPath '.\provisioner\Dockerfile' -Destination (Join-Path $buildDir 'Dockerfile')
    Copy-Item -LiteralPath '.\backend\src\infrastructure\WahaProvisioner.mjs' -Destination (Join-Path $buildDir 'WahaProvisioner.mjs')
    & docker build -t infinitycondo-waha-provisioner:20261107 $buildDir; Check 'imagem do preparador'
} finally { Remove-Item -LiteralPath $buildDir -Recurse -Force }
$stateMount = $stateDir.Replace('\','/')
$controlMount = $controlDir.Replace('\','/')
$override = Join-Path $privateDir 'compose.waha.central.yaml'
@(
'services:',
'  backend:',
'    environment:',
'      WAHA_CONTROL_ENABLED: "true"',
'      WAHA_CONTROL_KEY_FILE: /run/waha-control/control.key',
'      WAHA_REGISTRY_FILE: /run/infinitycondo-waha/registry.json',
'    volumes:',
'      - type: bind',
"        source: '$stateMount'",
'        target: /run/infinitycondo-waha',
'        read_only: true',
'      - type: bind',
"        source: '$controlMount'",
'        target: /run/waha-control',
'        read_only: true',
'    networks:',
'      - default',
'      - waha-control',
'networks:',
'  waha-control:',
'    external: true',
'    name: infinitycondo-waha-control'
) | Set-Content -LiteralPath $override -Encoding ASCII
& docker compose -f compose.yaml -f $override config --quiet; Check 'configuracao do preparador'
& docker compose -f compose.yaml -f $override up -d --no-deps --wait --wait-timeout 120 backend frontend; Check 'backend e frontend locais'
if ($containers -contains $agentName) {
    & docker stop $agentName | Out-Null; Check 'parada do preparador anterior'
    & docker rm $agentName | Out-Null; Check 'substituicao somente do preparador'
}
& docker run -d --name $agentName --label 'tech.infinitycondo.waha.agent=1' --restart unless-stopped --network $controlNetwork --memory 128m --cpus 0.25 --pids-limit 64 --read-only --security-opt no-new-privileges:true --log-opt max-size=5m --log-opt max-file=2 -e "WAHA_MAX_INSTANCES=$MaxInstances" --mount "type=bind,source=$stateDir,target=/state" --mount "type=bind,source=$controlDir,target=/control,readonly" -v /var/run/docker.sock:/var/run/docker.sock infinitycondo-waha-provisioner:20261107 | Out-Null
Check 'servico interno de preparacao'
$running = (& docker inspect $agentName --format '{{.State.Running}}').Trim(); Check 'estado do preparador'
if ($running -ne 'true') { throw 'Preparador nao iniciou. Pare e envie somente o erro.' }
Write-Host 'Infraestrutura preparada. Nenhum condominio criado, escolhido ou vinculado.'
Write-Host 'Na Central, abra um cliente existente > Conexao WhatsApp > Habilitar e preparar conexao.'
Write-Host "Limite inicial: $MaxInstances instancias locais. Aguarde Pronto para conectar antes do QR do sindico."
Write-Host 'Para recriar o backend depois, inclua -f compose.yaml -f o arquivo privado compose.waha.central.yaml.'
