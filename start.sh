#!/bin/sh
set -e

echo "Checking database..."

# Ensure /data directory exists
mkdir -p /data

# If database doesn't exist or is missing core tables: create from template
needs_init=false

if [ ! -f /data/church.db ]; then
  echo "No database found."
  needs_init=true
elif ! sqlite3 /data/church.db "SELECT name FROM sqlite_master WHERE type='table' AND name='Family';" 2>/dev/null | grep -q "Family"; then
  echo "Database exists but schema is missing. Recreating..."
  needs_init=true
fi

if [ "$needs_init" = true ]; then
  rm -f /data/church.db /data/church.db-shm /data/church.db-wal
  cp /app/template.db /data/church.db
  chmod 664 /data/church.db
  echo "Database created from template."
fi

# Ensure User table exists (add it from template if missing, without destroying data)
if ! sqlite3 /data/church.db "SELECT name FROM sqlite_master WHERE type='table' AND name='User';" 2>/dev/null | grep -q "User"; then
  echo "Adding User table to existing database..."
  sqlite3 /app/template.db ".dump User" 2>/dev/null | sqlite3 /data/church.db
  echo "User table added with default admin."
fi

# Ensure at least one admin user exists (seed into existing DB, never delete data)
user_count=$(sqlite3 /data/church.db "SELECT COUNT(*) FROM User;" 2>/dev/null || echo "0")
if [ "$user_count" = "0" ]; then
  echo "No users found. Seeding default admin from template..."
  sqlite3 /app/template.db "SELECT * FROM User WHERE username='admin';" 2>/dev/null | \
    sqlite3 /data/church.db ".import /dev/stdin User" 2>/dev/null || \
    sqlite3 /data/church.db "INSERT INTO User (username, password, name, role) SELECT username, password, name, role FROM template_admin;" 2>/dev/null || true
  # Fallback: copy admin row directly
  admin_row=$(sqlite3 /app/template.db "SELECT quote(username), quote(password), quote(name), quote(role) FROM User WHERE username='admin' LIMIT 1;" 2>/dev/null)
  if [ -n "$admin_row" ]; then
    sqlite3 /data/church.db "INSERT OR IGNORE INTO User (username, password, name, role) VALUES ($admin_row);"
    echo "Default admin user seeded."
  fi
fi

# Ensure WAL mode
mode=$(sqlite3 /data/church.db "PRAGMA journal_mode;" 2>/dev/null || echo "unknown")
if [ "$mode" != "wal" ]; then
  echo "Enabling WAL mode..."
  sqlite3 /data/church.db "PRAGMA journal_mode=WAL;" 2>/dev/null || true
fi

echo "Starting application..."
exec node server.js
