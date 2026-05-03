#!/bin/sh
set -e

# If database doesn't exist or is missing required tables, create from template
needs_init=false

if [ ! -f /data/church.db ]; then
  needs_init=true
elif ! sqlite3 /data/church.db ".tables" 2>/dev/null | grep -q "Family"; then
  echo "Database exists but schema is missing or outdated. Re-creating from template..."
  needs_init=true
fi

if [ "$needs_init" = true ]; then
  echo "Creating database from template..."
  cp /app/template.db /data/church.db
  # Enable WAL mode on fresh database (no lock contention possible)
  sqlite3 /data/church.db "PRAGMA journal_mode=WAL;" 2>/dev/null || true
  echo "Database created."
else
  echo "Database already exists with valid schema."
fi

echo "Starting application..."
exec node server.js
