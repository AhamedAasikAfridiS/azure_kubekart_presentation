- create a resource group 
- ALL RESOURCES REGION SHOULD BE IN central india 
- create a vnet 
- create a subnet for application gateway 
- create a subnet for the private endpoint
- create a subnet for the vnet integration and delegate it to Microsoft.Web/serverFarms
- create a nat gateway and associate it with the subnet for the vnet integration

- create a azure frontdoor and it should point to the application gateway 

- create a application gateway and associate it with the subnet for the application gateway and create a public ip for the application gateway and attach that to the gateway , attch the waf policy to that application gateway, create a domain name listener for "www.aasikdevops.website" and it should be a http listener and create a backend setting for http 80 and also create a backend pool that connects to the app service private endpoint and attach that backend pool to the http listener

- create a private dns zone for the app service and link it to the vnet and create an record for the app service in the private dns zone
- create a private endpoint for the app service and associate it with the subnet for the private endpoint and connect it to the app service
- create an app service plan and attach to it 
- allow the app service to access all the key vaults in the resource group 
- dont create db in the app service configuration
- enable basic authentication under the authentication settings.enable continous deployment for the app service
- diable public access to the app service and only allow access through the private endpoint
- enable vnet integration for the app service and connect it to the subnet for the vnet integration
- create a key vault and store the secrets for the app service in the key vault and give access to the app service to read the secrets from the key vault
- create a log analytics workspace and link it to the app service for monitoring and logging purposes

- create an cosmos db for mongo db and create a private endpoint for the cosmos db and associate it with the subnet for the private endpoint and connect it to the cosmos db
- create a record of that private endpoint in the private dns zone for the cosmos db
- create a key vault and store the secrets for the cosmos db in the key vault and give access to the cosmos db to read the secrets from the key vault
- create a log analytics workspace and link it to the cosmos db for monitoring and logging purposes

- create a storage account and create a private endpoint for the storage account and associate it with the subnet for the private endpoint and connect it to the storage account
- create a blob container in the storage account and store the application logs in the blob container
- create a record of that private endpoint in the private dns zone for the storage account
- create a key vault and store the secrets for the storage account in the key vault and give access to the storage account to read the secrets from the key vault
- geo-replication should be enabled for the storage account for disaster recovery purposes
- create a log analytics workspace and link it to the storage account for monitoring and logging purposes

- create a service bus namespace and create a private endpoint for the service bus namespace and associate it with the subnet for the private endpoint and connect it to the service bus namespace
- basic pricing tier should be selected for the service bus namespace
- disable public access to the service bus namespace and only allow access through the private endpoint
- create a record of that private endpoint in the private dns zone for the service bus namespace
- create a key vault and store the secrets for the service bus namespace in the key vault and give access to the service bus namespace to read the secrets from the key vault
- create a log analytics workspace and link it to the service bus namespace for monitoring and logging purposes


- INCLUDE ANYTHING I HAVE MISSED IT 
- DISABLE PUBLIC ACCESS TO ALL THE RESOURCES AND ONLY ALLOW ACCESS THROUGH THE PRIVATE ENDPOINTS
- ENABLE MONITORING AND LOGGING FOR ALL THE RESOURCES USING LOG ANALYTICS WORKSPACE
- NO NSG ANYWHERE AS OF NOW



