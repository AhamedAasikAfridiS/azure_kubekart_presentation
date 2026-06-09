# KubeCart Terraform Presentation Study Guide

This guide explains the complete `terraform/` folder in beginner-friendly
language. It is designed for a technical review of the current implementation,
not as a generic Terraform tutorial.

## 1. The 60-Second Explanation

The Terraform code creates a private Azure platform for the KubeCart monolithic
application.

The public entry point is Azure Application Gateway. The App Service itself is
not publicly accessible. Application Gateway reaches App Service through an App
Service private endpoint. The App Service uses VNet Integration to make outbound
connections to private endpoints for Cosmos DB, Storage, Service Bus, and Key
Vault.

Terraform creates:

- 10 local modules.
- 51 Azure resource blocks.
- 1 Azure data source.
- Separate state per Terraform workspace.
- Resource names containing the workspace environment.

The main request flow is:

```text
Internet user
    |
    v
Application Gateway public IP and HTTP listener
    |
    v
App Service private endpoint
    |
    v
Node.js KubeCart monolith
    |
    +--> Key Vault private endpoint
    +--> Cosmos DB private endpoint
    +--> Storage private endpoint
    +--> Service Bus private endpoint
```

The shortest presentation statement is:

> This implementation uses Terraform local modules and workspaces to deploy a
> private Azure PaaS architecture. Application Gateway is the only application
> ingress, App Service uses a private endpoint for inbound traffic and VNet
> Integration for outbound traffic, secrets are stored in Key Vault, and
> diagnostics are centralized in Log Analytics.

## 2. Terraform Concepts Used Here

### Provider

A provider is the plugin Terraform uses to communicate with an external system.

This project uses:

```hcl
provider "azurerm" {
  features {}
}
```

`azurerm` means the Azure Resource Manager provider. It translates Terraform
resource blocks into Azure Resource Manager API calls.

The provider version is pinned to `4.74.0` in `versions.tf`. Pinning avoids an
unexpected provider upgrade changing resource behavior.

### Resource

A resource is something Terraform creates or manages.

Example:

```hcl
resource "azurerm_resource_group" "this" {
  name     = var.name
  location = var.location
}
```

`azurerm_resource_group` is the Azure resource type. `this` is Terraform's local
name for that resource inside the module.

### Variable

A variable is an input.

Root variables such as `project_name`, `location`, and `unique_suffix` receive
values from defaults, command-line options, environment variables, or
`terraform.tfvars`.

Module variables are the inputs passed from the root module into each child
module.

### Local Value

A local value is a calculated value used to avoid repeating expressions.

This project calculates the environment and common resource names in
`locals.tf`.

```hcl
environment = terraform.workspace == "default" ? "dev" : terraform.workspace
name_prefix = "${var.project_name}-${local.environment}"
```

### Module

A module is a reusable group of Terraform code.

The root `main.tf` calls ten local modules. Each module hides the details of one
part of the architecture, such as networking or Storage.

### Output

An output exposes a value from a module.

For example, the network module outputs the private endpoint subnet ID. The
Storage, Cosmos DB, Service Bus, Key Vault, and App Service modules consume that
ID.

Outputs are how modules are connected.

### Data Source

A data source reads existing information without creating a resource.

The Key Vault module uses:

```hcl
data "azurerm_client_config" "current" {}
```

This obtains the tenant ID and object ID of the identity currently running
Terraform. That identity receives permission to create and manage secrets.

### State

Terraform state records the relationship between Terraform addresses and real
Azure resource IDs.

Examples of Terraform addresses are:

```text
module.network.azurerm_virtual_network.this
module.app_service.azurerm_linux_web_app.this
module.service_bus.azurerm_servicebus_queue.this
```

This project currently has no remote backend configuration, so state is local.
That is acceptable for learning, but team or production use should store state
in a secured Azure Storage backend with locking and restricted access.

Important: connection strings are marked sensitive for terminal display, but
they still exist inside Terraform state.

### Dependency Graph

Terraform does not primarily execute files from top to bottom. It builds a
dependency graph from references.

For example:

```hcl
resource_group_name = module.resource_group.name
```

This tells Terraform that the consuming module depends on the resource group
module. Terraform therefore creates the resource group first.

There is no explicit `depends_on` in this implementation because normal output
references already create the required dependencies.

## 3. Folder Structure

```text
terraform/
|-- versions.tf
|-- providers.tf
|-- variables.tf
|-- locals.tf
|-- main.tf
|-- outputs.tf
|-- terraform.tfvars
|-- terraform.tfvars.example
|-- .terraform.lock.hcl
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
    `-- application_gateway/
```

### Root File Responsibilities

| File | Purpose |
|---|---|
| `versions.tf` | Requires Terraform 1.5+ and pins AzureRM 4.74.0. |
| `providers.tf` | Configures the AzureRM provider. |
| `variables.tf` | Declares user-provided root inputs. |
| `locals.tf` | Calculates environment names, Azure names, and common tags. |
| `main.tf` | Calls and connects all ten child modules. |
| `outputs.tf` | Displays important deployment results. |
| `terraform.tfvars` | Supplies values for the current checkout. |
| `terraform.tfvars.example` | Safe template for future environments. |
| `.terraform.lock.hcl` | Locks the selected provider package and checksums. |

## 4. Workspace Behavior

Terraform workspaces allow the same code to maintain separate state files.

The current mapping is:

| Workspace | Calculated environment |
|---|---|
| `default` | `dev` |
| `dev` | `dev` |
| `test` | `test` |
| `prod` | `prod` |

For a `test` workspace:

```text
terraform.workspace = "test"
local.environment    = "test"
local.name_prefix    = "kubecart-test"
resource group       = "rg-kubecart-test"
```

Important limitation: both the `default` and `dev` workspaces calculate `dev`.
Do not deploy both into the same subscription because they would attempt to use
the same Azure names while keeping separate Terraform states.

Workspaces separate state, but they do not automatically create different
subscriptions, credentials, variable files, security controls, or approval
processes.

## 5. Resource Naming

The common prefix is:

```text
<project>-<environment>
```

For example:

```text
kubecart-dev
```

Typical generated names are:

```text
rg-kubecart-dev
vnet-kubecart-dev
asp-kubecart-dev
app-kubecart-dev-<unique-suffix>
cosmos-kubecart-dev-<unique-suffix>
```

The suffix is needed because App Service, Cosmos DB, Key Vault, Service Bus, and
Storage names have global uniqueness requirements.

Some names are normalized or truncated:

- Storage removes hyphens, converts to lowercase, and limits the name to 24
  characters.
- Key Vault limits the name to 24 characters.
- Service Bus limits the name to 50 characters.

All resources receive these common tags:

```text
Project     = kubecart
Environment = dev/test/prod
ManagedBy   = Terraform
```

## 6. Root Module Dependency Order

The real high-level dependency graph is:

```text
resource_group
    |
    +--> network
    +--> identity
    +--> monitoring
             |
             +--> storage
             +--> cosmos_db
             +--> service_bus
                       |
                       +--> key_vault
                                |
                                +--> app_service
                                         |
                                         +--> application_gateway
```

More precisely:

1. Resource Group creates the common Azure container.
2. Network creates subnets, NAT, private DNS zones, and DNS links.
3. Identity creates the App Service user-assigned managed identity.
4. Monitoring creates the Log Analytics workspace.
5. Storage, Cosmos DB, and Service Bus create private platform services.
6. Key Vault receives connection strings generated by those services.
7. App Service receives Key Vault secret references and network IDs.
8. Application Gateway receives the App Service hostname as its backend.

Terraform may create independent branches in parallel. For example, identity
and monitoring do not depend on each other.

## 7. Module-by-Module Explanation

### 7.1 Resource Group Module

File: `terraform/modules/resource_group/main.tf`

Creates:

- One `azurerm_resource_group`.

Why it exists:

- It is the Azure lifecycle and organization boundary for all resources.
- It provides a common name and location to every other module.

Outputs:

- Resource group name.
- Resource group location.
- Resource group ID.

Presentation line:

> The resource group module is the root infrastructure dependency. All other
> Azure resources are placed in this common Central India resource group.

### 7.2 Network Module

File: `terraform/modules/network/main.tf`

Creates:

- One VNet using `10.20.0.0/16`.
- Application Gateway subnet: `10.20.0.0/24`.
- App Service VNet Integration subnet: `10.20.1.0/26`.
- Private endpoint subnet: `10.20.2.0/24`.
- One Standard NAT Gateway and one static public IP.
- Five private DNS zones.
- Five VNet links for those private DNS zones.

#### Why Three Subnets?

Application Gateway requires a dedicated subnet.

App Service VNet Integration requires a subnet delegated to
`Microsoft.Web/serverFarms`.

Private endpoints receive private IP addresses and are grouped in a separate
subnet.

This separation gives each Azure feature the subnet design it expects.

#### Why Delegate the VNet Integration Subnet?

Delegation tells Azure that the subnet is reserved for App Service integration.
It allows the App Service platform to configure the required networking inside
that subnet.

#### Why Use a NAT Gateway?

The NAT Gateway is attached to the VNet Integration subnet. Because App Service
sets `vnet_route_all_enabled = true`, outbound internet traffic routed through
the VNet can use the NAT Gateway's static public IP.

Private endpoint traffic does not need the NAT Gateway. It remains inside the
private Azure network.

#### Private DNS Zones

The module creates:

| Service | Private DNS zone |
|---|---|
| App Service | `privatelink.azurewebsites.net` |
| Blob Storage | `privatelink.blob.core.windows.net` |
| Cosmos DB Mongo API | `privatelink.mongo.cosmos.azure.com` |
| Service Bus | `privatelink.servicebus.windows.net` |
| Key Vault | `privatelink.vaultcore.azure.net` |

Each zone is linked to the VNet. Private endpoint modules add their DNS records
through private DNS zone groups.

Presentation line:

> The network module separates ingress, App Service outbound integration, and
> private endpoints. Private DNS is essential because normal Azure service
> hostnames must resolve to private endpoint IP addresses inside the VNet.

### 7.3 Identity Module

File: `terraform/modules/identity/main.tf`

Creates:

- One user-assigned managed identity for App Service.

Outputs:

- Azure resource ID.
- Client ID.
- Principal ID.

These IDs have different purposes:

- Resource ID attaches the identity to App Service.
- Client ID identifies the selected identity to the Azure SDK and Key Vault
  reference system.
- Principal ID is used in authorization policies and role assignments.

The identity receives:

- `Get` and `List` access to Key Vault secrets.
- `Storage Blob Data Contributor` on the Storage account.

Presentation line:

> Managed identity gives the application an Azure identity without storing an
> identity password in application settings.

### 7.4 Monitoring Module

File: `terraform/modules/monitoring/main.tf`

Creates:

- One Log Analytics workspace.
- `PerGB2018` pricing.
- 30-day retention.

The workspace ID is passed to Storage, Cosmos DB, Service Bus, Key Vault, App
Service, and Application Gateway diagnostic settings.

Why one shared workspace?

- Centralized searches and dashboards.
- Easier incident investigation across services.
- Avoids unnecessary duplicate workspaces.

Presentation line:

> Diagnostic settings are configured on the resources, while Log Analytics is
> the shared destination where platform logs and metrics are collected.

### 7.5 Storage Module

File: `terraform/modules/storage/main.tf`

Creates:

- One Standard StorageV2 account.
- GRS replication.
- TLS 1.2 minimum.
- Blob versioning.
- Public network access disabled.
- Private `application-logs` container.
- Blob private endpoint.
- Private DNS integration.
- App identity Blob Data Contributor role.
- Storage account and Blob diagnostic settings.

#### Why GRS?

Geo-redundant storage replicates data to Azure's paired secondary region. It
improves durability, but it does not by itself make the application a complete
multi-region disaster recovery solution.

#### Why Both Identity Access and a Connection String?

The role assignment supports identity-based Blob access. However, the current
App Service settings also provide
`AZURE_STORAGE_CONNECTION_STRING` through Key Vault.

That means the implementation currently supports a connection-string path and
also grants managed identity data access. A future cleanup could standardize on
one application access method.

#### Monitoring

Account metrics include transactions and capacity. Blob diagnostics include
read, write, and delete operations.

Presentation line:

> Storage is private, geo-redundant, versioned, monitored, and reachable through
> a Blob private endpoint.

### 7.6 Cosmos DB Module

File: `terraform/modules/cosmos_db/main.tf`

Creates:

- One Cosmos DB account using the MongoDB API.
- MongoDB server version 4.2.
- Session consistency.
- One `kubecart` Mongo database.
- Fixed 400 RU/s database throughput.
- Public network access disabled.
- MongoDB private endpoint and DNS integration.
- Data plane, Mongo request, and request metric diagnostics.

#### Why Session Consistency?

Session consistency provides read-your-own-writes behavior for a client session
without the latency and availability trade-offs of strong consistency.

#### What Is RU/s?

Request Units per second are Cosmos DB's throughput capacity. Reads, writes,
queries, and indexing consume RUs. This code provisions 400 RU/s at the database
level.

#### Connection String Flow

Cosmos DB outputs its primary MongoDB connection string as a sensitive value.
The root module passes it into Key Vault, where it is stored as `mongo-uri`.

Presentation line:

> Cosmos DB provides the MongoDB-compatible application database. Its public
> endpoint is disabled and its generated connection string is moved into Key
> Vault for App Service consumption.

### 7.7 Service Bus Module

File: `terraform/modules/service_bus/main.tf`

Creates:

- One Premium Service Bus namespace.
- Capacity of one messaging unit.
- One premium messaging partition.
- TLS 1.2 minimum.
- Public network access disabled.
- One `notifications` queue.
- One send-only namespace authorization rule.
- One private endpoint and private DNS integration.
- Operational, network filtering, and metric diagnostics.

#### Why Premium Instead of Basic?

The original architecture requested Basic, but Service Bus private endpoints
require Premium. The code correctly chooses Premium to satisfy the private
networking requirement.

#### Least-Privilege SAS Rule

The authorization rule has:

```text
listen = false
send   = true
manage = false
```

The App Service can send notification messages but cannot receive messages or
manage the namespace.

The send-only connection string is stored in Key Vault as:

```text
servicebus-sender-connection
```

Important scope note: the Terraform currently does not create the Azure
Function that consumes this queue, and it does not create a receiver identity
or listen authorization for that Function.

Presentation line:

> Service Bus decouples notification work from the web request. The web app has
> a send-only credential, which is narrower than a full management credential.

### 7.8 Key Vault Module

File: `terraform/modules/key_vault/main.tf`

Creates:

- One Standard Key Vault.
- Purge protection.
- Seven-day soft-delete retention.
- Firewall with deny-by-default behavior.
- Access policy for the Terraform runner.
- Read-only secret policy for the App Service identity.
- Three secrets.
- One private endpoint and private DNS integration.
- Audit and metric diagnostics.

Secrets:

| Secret name | Source |
|---|---|
| `mongo-uri` | Cosmos DB primary MongoDB connection string |
| `storage-connection-string` | Storage primary connection string |
| `servicebus-sender-connection` | Service Bus send-only SAS connection |

#### Why Is Public Network Access Enabled?

Key Vault is the exception to the general public-access lockdown.

Terraform is running from a public workstation. It must make data-plane calls
to create the secrets. Therefore:

- The Key Vault public endpoint remains enabled.
- The firewall default action is `Deny`.
- Azure trusted services are bypassed.
- Only `terraform_runner_ip_address/32` is allowlisted.
- A private endpoint also exists for application access.

If the workstation public IP changes, secret creation may fail until the
variable is updated.

#### Access Policy Model

This module uses Key Vault access policies, not Azure RBAC authorization.

The Terraform runner can create, recover, delete, purge, list, and read secrets.
The App Service identity can only get and list secrets.

#### Secret IDs

The module outputs versionless secret IDs. App Service Key Vault references
therefore continue pointing at the latest secret version after rotation.

Presentation line:

> Key Vault centralizes the generated connection strings. Terraform has write
> access, while the App Service identity has read-only access.

### 7.9 App Service Module

File: `terraform/modules/app_service/main.tf`

Creates:

- One Linux App Service plan using B1.
- One Linux Web App using Node.js 20 LTS.
- Source-control integration.
- VNet Integration.
- User-assigned identity attachment.
- App Service private endpoint and DNS integration.
- App Service diagnostics.

#### Inbound Networking

`public_network_access_enabled = false` prevents direct public application
access.

The App Service private endpoint provides a private IP in the private endpoint
subnet. Application Gateway reaches the app through that private path.

#### Outbound Networking

`virtual_network_subnet_id` connects App Service to the delegated VNet
Integration subnet.

`vnet_route_all_enabled = true` and `WEBSITE_VNET_ROUTE_ALL = 1` route
application outbound traffic through the VNet. This lets App Service resolve
and reach the private endpoints for Key Vault, Storage, Cosmos DB, and Service
Bus.

#### Private Endpoint vs VNet Integration

This is one of the most important review concepts:

| Feature | Direction | Purpose |
|---|---|---|
| Private endpoint | Inbound to App Service | Lets Application Gateway privately reach the web app. |
| VNet Integration | Outbound from App Service | Lets the web app privately reach dependencies. |

VNet Integration does not make App Service privately reachable inbound.
The private endpoint does not automatically provide App Service outbound access.

#### Key Vault References

App settings do not contain literal database, Storage, or Service Bus connection
strings. They contain Key Vault reference expressions:

```text
MONGO_URI
AZURE_STORAGE_CONNECTION_STRING
SERVICE_BUS_CONNECTION_STRING
```

The App Service platform resolves those references using the user-assigned
identity selected by `key_vault_reference_identity_id`.

The queue name is configured directly as:

```text
SERVICE_BUS_NOTIFICATION_QUEUE = notifications
```

#### Health Checks

App Service checks `/health`. The Application Gateway probe also checks
`/health`. The repository's `server.js` implements that route.

#### Continuous Deployment Limitation

Source control integration points at the configured repository and branch.
Because the App Service public endpoint is disabled, a public hosted deployment
service may not be able to reach the private SCM endpoint. A self-hosted or
private runner with VNet access is normally required.

The current `terraform.tfvars` repository URL is still a placeholder and must
be replaced before real deployment.

#### Authentication Clarification

The following settings enable deployment publishing credentials:

```text
ftp_publish_basic_authentication_enabled
webdeploy_publish_basic_authentication_enabled
```

They do not configure end-user authentication.

The repository README mentions Microsoft Entra ID through App Service
Authentication, but this Terraform module currently has no `auth_settings_v2`
configuration. Entra Easy Auth is therefore outside the implemented Terraform
scope at present.

Presentation line:

> App Service is private inbound, VNet-integrated outbound, uses a
> user-assigned identity for Key Vault references, and runs the Node.js 20
> monolith on a B1 Linux plan.

### 7.10 Application Gateway Module

File: `terraform/modules/application_gateway/main.tf`

Creates:

- One Standard static public IP with an Azure FQDN.
- One WAF policy in Prevention mode.
- OWASP managed rule set 3.2.
- One WAF_v2 Application Gateway with capacity one.
- Public HTTP frontend on port 80.
- Host-based listener for `www.aasikdevops.website`.
- App Service FQDN backend pool.
- HTTP backend settings on port 80.
- `/health` probe.
- One basic routing rule.
- Access, performance, firewall, and metric diagnostics.

#### Request Routing

The listener accepts requests only when the host header matches the configured
domain.

The backend pool uses the App Service default hostname. Inside the VNet, private
DNS resolves that hostname through the App Service private-link DNS chain to the
private endpoint IP.

`pick_host_name_from_backend_address = true` sends the App Service hostname as
the backend host header. App Service expects that hostname unless a matching
custom domain is configured on the web app.

#### WAF

The Web Application Firewall uses OWASP 3.2 managed rules in Prevention mode.
Prevention mode actively blocks requests that match configured attack rules.

#### HTTP-Only Design

The listener and backend both use HTTP port 80. App Service also sets
`https_only = false`.

This matches the current architecture request, but it means traffic is not
TLS-encrypted at the public listener. A production design should add an HTTPS
listener, certificate management, and normally HTTP-to-HTTPS redirection.

#### Public DNS

Terraform creates an Azure FQDN on the Application Gateway public IP, but it
does not manage the public DNS zone for `aasikdevops.website`.

The custom hostname must be pointed manually to the output:

```text
application_gateway_public_fqdn
```

Presentation line:

> Application Gateway is the only public application entry point. It applies
> WAF inspection and forwards healthy requests to the App Service private
> endpoint using private DNS.

## 8. Four End-to-End Flows

### Flow 1: User Request

```text
1. User requests http://www.aasikdevops.website.
2. Public DNS sends the user to the Application Gateway public FQDN/IP.
3. The host-based HTTP listener accepts the request.
4. WAF evaluates the request using OWASP 3.2 rules.
5. The routing rule selects the App Service backend pool.
6. Private DNS resolves the App Service hostname to its private endpoint IP.
7. Application Gateway sends HTTP traffic to App Service.
8. The Node.js application returns the response.
```

### Flow 2: Application Secret Resolution

```text
1. App Service starts with Key Vault reference strings in app settings.
2. App Service uses the configured user-assigned managed identity.
3. Private DNS resolves the Key Vault hostname to its private endpoint.
4. Key Vault checks the identity's secret access policy.
5. App Service receives the latest secret value.
6. The application receives the resolved setting as an environment variable.
```

### Flow 3: Database and Messaging Access

```text
1. Application code reads MONGO_URI or SERVICE_BUS_CONNECTION_STRING.
2. Outbound traffic enters the VNet Integration subnet.
3. Private DNS resolves the service hostname to a private endpoint IP.
4. Traffic reaches Cosmos DB or Service Bus privately.
5. Public network access on the target service remains disabled.
```

### Flow 4: Monitoring

```text
1. Azure resources produce platform logs and metrics.
2. Diagnostic settings select categories for each resource.
3. Azure sends the selected telemetry to Log Analytics.
4. Operators query the shared workspace during reviews or incidents.
5. App Service diagnostics are also configured with the Storage account.
```

## 9. Security Model

### Publicly Reachable Components

- Application Gateway public IP and HTTP listener.
- NAT Gateway public IP for outbound traffic.
- Key Vault public endpoint, but only through its deny-by-default firewall and
  the configured Terraform runner IP.

### Private Components

- App Service application endpoint.
- Blob Storage data endpoint.
- Cosmos DB MongoDB endpoint.
- Service Bus namespace endpoint.
- Key Vault application path through its private endpoint.

### Identity and Secret Controls

- App Service uses a user-assigned managed identity.
- App Service gets only `Get` and `List` on Key Vault secrets.
- Service Bus credential is send-only.
- Storage grants Blob Data Contributor to the app identity.
- Sensitive output flags hide values in normal Terraform output.
- Sensitive values still remain in Terraform state.

### Intentional Omissions

- No NSGs are configured because the architecture explicitly says no NSGs for
  now.
- No HTTPS listener or certificate is configured.
- No remote state backend is configured.

## 10. What Happens During Terraform Commands?

### `terraform init`

- Initializes the working directory.
- Downloads AzureRM 4.74.0.
- Reads or creates `.terraform.lock.hcl`.
- Initializes the backend.

### `terraform fmt -check -recursive`

- Checks Terraform formatting.
- Does not change Azure.
- The current Terraform files pass this check.

### `terraform validate`

- Checks Terraform syntax and internal provider schema usage.
- Does not create Azure resources.
- It requires the provider plugin to be installed by `terraform init`.

In the current checkout, validation could not run because the AzureRM package is
not present in `.terraform/providers`, even though the lock file exists. Run
`terraform init` before trying validation again.

### `terraform plan`

- Reads configuration and state.
- Authenticates to Azure.
- Refreshes known resources.
- Calculates proposed create, update, and delete actions.
- Does not normally change Azure.

### `terraform apply`

- Shows or consumes a plan.
- Calls Azure APIs to make the planned changes.
- Updates Terraform state.

### `terraform destroy`

- Plans and deletes resources tracked in the selected workspace state.
- Must be used carefully because Key Vault purge protection and other Azure
  lifecycle behavior can affect complete cleanup.

## 11. Typical Command Sequence

```powershell
cd terraform
az login
az account set --subscription "<subscription-name-or-id>"
terraform init
terraform workspace new dev
terraform workspace select dev
terraform fmt -check -recursive
terraform validate
terraform plan
```

If `dev` already exists:

```powershell
terraform workspace select dev
```

Before `plan`:

- Replace the placeholder repository URL.
- Confirm the selected Azure subscription.
- Confirm the workspace.
- Confirm the public Terraform runner IP.
- Confirm the unique suffix.
- Confirm the expected monthly cost.

Do not run `apply` until the plan has been reviewed.

## 12. Current Implementation Gaps and Review Answers

These are not all Terraform syntax errors. They are boundaries between the
documented target architecture and what the current Terraform actually creates.

### Notification Function Is Not Provisioned

The application repository contains `notification-function/`, but the Terraform
folder has no Function App, Function Storage account, Function identity,
Service Bus receiver role, or Function app settings.

Recommended review answer:

> The current Terraform provisions the Service Bus sender side used by the web
> app. Function infrastructure is a remaining module and is not represented in
> this Terraform folder yet.

### Entra Easy Auth Is Not Configured

The App Service Terraform has publishing basic-authentication settings, but no
App Service Authentication or `auth_settings_v2` block.

Recommended review answer:

> Managed identity is implemented for Azure resource access. End-user Entra
> authentication is documented at application architecture level but still
> needs an App Service Authentication configuration.

### Public DNS Is Manual

The code outputs the Application Gateway Azure FQDN but does not create the
public DNS zone or custom domain record.

Recommended review answer:

> DNS ownership may be external to this stack. Terraform exposes the gateway
> FQDN, and the custom domain record must currently be created separately.

### Traffic Is HTTP-Only

The Application Gateway public listener and backend setting use port 80.

Recommended review answer:

> The current code follows the stated HTTP-only lab requirement. Production
> hardening would add Key Vault-backed certificates, HTTPS listeners, and
> redirect rules.

### State Is Local

There is no backend block.

Recommended review answer:

> Local state keeps the learning implementation simple. Team deployment should
> move state to a secured Azure Storage backend before applying production
> infrastructure.

### Key Vault Is Not Fully Publicly Disabled

Its endpoint is public but protected by a firewall and a `/32` allowlist.

Recommended review answer:

> Terraform must reach the Key Vault data plane to create secrets. Because the
> runner is currently outside the VNet, the endpoint stays enabled with
> deny-by-default ACLs. A private runner would allow full public disablement.

### Continuous Deployment May Need a Private Runner

The app endpoint is private, so a hosted deployment agent may not reach the SCM
endpoint.

Recommended review answer:

> Source control integration is declared, but private App Service deployment
> normally requires a runner with VNet reachability or another controlled
> deployment path.

### `.gitignore` Is Currently Deleted in the Working Tree

The tracked Terraform `.gitignore` normally excludes:

```text
.terraform/
*.tfstate
*.tfstate.*
crash.log
```

It should exist before creating local state so provider binaries and sensitive
state files are not accidentally committed.

## 13. Likely Review Questions and Short Answers

### Why use modules?

Modules separate responsibilities, reduce root-file complexity, and make parts
such as networking reusable and independently understandable.

### Why use workspaces?

Workspaces let the same configuration maintain separate state for environments
such as dev, test, and prod.

### Does a workspace automatically isolate Azure resources?

No. Isolation comes from separate state plus environment-specific naming and
careful subscription and variable selection.

### How does Terraform know creation order?

References between module outputs and inputs create an implicit dependency
graph.

### Why are private DNS zones required?

Private endpoints use private IPs, but applications still connect using normal
Azure hostnames. Private DNS makes those hostnames resolve to private IPs inside
the VNet.

### Difference between private endpoint and VNet Integration?

A private endpoint provides private inbound access to a service. App Service
VNet Integration provides outbound access from the app into the VNet.

### Why does App Service need both?

Application Gateway needs a private inbound route to App Service, while App
Service needs private outbound routes to Key Vault, Storage, Cosmos DB, and
Service Bus.

### Why is Application Gateway public?

It is the controlled public ingress. The backend application remains private.

### Why use WAF?

WAF inspects web requests and blocks common attacks using OWASP managed rules.

### Why Service Bus Premium?

Private Link for Azure Service Bus requires the Premium tier.

### Why use a send-only Service Bus rule?

It follows least privilege. The web app only needs to enqueue messages.

### Why store generated values in Key Vault?

The application should not contain database, Storage, or Service Bus credentials
in source code or literal Terraform app settings.

### Are sensitive Terraform values absent from state?

No. `sensitive = true` hides normal display but does not remove the value from
state.

### Why use a user-assigned identity?

It has an independent lifecycle, can be selected explicitly for Key Vault
references, and can be granted Azure permissions before or separately from the
app.

### Why is Key Vault public access enabled?

The current Terraform runner is outside the VNet and must create secrets. A
firewall restricts public access to the runner's single IP.

### Why is the Storage account GRS?

GRS provides cross-region replication for data durability.

### What does the NAT Gateway do?

It gives VNet-routed App Service outbound internet traffic a predictable static
public IP.

### Does NAT Gateway make private endpoints work?

No. Private endpoints work through VNet routing and private DNS. NAT is for
outbound public destinations.

### Where are logs stored?

Platform diagnostics go to the shared Log Analytics workspace. App Service
diagnostics are also configured with the Storage account.

### Why no NSG?

The stated architecture intentionally excludes NSGs at this stage.

### What is the biggest current gap?

The notification Function infrastructure and Entra Easy Auth configuration are
not present in the Terraform folder.

## 14. Five-Minute Presentation Script

### Minute 1: Goal and Structure

> The goal is to deploy the KubeCart monolith on Azure PaaS with private backend
> access. Terraform is split into ten local modules. The root module connects
> them using inputs and outputs, and workspaces produce environment-specific
> names and state.

### Minute 2: Network

> The VNet has three subnets: a dedicated Application Gateway subnet, a
> delegated App Service VNet Integration subnet, and a private endpoint subnet.
> The network module also creates private DNS zones so Azure hostnames resolve
> to private endpoint IPs.

### Minute 3: Application Traffic

> Application Gateway is the only public application ingress. It uses WAF and a
> host-based HTTP listener. Its backend is the App Service default hostname,
> which resolves privately inside the VNet. Direct public access to App Service
> is disabled.

### Minute 4: Dependencies and Secrets

> App Service uses VNet Integration for outbound access to Key Vault, Cosmos DB,
> Storage, and Service Bus. Terraform stores generated connection strings in Key
> Vault. A user-assigned identity allows App Service to resolve those secrets.
> Service Bus uses a send-only SAS rule for least privilege.

### Minute 5: Operations and Boundaries

> Diagnostic settings send logs and metrics to one Log Analytics workspace.
> Workspaces separate environment state. The current gaps are the notification
> Function module, Entra Easy Auth, public DNS automation, HTTPS, and a remote
> backend. These should be described as next implementation steps rather than
> features already delivered.

## 15. Thirty-Second File Walkthrough

When asked to open the code during the review:

1. Open `versions.tf` to show version control.
2. Open `locals.tf` to show workspace-to-environment naming.
3. Open root `main.tf` to show module composition and dependencies.
4. Open `modules/network/main.tf` to explain the three subnets and private DNS.
5. Open `modules/app_service/main.tf` to explain private inbound, integrated
   outbound, managed identity, and Key Vault references.
6. Open `modules/application_gateway/main.tf` to show WAF, listener, probe, and
   routing rule.
7. Open `modules/key_vault/main.tf` to show secret flow and least privilege.
8. Open `outputs.tf` to show deployment results.

## 16. Final Memory Map

Remember these seven points:

1. **Workspaces** provide separate state and environment names.
2. **Modules** divide the architecture by responsibility.
3. **References** create the dependency graph.
4. **Application Gateway** is public ingress.
5. **Private Endpoint** is private inbound access.
6. **VNet Integration** is App Service outbound access.
7. **Key Vault plus Managed Identity** protects application secrets.

One final summary:

> Public traffic stops at Application Gateway. Application traffic enters App
> Service privately. App Service reaches dependencies privately. Private DNS
> connects service names to private IPs. Managed identity unlocks Key Vault
> references. Terraform state remembers everything, so it must be protected.
