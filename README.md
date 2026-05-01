# Church Attendance PWA

A mobile-friendly Progressive Web App for tracking church attendance every Sunday. Built with Next.js 16, Tailwind CSS, Prisma + SQLite, and Dexie.js for offline support.

## Features

- **Member Management**: View, search, filter, and add church members
- **Family Grouping**: Members organized by family
- **Sunday Attendance**: Tap-to-mark-present interface
- **Member Statuses**: Member, Visitor, Members Class, Inactive
- **Offline-First**: Works without internet, syncs when back online
- **PWA Install**: Install on phone home screen for native-like experience

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS
- **Database**: SQLite via Prisma ORM + better-sqlite3 adapter
- **Offline**: IndexedDB (Dexie.js) with background sync
- **PWA**: next-pwa with service worker and app manifest

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Generate Prisma client
npx prisma generate

# Create database and run migrations
npx prisma db push

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run db:seed` | Seed sample members |
| `npm run db:migrate` | Run migrations |
| `npm run db:reset` | Reset database |

## Project Structure

```
src/
  app/
    api/             # API routes (members, attendance, families)
    attendance/      # Attendance check-in page
    members/         # Member list page
  components/        # Shared UI components
  lib/
    prisma.ts        # Prisma client singleton
    db.ts            # Dexie.js IndexedDB schema
    sync.ts          # Offline sync service
    hooks.ts         # React hooks for offline-first data
prisma/
  schema.prisma      # Database schema
  seed.ts            # Sample data seeder
```

## PWA Installation

1. Open the app in Chrome/Safari on your phone
2. Tap "Add to Home Screen" (or install prompt)
3. The app will work offline after first load

## License

MIT
