#!/bin/bash

# Exit on error
set -e

# Configuration
RESOURCE_GROUP="ktu-result-analyzer-rg"
APP_NAME="ktu-result-analyzer"
LOCATION="centralus"
APP_SERVICE_PLAN="ktu-result-plan"
SKU="B1"
MONGODB_URI="mongodb+srv://josephliyon23:jliyon23@liyonproduction.nydwerw.mongodb.net/ktu"

# Login to Azure (uncomment if not already logged in)
# az login

# Create resource group
echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create app service plan
echo "Creating app service plan..."
az appservice plan create --name $APP_SERVICE_PLAN --resource-group $RESOURCE_GROUP --sku $SKU --is-linux

# Create web app with Docker container
echo "Creating web app..."
az webapp create --resource-group $RESOURCE_GROUP --plan $APP_SERVICE_PLAN --name $APP_NAME --deployment-container-image-name node:18-slim

# Configure the web app to use our Dockerfile
echo "Configuring web app..."
az webapp config set --resource-group $RESOURCE_GROUP --name $APP_NAME --always-on true
az webapp log config --resource-group $RESOURCE_GROUP --name $APP_NAME --docker-container-logging filesystem

# Set environment variables
echo "Setting environment variables..."
az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings MONGODB_URI=$MONGODB_URI NODE_ENV=production PORT=8080

# Enable CD from a local Git repo
echo "Enabling local Git deployment..."
az webapp deployment source config-local-git --resource-group $RESOURCE_GROUP --name $APP_NAME

# Get the Git remote URL
REMOTE_URL=$(az webapp deployment list-publishing-profiles --resource-group $RESOURCE_GROUP --name $APP_NAME --query "[?publishMethod=='MSDeploy'].publishUrl" -o tsv)
USERNAME=$(az webapp deployment list-publishing-credentials --resource-group $RESOURCE_GROUP --name $APP_NAME --query publishingUserName -o tsv)
PASSWORD=$(az webapp deployment list-publishing-credentials --resource-group $RESOURCE_GROUP --name $APP_NAME --query publishingPassword -o tsv)

echo "======================================="
echo "Deployment set up successfully!"
echo "======================================="
echo "To deploy your app, run the following commands:"
echo "git remote add azure $REMOTE_URL"
echo "git push azure master"
echo "Username: $USERNAME"
echo "Password: $PASSWORD"
echo "======================================="
echo "Remember to update the MONGODB_URI in this script with your actual MongoDB connection string."
echo "=======================================" 