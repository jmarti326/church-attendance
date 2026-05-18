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

// ─── Azure File Share for PostgreSQL data persistence ─────────────
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'stchurchattendance'
  location: location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
  }
}

resource fileService 'Microsoft.Storage/storageAccounts/fileServices@2023-01-01' = {
  parent: storageAccount
  name: 'default'
}

resource fileShare 'Microsoft.Storage/storageAccounts/fileServices/shares@2023-01-01' = {
  parent: fileService
  name: 'pgdata'
  properties: {
    shareQuota: 1
  }
}

// ─── Storage mount on Container Apps Environment ──────────────────
resource envStorage 'Microsoft.App/managedEnvironments/storages@2024-03-01' = {
  parent: environment
  name: 'pgdata'
  properties: {
    azureFile: {
      accountName: storageAccount.name
      accountKey: storageAccount.listKeys().keys[0].value
      shareName: fileShare.name
      accessMode: 'ReadWrite'
    }
  }
}

// ─── PostgreSQL Container App ─────────────────────────────────────
resource postgresApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'ca-postgres'
  location: location
  properties: {
    managedEnvironmentId: environment.id
    configuration: {
      ingress: {
        external: false
        targetPort: 5432
        transport: 'tcp'
      }
      secrets: [
        {
          name: 'pg-password'
          value: pgPassword
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'postgres'
          image: 'postgres:16-alpine'
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
              value: '/var/lib/postgresql/data/pgdata'
            }
          ]
          volumeMounts: [
            {
              volumeName: 'pgdata'
              mountPath: '/var/lib/postgresql/data'
            }
          ]
        }
      ]
      volumes: [
        {
          name: 'pgdata'
          storageName: envStorage.name
          storageType: 'AzureFile'
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

// ─── Container App ────────────────────────────────────────────────
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  dependsOn: [postgresApp]
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
          value: 'postgresql://postgres:${pgPassword}@ca-postgres:5432/church'
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
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 1
      }
    }
  }
}

output acrLoginServer string = acr.properties.loginServer
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
