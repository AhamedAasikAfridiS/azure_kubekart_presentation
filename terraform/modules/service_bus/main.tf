variable "namespace_name" {
  type = string
}

variable "queue_name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
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

variable "tags" {
  type = map(string)
}

resource "azurerm_servicebus_namespace" "this" {
  name                          = var.namespace_name
  resource_group_name           = var.resource_group_name
  location                      = var.location
  sku                           = "Premium"
  capacity                      = 1
  premium_messaging_partitions  = 1
  minimum_tls_version           = "1.2"
  local_auth_enabled            = true
  public_network_access_enabled = false
  tags                          = var.tags
}

resource "azurerm_servicebus_queue" "this" {
  name         = var.queue_name
  namespace_id = azurerm_servicebus_namespace.this.id

  max_delivery_count = 10
}

resource "azurerm_servicebus_namespace_authorization_rule" "app_send" {
  name         = "kubecart-app-send"
  namespace_id = azurerm_servicebus_namespace.this.id

  listen = false
  send   = true
  manage = false
}

resource "azurerm_private_endpoint" "this" {
  name                = "pe-${var.namespace_name}"
  resource_group_name = var.resource_group_name
  location            = var.location
  subnet_id           = var.private_endpoint_subnet_id
  tags                = var.tags

  private_service_connection {
    name                           = "psc-${var.namespace_name}"
    private_connection_resource_id = azurerm_servicebus_namespace.this.id
    subresource_names              = ["namespace"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "service-bus-zone-group"
    private_dns_zone_ids = [var.private_dns_zone_id]
  }
}

resource "azurerm_monitor_diagnostic_setting" "this" {
  name                       = "diag-service-bus"
  target_resource_id         = azurerm_servicebus_namespace.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "OperationalLogs"
  }

  enabled_log {
    category = "VNetAndIPFilteringLogs"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

output "id" {
  value = azurerm_servicebus_namespace.this.id
}

output "queue_name" {
  value = azurerm_servicebus_queue.this.name
}

output "connection_string" {
  value     = azurerm_servicebus_namespace_authorization_rule.app_send.primary_connection_string
  sensitive = true
}

