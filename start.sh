#!/bin/sh
set -e

# If database doesn't exist, create it from the template (has schema already applied)
if [ ! -f /data/church.db ]; then
  echo "Creating database from template..."
  cp /app/template.db /data/church.db
  echo "Database created."
else
  echo "Database already exists."
fi

echo "Starting application..."
exec node server.js
