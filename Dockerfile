# Build stage
FROM node:20-alpine AS builder

ARG APP_VERSION=dev

WORKDIR /app

RUN apk add --no-cache sqlite

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create a blank DB with the schema applied (for copying to production)
RUN DATABASE_URL="file:./template.db" npx prisma db push

# Seed default admin user into template
RUN DATABASE_URL="file:./template.db" npx tsx prisma/seed-auth.ts

# Enable WAL mode on template DB so all runtime connections use it
RUN sqlite3 template.db "PRAGMA journal_mode=WAL;"

# Build Next.js (standalone output) with version baked in
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache sqlite tzdata

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma generated client and template DB
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder /app/node_modules/jose ./node_modules/jose
COPY --from=builder /app/template.db ./template.db

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

# Create data directory for SQLite (mounted as persistent volume)
RUN mkdir -p /data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL="file:/data/church.db"
ENV TZ="America/Puerto_Rico"

CMD ["./start.sh"]
