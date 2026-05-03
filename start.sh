#!/bin/sh
set -e

# If database doesn't exist or is missing required tables, create from template
needs_init=false

if [ ! -f /data/church.db ]; then
  needs_init=true
elif ! sqlite3 /data/church.db "SELECT 1 FROM Family LIMIT 1;" > /dev/null 2>&1; then
  echo "Database exists but schema is missing or outdated. Re-creating from template..."
  needs_init=true
fi

if [ "$needs_init" = true ]; then
  echo "Creating database from template..."
  cp /app/template.db /data/church.db
  echo "Database created."
else
  echo "Database already exists with valid schema."
fi

echo "Starting application..."
exec node server.js
