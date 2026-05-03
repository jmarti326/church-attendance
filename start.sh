#!/bin/sh
set -e

# If database doesn't exist, is missing schema, or lacks WAL mode: recreate from template
needs_init=false

if [ ! -f /data/church.db ]; then
  echo "No database found."
  needs_init=true
elif ! sqlite3 /data/church.db ".tables" 2>/dev/null | grep -q "Family"; then
  echo "Database exists but schema is missing. Recreating..."
  needs_init=true
else
  # Check if WAL mode is active — critical for concurrent access
  mode=$(sqlite3 /data/church.db "PRAGMA journal_mode;" 2>/dev/null || echo "unknown")
  if [ "$mode" != "wal" ]; then
    echo "Database not in WAL mode (current: $mode). Recreating to enable WAL..."
    needs_init=true
  fi
fi

if [ "$needs_init" = true ]; then
  rm -f /data/church.db /data/church.db-shm /data/church.db-wal
  cp /app/template.db /data/church.db
  echo "Database created from template with WAL mode."
fi

echo "Starting application..."
exec node server.js
