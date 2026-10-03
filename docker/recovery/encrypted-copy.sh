#!/bin/sh
set -eu
umask 077
: "${RESTIC_REPOSITORY:?Configure RESTIC_REPOSITORY}"
: "${RESTIC_PASSWORD:?Configure RESTIC_PASSWORD}"
# Inicialização explícita: falha de rede nunca deve criar outro repositório.
restic snapshots >/dev/null
while :; do
  if restic backup /recovery /uploads --exclude '*.partial' --exclude '*.partial.*' --tag infinitycondo; then
    date -u +%s > /tmp/last-success
    echo 'ENCRYPTED_COPY_OK'
  else
    echo 'ENCRYPTED_COPY_FAILED: verificar destino e credenciais' >&2
  fi
  sleep 60
done
