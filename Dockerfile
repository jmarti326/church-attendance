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

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache tzdata

# Copy package files and install production dependencies
COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client, schema, and migrations for runtime migrate
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Copy generated Prisma client (not included in npm ci)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy startup script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV TZ="America/Puerto_Rico"

CMD ["./start.sh"]
