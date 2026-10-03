#!/bin/sh
set -eu
: "${RECOVERY_TARGET_TIME:?Informe horário UTC para restauração}"
case "$RECOVERY_TARGET_TIME" in *[!0-9T:.Z+-]*) echo 'Horário inválido' >&2; exit 1 ;; esac
if [ -n "${BASE_BACKUP_NAME:-}" ]; then
  case "$BASE_BACKUP_NAME" in *[!0-9TZ]*) exit 1 ;; esac
  base="/recovery/base/$BASE_BACKUP_NAME"
else
  base=$(find /recovery/base -mindepth 1 -maxdepth 1 -type d ! -name '*.partial' | sort | tail -1)
fi
[ -n "$base" ] || { echo 'Sem backup-base verificado' >&2; exit 1; }
[ -z "$(ls -A /restore)" ] || { echo 'Destino deve estar vazio' >&2; exit 1; }
pg_verifybackup "$base"
cp -a "$base/." /restore/
# Destino é um volume temporário, nunca PGDATA da aplicação.
cat >> /restore/postgresql.conf <<CONFIG
archive_mode = off
restore_command = 'cp /recovery/wal/%f %p'
recovery_target_time = '$(printf '%s' "$RECOVERY_TARGET_TIME" | sed 's/T/ /; s/Z/ +00:00/')'
recovery_target_inclusive = off
recovery_target_action = pause
hot_standby = on
CONFIG
rm -f /restore/standby.signal
: > /restore/recovery.signal
chown -R postgres:postgres /restore
chmod 700 /restore
