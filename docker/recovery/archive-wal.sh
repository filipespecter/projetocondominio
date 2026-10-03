#!/bin/sh
set -eu
umask 077
source_file=$1
archive_name=$2
case "$archive_name" in ''|*[!A-Za-z0-9.]*) exit 1 ;; esac
archive_path="/recovery/wal/$archive_name"
if [ -f "$archive_path" ]; then
  cmp -s "$source_file" "$archive_path"
  exit $?
fi
partial_path="$archive_path.partial.$$"
trap 'rm -f "$partial_path"' EXIT HUP INT TERM
cp "$source_file" "$partial_path"
sync "$partial_path"
# O archiver do PostgreSQL executa uma cópia de cada vez.
mv "$partial_path" "$archive_path"
sync /recovery/wal
