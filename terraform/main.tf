module "resource_group" {
  source = "./modules/resource_group"

  name     = "rg-${local.name_prefix}"
  location = var.location
  tags     = local.common_tags
}

module "network" {
  source = "./modules/network"

  name_prefix         = local.name_prefix
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = local.common_tags
}

module "identity" {
  source = "./modules/identity"

  name                = "id-${local.name_prefix}-web"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"

  name                = "log-${local.name_prefix}"
  resource_group_name = module.resource_group.name
  location            = module.resource_group.location
  tags                = local.common_tags
}

module "storage" {
  source = "./modules/storage"

  name                       = local.storage_name
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  private_endpoint_subnet_id = module.network.private_endpoint_subnet_id
  private_dns_zone_id        = module.network.blob_private_dns_zone_id
  log_analytics_workspace_id = module.monitoring.id
  app_identity_principal_id  = module.identity.principal_id
  tags                       = local.common_tags
}

module "cosmos_db" {
  source = "./modules/cosmos_db"

  account_name               = local.cosmos_name
  database_name              = "kubecart"
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  private_endpoint_subnet_id = module.network.private_endpoint_subnet_id
  private_dns_zone_id        = module.network.cosmos_private_dns_zone_id
  log_analytics_workspace_id = module.monitoring.id
  tags                       = local.common_tags
}

module "service_bus" {
  source = "./modules/service_bus"

  namespace_name             = local.service_bus_name
  queue_name                 = "notifications"
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  private_endpoint_subnet_id = module.network.private_endpoint_subnet_id
  private_dns_zone_id        = module.network.service_bus_private_dns_zone_id
  log_analytics_workspace_id = module.monitoring.id
  tags                       = local.common_tags
}

module "key_vault" {
  source = "./modules/key_vault"

  name                          = local.key_vault_name
  resource_group_name           = module.resource_group.name
  location                      = module.resource_group.location
  app_identity_principal_id     = module.identity.principal_id
  private_endpoint_subnet_id    = module.network.private_endpoint_subnet_id
  private_dns_zone_id           = module.network.key_vault_private_dns_zone_id
  log_analytics_workspace_id    = module.monitoring.id
  cosmos_connection_string      = module.cosmos_db.connection_string
  storage_connection_string     = module.storage.connection_string
  service_bus_connection_string = module.service_bus.connection_string
  terraform_runner_ip_address   = var.terraform_runner_ip_address
  tags                          = local.common_tags
}

module "app_service" {
  source = "./modules/app_service"

  name                          = local.app_service_name
  plan_name                     = "asp-${local.name_prefix}"
  resource_group_name           = module.resource_group.name
  location                      = module.resource_group.location
  app_identity_id               = module.identity.id
  app_identity_client_id        = module.identity.client_id
  vnet_integration_subnet_id    = module.network.vnet_integration_subnet_id
  private_endpoint_subnet_id    = module.network.private_endpoint_subnet_id
  private_dns_zone_id           = module.network.app_service_private_dns_zone_id
  log_analytics_workspace_id    = module.monitoring.id
  diagnostic_storage_account_id = module.storage.id
  cosmos_secret_id              = module.key_vault.cosmos_secret_id
  storage_secret_id             = module.key_vault.storage_secret_id
  service_bus_secret_id         = module.key_vault.service_bus_secret_id
  service_bus_queue_name        = module.service_bus.queue_name
  source_control_repo_url       = var.source_control_repo_url
  source_control_branch         = var.source_control_branch
  tags                          = local.common_tags
}

module "application_gateway" {
  source = "./modules/application_gateway"

  name                       = "agw-${local.name_prefix}"
  public_ip_name             = "pip-agw-${local.name_prefix}"
  waf_policy_name            = "waf-${local.name_prefix}"
  public_ip_domain_label     = lower("agw-${local.name_prefix}-${var.unique_suffix}")
  resource_group_name        = module.resource_group.name
  location                   = module.resource_group.location
  subnet_id                  = module.network.application_gateway_subnet_id
  backend_hostname           = module.app_service.default_hostname
  listener_hostname          = var.domain_name
  log_analytics_workspace_id = module.monitoring.id
  tags                       = local.common_tags
}
