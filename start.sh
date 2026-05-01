#!/bin/sh
set -e

echo "🔧 Running database migrations..."
npx prisma db push --skip-generate 2>/dev/null || echo "⚠️ Migration skipped (prisma not in path, DB may already exist)"

echo "🚀 Starting application..."
exec node server.js
