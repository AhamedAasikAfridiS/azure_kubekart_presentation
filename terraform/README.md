# KubeCart Terraform Learning Implementation

This directory implements the architecture in `../architecture.md` and
`../architecture.excalidraw` with deliberately simple Terraform.

It uses:

- AzureRM provider `4.74.0`
- Local Terraform modules
- Terraform workspaces
- Plain variables, locals, resources, and outputs

It intentionally does not use:

- Remote state or a backend
- `for_each`, `count`, or dynamic blocks
- Provisioners
- Import blocks
- Custom conditions or complex expressions
- NSGs

## Architecture Created

The modules create:

1. One resource group in Central India.
2. One VNet with dedicated Application Gateway, App Service VNet integration,
   and private endpoint subnets.
3. One NAT Gateway on the App Service VNet integration subnet.
4. Private DNS zones for App Service, Blob Storage, Cosmos DB for MongoDB,
   Service Bus, and Key Vault.
5. One user-assigned identity for App Service.
6. One Log Analytics workspace.
7. One GRS Storage account and an application log container.
8. One Cosmos DB account using the MongoDB API.
9. One Service Bus namespace and `notifications` queue.
10. One Key Vault containing the database, Storage, and Service Bus connection
    strings.
11. One Linux App Service plan and web app.
12. One WAF_v2 Application Gateway with an HTTP listener for
    `www.aasikdevops.website`.
13. One Azure Front Door Standard profile that sends traffic to the public
    Application Gateway.
14. Private endpoints for App Service, Key Vault, Blob Storage, Cosmos DB, and
    Service Bus.
15. Diagnostic settings that send supported logs and metrics to Log Analytics.

## Module Layout

```text
terraform/
|-- main.tf
|-- variables.tf
|-- locals.tf
|-- outputs.tf
|-- providers.tf
|-- versions.tf
|-- terraform.tfvars.example
`-- modules/
    |-- resource_group/
    |-- network/
    |-- identity/
    |-- monitoring/
    |-- storage/
    |-- cosmos_db/
    |-- service_bus/
    |-- key_vault/
    |-- app_service/
    |-- application_gateway/
    `-- front_door/
```

Each module has only one `main.tf` so you can follow its variables, resources,
and outputs from top to bottom.

## Important Architecture Corrections

### Service Bus must use Premium

The requirement requested the Basic tier together with a private endpoint.
Azure Service Bus Private Link requires the Premium tier, so this code uses
`Premium`.

### One shared Key Vault and Log Analytics workspace

The requirements repeat Key Vault and Log Analytics for several resources.
This implementation creates one of each. The App Service identity reads the
secrets. Cosmos DB, Storage, and Service Bus do not need permission to read
their own connection strings.

### Front Door is global

Azure Front Door is a global Azure service and therefore is not deployed in
Central India. Its Application Gateway origin and all regional resources are
in Central India.

### The Application Gateway is still public

Front Door uses the Application Gateway public FQDN as its origin. Because the
requirements say not to create an NSG, Terraform does not restrict the
Application Gateway public IP to Front Door traffic only. The listener checks
the requested host name, but that is not a complete network restriction.

### Continuous deployment and private App Service access

The App Service source-control link is configured from
`source_control_repo_url`. Public network access to the web app is disabled as
requested. A public hosted deployment service may not be able to reach the
private SCM endpoint after lockdown. A private runner in the VNet is normally
needed for reliable private deployment.

### Key Vault secrets are also present in Terraform state

Terraform must receive the generated connection strings before it can create
the Key Vault secrets. Sensitive values are hidden in normal terminal output,
but they are still stored in the local Terraform state file. Do not commit
state files.

## Workspace Behavior

The workspace name becomes the environment suffix in resource names.

| Terraform workspace | Environment suffix |
|---|---|
| `default` | `dev` |
| `dev` | `dev` |
| `test` | `test` |
| `prod` | `prod` |

Every workspace has separate Terraform state. For example:

```text
rg-kubecart-dev
rg-kubecart-test
rg-kubecart-prod
```

Do not create both the `default` and `dev` workspaces against the same Azure
subscription because both use the `dev` name suffix.

## Before You Plan

1. Install Terraform.
2. Install Azure CLI.
3. Sign in with `az login`.
4. Select the intended subscription.
5. Copy `terraform.tfvars.example` to `terraform.tfvars`.
6. Replace `unique_suffix` with 4-6 lowercase letters or numbers unique to you.
7. Replace `source_control_repo_url` with the real repository URL.

## Beginner Command Order

Run these commands from this `terraform` directory:

```powershell
terraform init
terraform workspace new dev
terraform workspace select dev
terraform fmt -check -recursive
terraform validate
terraform plan
```

For a production workspace:

```powershell
terraform workspace new prod
terraform workspace select prod
terraform plan
```

Read the entire plan before running `terraform apply`. This repository does
not run `terraform apply` automatically.

## Traffic Flow

```text
User
  -> Azure Front Door
  -> Application Gateway public HTTP listener
  -> App Service private endpoint
  -> App Service
  -> VNet integration subnet
  -> private endpoints for Key Vault, Storage, Cosmos DB, and Service Bus
```

Application Gateway reaches the normal App Service hostname. Private DNS
resolves that hostname to the App Service private endpoint IP.

## DNS Note for the Custom Domain

The Application Gateway listener accepts `www.aasikdevops.website`, and Front
Door sends that host header to Application Gateway. The Terraform code does
not create the public DNS zone or validate a Front Door custom domain because
the architecture did not provide DNS-zone ownership details.

The generated Front Door hostname is returned as
`front_door_endpoint_hostname`.

## Cost Warning

This is not a low-cost architecture. Application Gateway WAF_v2, App Service
Premium v3, Service Bus Premium, Cosmos DB, Front Door, NAT Gateway, private
endpoints, and Log Analytics can all create charges even with little traffic.

