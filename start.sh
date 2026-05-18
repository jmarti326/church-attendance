#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Seeding default admin user if needed..."
npx tsx prisma/seed-auth.ts

echo "Starting application..."
exec node server.js
