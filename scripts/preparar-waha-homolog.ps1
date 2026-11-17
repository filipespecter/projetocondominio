#requires -Version 5.1
param([string]$CondominiumId)
$ErrorActionPreference = 'Stop'
if ($CondominiumId) { throw 'Preparacao manual por condominio desativada. Use a Central para escolher e habilitar o cliente.' }
& (Join-Path $PSScriptRoot 'configurar-waha-central-homolog.ps1')
