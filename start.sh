#!/bin/sh
set -e

echo "Checking database..."

# Ensure /data directory exists
mkdir -p /data

# If database doesn't exist, is missing schema/tables, or lacks WAL mode: recreate from template
needs_init=false

if [ ! -f /data/church.db ]; then
  echo "No database found."
  needs_init=true
elif ! sqlite3 /data/church.db "SELECT name FROM sqlite_master WHERE type='table' AND name='Family';" 2>/dev/null | grep -q "Family"; then
  echo "Database exists but schema is missing. Recreating..."
  needs_init=true
elif ! sqlite3 /data/church.db "SELECT name FROM sqlite_master WHERE type='table' AND name='User';" 2>/dev/null | grep -q "User"; then
  echo "Database missing User table. Recreating..."
  needs_init=true
else
  mode=$(sqlite3 /data/church.db "PRAGMA journal_mode;" 2>/dev/null || echo "unknown")
  if [ "$mode" != "wal" ]; then
    echo "Database not in WAL mode (current: $mode). Recreating..."
    needs_init=true
  else
    user_count=$(sqlite3 /data/church.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
    if [ "$user_count" = "0" ]; then
      echo "No users found in database. Recreating from template with seeded admin..."
      needs_init=true
    else
      echo "Database OK (WAL mode, all tables present, users exist)."
    fi
  fi
fi

if [ "$needs_init" = true ]; then
  rm -f /data/church.db /data/church.db-shm /data/church.db-wal
  cp /app/template.db /data/church.db
  chmod 664 /data/church.db
  echo "Database created from template with WAL mode."
fi

echo "Starting application..."
exec node server.js
