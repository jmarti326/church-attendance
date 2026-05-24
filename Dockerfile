# Build stage
FROM node:20-alpine AS builder

ARG APP_VERSION=dev

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (standalone output) with version baked in
ENV NEXT_PUBLIC_APP_VERSION=$APP_VERSION
RUN npm run build

# Prune to production deps only (keeps resolved nested deps intact)
RUN npm prune --omit=dev && npm install tsx

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache tzdata

# Copy built Next.js standalone app
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema, migrations, and seed script for runtime migrate
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated

# Copy production node_modules (for prisma migrate, seed, pg adapter)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV TZ="America/Puerto_Rico"

CMD ["./start.sh"]
