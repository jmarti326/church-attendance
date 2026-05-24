targetScope = 'subscription'

@description('Name of the resource group')
param resourceGroupName string = 'rg-church-attendance'

@description('Location for all resources')
param location string = 'eastus'

@description('Name of the container registry')
param acrName string = 'acrchurchattendance'

@description('Name of the Container Apps environment')
param environmentName string = 'cae-church-attendance'

@description('Name of the Container App')
param containerAppName string = 'ca-church-attendance'

@description('Container image tag')
param imageTag string = 'latest'

@description('Database connection URL (Neon PostgreSQL)')
@secure()
param databaseUrl string

// Resource Group
resource rg 'Microsoft.Resources/resourceGroups@2023-07-01' = {
  name: resourceGroupName
  location: location
}

// Deploy all resources into the resource group
module resources 'resources.bicep' = {
  name: 'church-attendance-resources'
  scope: rg
  params: {
    location: location
    acrName: acrName
    environmentName: environmentName
    containerAppName: containerAppName
    imageTag: imageTag
    databaseUrl: databaseUrl
  }
}

output acrLoginServer string = resources.outputs.acrLoginServer
output containerAppUrl string = resources.outputs.containerAppUrl
output resourceGroupName string = rg.name
