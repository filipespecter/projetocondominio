#!/bin/sh
set -eu
umask 077
interval=${BASE_BACKUP_INTERVAL_SECONDS:-86400}
case "$interval" in ''|*[!0-9]*) echo 'Intervalo inválido' >&2; exit 1 ;; esac
[ "$interval" -ge 3600 ] || { echo 'Intervalo mínimo: 3600 segundos' >&2; exit 1; }
while :; do
  until pg_isready -h /var/run/postgresql -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do sleep 5; done
  stamp=$(date -u +%Y%m%dT%H%M%SZ)
  temporary="/recovery/base/$stamp.partial"
  completed="/recovery/base/$stamp"
  if pg_basebackup -h /var/run/postgresql -U "$POSTGRES_USER" -D "$temporary" --format=plain --wal-method=stream --checkpoint=fast --no-password && pg_verifybackup "$temporary"; then
    mv "$temporary" "$completed"
    date -u +%s > /recovery/base/last-success
    echo "BASE_BACKUP_VERIFIED $stamp"
    sleep "$interval"
  else
    echo "BASE_BACKUP_FAILED $stamp: nova tentativa em 60s" >&2
    rm -rf "$temporary"
    sleep 60
  fi
done
