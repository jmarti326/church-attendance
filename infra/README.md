# Azure Infrastructure

This directory contains Bicep templates to deploy the Church Attendance app to Azure Container Apps.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Resource Group: rg-church-attendance                │
│                                                     │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  Azure       │    │  Container Apps Env        │  │
│  │  Container   │───▶│  ┌─────────────────────┐  │  │
│  │  Registry    │    │  │  Container App       │  │  │
│  └──────────────┘    │  │  (Next.js + SQLite)  │  │  │
│                      │  │        │             │  │  │
│  ┌──────────────┐    │  │        ▼             │  │  │
│  │  Storage     │    │  │  /data (volume)      │  │  │
│  │  Account     │◀───│  └─────────────────────┘  │  │
│  │  (File Share)│    └───────────────────────────┘  │
│  └──────────────┘                                   │
│                                                     │
│  ┌──────────────┐                                   │
│  │  Log         │                                   │
│  │  Analytics   │                                   │
│  └──────────────┘                                   │
└─────────────────────────────────────────────────────┘
```

## Resources Created

| Resource | Purpose | SKU/Tier |
|----------|---------|----------|
| Container Registry | Store Docker images | Basic (~$5/mo) |
| Container Apps Environment | Hosting environment | Consumption (pay per use) |
| Container App | The Next.js app | 0.25 vCPU, 0.5GB RAM |
| Storage Account + File Share | Persist SQLite database | Standard LRS |
| Log Analytics Workspace | Logging & monitoring | Per-GB |

**Estimated cost**: ~$5-10/month with scale-to-zero (0 when idle)

## Deployment Steps

### Prerequisites

1. Azure CLI installed: `az --version`
2. Logged in: `az login`
3. GitHub repo with `AZURE_CREDENTIALS` secret configured

### 1. Deploy Infrastructure (one-time)

```bash
# From repo root
az deployment sub create \
  --location eastus \
  --template-file infra/main.bicep \
  --parameters infra/main.bicepparam
```

Or use the GitHub Action: **Actions → Deploy Infrastructure → Run workflow**

### 2. Configure GitHub Secret

Create a service principal and add it as `AZURE_CREDENTIALS`:

```bash
az ad sp create-for-rbac \
  --name "sp-church-attendance" \
  --role contributor \
  --scopes /subscriptions/<SUBSCRIPTION_ID>/resourceGroups/rg-church-attendance \
  --sdk-auth
```

Copy the JSON output to GitHub → Settings → Secrets → `AZURE_CREDENTIALS`

### 3. Build & Deploy (automatic on push to master)

Every push to `master` triggers the deploy workflow:
1. Builds Docker image
2. Pushes to ACR
3. Updates Container App

### 4. Seed the Database (first time)

After first deployment, exec into the container to seed:

```bash
az containerapp exec \
  --name ca-church-attendance \
  --resource-group rg-church-attendance \
  --command "npx tsx prisma/seed.ts"
```

## Scale Configuration

- **Min replicas**: 0 (scales to zero when idle — free!)
- **Max replicas**: 1 (SQLite doesn't support concurrent writers)
- Scale-up trigger: HTTP requests

## Custom Domain (optional)

```bash
az containerapp hostname add \
  --name ca-church-attendance \
  --resource-group rg-church-attendance \
  --hostname your-domain.com
```
