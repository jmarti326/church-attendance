using 'main.bicep'

param resourceGroupName = 'rg-church-attendance'
param location = 'eastus'
param acrName = 'acrchurchattendance'
param environmentName = 'cae-church-attendance'
param containerAppName = 'ca-church-attendance'
param imageTag = 'latest'
// pgPassword is a secure param — provide at deployment time via --parameters or key vault
