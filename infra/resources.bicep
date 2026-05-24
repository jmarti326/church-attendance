@description('Location for all resources')
param location string

@description('Name of the container registry')
param acrName string

@description('Name of the Container Apps environment')
param environmentName string

@description('Name of the Container App')
param containerAppName string

@description('Container image tag')
param imageTag string

@secure()
@description('PostgreSQL password')
param pgPassword string

// ─── Log Analytics Workspace ──────────────────────────────────────
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: 'law-church-attendance'
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ─── Azure Container Registry ─────────────────────────────────────
resource acr 'Microsoft.ContainerRegistry/registries@2023-07-01' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ─── Container Apps Environment ───────────────────────────────────
resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: environmentName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// ─── NOTE: PostgreSQL runs as a sidecar container in the main app ─
// Data is ephemeral (stored in /tmp/pgdata). For persistence, migrate
// to a managed PostgreSQL service (Azure Flexible Server, Neon, etc.)

// ─── Container App (with PostgreSQL sidecar) ─────────────────────
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
        transport: 'http'
        allowInsecure: false
      }
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        {
          name: 'acr-password'
          value: acr.listCredentials().passwords[0].value
        }
        {
          name: 'database-url'
          value: 'postgresql://postgres:${pgPassword}@localhost:5432/church'
        }
        {
          name: 'pg-password'
          value: pgPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'church-attendance'
          image: '${acr.properties.loginServer}/church-attendance:${imageTag}'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'TZ'
              value: 'America/Puerto_Rico'
            }
          ]
        }
        {
          name: 'postgres'
          image: 'docker.io/library/postgres:16-alpine'
          resources: {
            cpu: json('0.25')
            memory: '0.5Gi'
          }
          env: [
            {
              name: 'POSTGRES_DB'
              value: 'church'
            }
            {
              name: 'POSTGRES_USER'
              value: 'postgres'
            }
            {
              name: 'POSTGRES_PASSWORD'
              secretRef: 'pg-password'
            }
            {
              name: 'PGDATA'
              value: '/tmp/pgdata'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
