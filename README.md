# Church Attendance PWA

A mobile-friendly Progressive Web App for tracking church attendance every Sunday. Built with Next.js, Tailwind CSS, and Prisma + PostgreSQL.

## Features

- **Member Management**: View, search, filter, and add church members
- **Family Grouping**: Members organized by family
- **Sunday Attendance**: Tap-to-mark-present interface with search/filter
- **Member Statuses**: Member, Visitor, Members Class, Inactive
- **Dashboard**: Attendance statistics and trends
- **User Management**: Admin panel for managing app users and roles
- **Batch Upload**: Import members in bulk
- **Responsive UI**: Desktop sidebar navigation + mobile bottom nav
- **PWA Install**: Install on phone home screen for native-like experience
- **Authentication**: JWT-based login with role-based access (admin/user)

## Tech Stack

- **Frontend**: Next.js 15+ (App Router) + Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM + `@prisma/adapter-pg`
- **Auth**: JWT (jose) + bcryptjs
- **Hosting**: Vercel (app) + Neon (managed PostgreSQL)
- **CI/CD**: GitHub Actions → Vercel CLI deploy

## Live URLs

| Environment | URL |
|-------------|-----|
| **Production (Vercel)** | https://church-attendance-indol.vercel.app |
| **Production (Azure)** | https://ca-church-attendance.salmonmushroom-89d128aa.eastus.azurecontainerapps.io |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Docker (for local PostgreSQL)

### Local Development Setup

```bash
# 1. Clone and install
git clone https://github.com/jmarti326/church-attendance.git
cd church-attendance
npm install

# 2. Start local PostgreSQL
docker compose up -d

# 3. Set up environment
cp .env.example .env
# .env already has the correct local DATABASE_URL:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/church"

# 4. Generate Prisma client and run migrations
npx prisma generate
npx prisma migrate deploy

# 5. Seed the admin user
npx tsx prisma/seed-auth.ts

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — login with `admin` / `admin123`

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Generate Prisma client + build for production |
| `npm run db:seed` | Seed sample members |
| `npm run db:migrate` | Run migrations (dev mode) |
| `npm run db:reset` | Reset database |
| `docker compose up -d` | Start local PostgreSQL |
| `docker compose down` | Stop local PostgreSQL |

## Project Structure

```
src/
  app/
    api/             # API routes (members, attendance, families, auth, users)
    attendance/      # Attendance check-in page
    members/         # Member list page
    dashboard/       # Statistics dashboard
    admin/           # Admin panel (user management)
    batch-upload/    # Bulk member import
    login/           # Login page
  components/        # Shared UI components (BottomNav, ThemeProvider, etc.)
  lib/
    prisma.ts        # Prisma client singleton
    auth.ts          # JWT auth utilities (sign, verify, hash)
    sqlite.ts        # Direct DB utilities
prisma/
  schema.prisma      # Database schema (PostgreSQL)
  seed-auth.ts       # Admin user seeder
  migrations/        # Database migration history
infra/               # Azure Bicep templates (Container Apps)
.github/workflows/
  deploy-vercel.yml  # CI/CD: GitHub → Vercel
  deploy.yml         # CI/CD: GitHub → Azure Container Apps
  infra.yml          # Azure infrastructure deployment
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│   Vercel     │────▶│  Neon PostgreSQL │
│   (PWA)     │     │  (Next.js)   │     │  (managed DB)    │
└─────────────┘     └──────────────┘     └─────────────────┘
```

- **Local dev**: Next.js → Docker PostgreSQL (localhost:5432)
- **Production**: Vercel → Neon PostgreSQL (cloud, persistent)

## Environment Variables

| Variable | Local | Production | Description |
|----------|-------|------------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/church` | Neon connection string | PostgreSQL connection |
| `AUTH_SECRET` | _(optional, has fallback)_ | Random string | JWT signing key |
| `NODE_ENV` | `development` | `production` | Environment |
| `TZ` | _(system)_ | `America/Puerto_Rico` | Timezone |

**⚠️ Never commit secrets to the repository.** Production values are stored in:
- **GitHub Secrets** (for CI/CD workflows)
- **Vercel Environment Variables** (for runtime)

## Deployment

### Vercel (Primary — Free)

Deploys automatically via GitHub Actions on push to `master`.

**GitHub Secrets required:**
| Secret | Purpose |
|--------|---------|
| `VERCEL_TOKEN` | Vercel API token |
| `VERCEL_ORG_ID` | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | JWT signing secret |

### Azure Container Apps (Legacy)

Still configured but can be decommissioned. Uses Docker container with `Dockerfile`.

**Additional secrets for Azure:**
| Secret | Purpose |
|--------|---------|
| `AZURE_CREDENTIALS` | Azure service principal |

## Database

### Schema

- **Family** → has many Members
- **Member** → belongs to Family, has many Attendances
- **AttendanceRecord** → one per Sunday, has many Attendances
- **Attendance** → links Member to AttendanceRecord (present/absent)
- **User** → app login users (admin/user roles)

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations to production (non-destructive)
npx prisma migrate deploy
```

## Default Credentials

| Username | Password | Role |
|----------|----------|------|
| `admin` | `admin123` | admin |

**Change the admin password after first login in production!**

## PWA Installation

1. Open the app in Chrome/Safari on your phone
2. Tap "Add to Home Screen" (or install prompt)
3. The app works as a native-like app

## Custom Domain Setup

To use a branded URL (e.g., `asistencia.iglesia.org`):

1. Go to [Vercel Dashboard](https://vercel.com) → your project → Settings → Domains
2. Add your domain (e.g., `asistencia.iglesia.org`)
3. Configure DNS at your registrar:
   - **CNAME**: Point `asistencia` to `cname.vercel-dns.com`
   - OR **A record**: Point apex domain to `76.76.21.21`
4. Vercel automatically provisions an SSL certificate
5. The app will be available at your custom domain within minutes

## Implemented Features

- [x] **Offline sync** — Queue attendance changes when offline, sync when back online
- [x] **Reports/Export** — Export attendance + members to CSV
- [x] **Member photos** — Profile pictures with avatar fallback
- [x] **Attendance history** — Per-member attendance timeline with stats
- [x] **Dark mode** — "Oscuro" theme in theme selector
- [x] **Visitor follow-up** — Dashboard widget tracking visitor return rates
- [x] **Birthday reminders** — Birthday field + upcoming birthdays widget
- [x] **Sync indicator** — Visual banner when offline or changes pending

## Future Improvements

- [ ] **Notifications** — Web Push reminders for Sunday attendance
- [ ] **Multi-church support** — Tenant isolation for multiple congregations
- [ ] **Attendance reports** — PDF generation with charts and trends

## License

MIT
