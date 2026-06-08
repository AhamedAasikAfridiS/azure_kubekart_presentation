variable "name" {
  type = string
}

variable "plan_name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "app_identity_id" {
  type = string
}

variable "app_identity_client_id" {
  type = string
}

variable "vnet_integration_subnet_id" {
  type = string
}

variable "private_endpoint_subnet_id" {
  type = string
}

variable "private_dns_zone_id" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "diagnostic_storage_account_id" {
  type = string
}

variable "cosmos_secret_id" {
  type = string
}

variable "storage_secret_id" {
  type = string
}

variable "service_bus_secret_id" {
  type = string
}

variable "service_bus_queue_name" {
  type = string
}

variable "source_control_repo_url" {
  type = string
}

variable "source_control_branch" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "azurerm_service_plan" "this" {
  name                = var.plan_name
  resource_group_name = var.resource_group_name
  location            = var.location
  os_type             = "Linux"
  sku_name            = "P1v3"
  tags                = var.tags
}

resource "azurerm_linux_web_app" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  service_plan_id     = azurerm_service_plan.this.id

  public_network_access_enabled                  = false
  https_only                                     = false
  ftp_publish_basic_authentication_enabled       = true
  webdeploy_publish_basic_authentication_enabled = true
  virtual_network_subnet_id                      = var.vnet_integration_subnet_id
  key_vault_reference_identity_id                = var.app_identity_id

  identity {
    type         = "UserAssigned"
    identity_ids = [var.app_identity_id]
  }

  site_config {
    always_on                         = true
    ftps_state                        = "FtpsOnly"
    health_check_path                 = "/health"
    health_check_eviction_time_in_min = 5
    vnet_route_all_enabled            = true

    application_stack {
      node_version = "20-lts"
    }
  }

  app_settings = {
    NODE_ENV                        = "production"
    SCM_DO_BUILD_DURING_DEPLOYMENT  = "true"
    WEBSITE_VNET_ROUTE_ALL          = "1"
    AZURE_CLIENT_ID                 = var.app_identity_client_id
    MONGO_URI                       = "@Microsoft.KeyVault(SecretUri=${var.cosmos_secret_id})"
    AZURE_STORAGE_CONNECTION_STRING = "@Microsoft.KeyVault(SecretUri=${var.storage_secret_id})"
    SERVICE_BUS_CONNECTION_STRING   = "@Microsoft.KeyVault(SecretUri=${var.service_bus_secret_id})"
    SERVICE_BUS_NOTIFICATION_QUEUE  = var.service_bus_queue_name
  }

  tags = var.tags
}

resource "azurerm_app_service_source_control" "this" {
  app_id                 = azurerm_linux_web_app.this.id
  repo_url               = var.source_control_repo_url
  branch                 = var.source_control_branch
  use_manual_integration = false
}

resource "azurerm_private_endpoint" "this" {
  name                = "pe-${var.name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "psc-${var.name}"
    private_connection_resource_id = azurerm_linux_web_app.this.id
    subresource_names              = ["sites"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "app-service-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }
}

resource "azurerm_monitor_diagnostic_setting" "this" {
  name                       = "diag-app-service"
  target_resource_id         = azurerm_linux_web_app.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id
  storage_account_id         = var.diagnostic_storage_account_id

  enabled_log {
    category = "AppServiceHTTPLogs"
  }

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  enabled_log {
    category = "AppServiceAppLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

output "id" {
  value = azurerm_linux_web_app.this.id
}

output "name" {
  value = azurerm_linux_web_app.this.name
}

output "default_hostname" {
  value = azurerm_linux_web_app.this.default_hostname
}
