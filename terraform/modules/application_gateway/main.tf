variable "name" {
  type = string
}

variable "public_ip_name" {
  type = string
}

variable "waf_policy_name" {
  type = string
}

variable "public_ip_domain_label" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "subnet_id" {
  type = string
}

variable "backend_hostname" {
  type = string
}

variable "listener_hostname" {
  type = string
}

variable "log_analytics_workspace_id" {
  type = string
}

variable "tags" {
  type = map(string)
}

resource "azurerm_public_ip" "this" {
  name                = var.public_ip_name
  resource_group_name = var.resource_group_name
  location            = var.location
  allocation_method   = "Static"
  sku                 = "Standard"
  domain_name_label   = var.public_ip_domain_label
  tags                = var.tags
}

resource "azurerm_web_application_firewall_policy" "this" {
  name                = var.waf_policy_name
  resource_group_name = var.resource_group_name
  location            = var.location
  tags                = var.tags

  policy_settings {
    enabled = true
    mode    = "Prevention"
  }

  managed_rules {
    managed_rule_set {
      type    = "OWASP"
      version = "3.2"
    }
  }
}

resource "azurerm_application_gateway" "this" {
  name                = var.name
  resource_group_name = var.resource_group_name
  location            = var.location
  firewall_policy_id  = azurerm_web_application_firewall_policy.this.id
  tags                = var.tags

  sku {
    name     = "WAF_v2"
    tier     = "WAF_v2"
    capacity = 1
  }

  gateway_ip_configuration {
    name      = "gateway-ip-configuration"
    subnet_id = var.subnet_id
  }

  frontend_port {
    name = "frontend-port-http"
    port = 80
  }

  frontend_ip_configuration {
    name                 = "frontend-public-ip"
    public_ip_address_id = azurerm_public_ip.this.id
  }

  backend_address_pool {
    name  = "app-service-backend-pool"
    fqdns = [var.backend_hostname]
  }

  probe {
    name                                      = "app-service-health-probe"
    protocol                                  = "Http"
    path                                      = "/health"
    interval                                  = 30
    timeout                                   = 30
    unhealthy_threshold                       = 3
    pick_host_name_from_backend_http_settings = true

    match {
      status_code = ["200-399"]
    }
  }

  backend_http_settings {
    name                                = "app-service-http-settings"
    cookie_based_affinity               = "Disabled"
    port                                = 80
    protocol                            = "Http"
    request_timeout                     = 30
    pick_host_name_from_backend_address = true
    probe_name                          = "app-service-health-probe"
  }

  http_listener {
    name                           = "domain-http-listener"
    frontend_ip_configuration_name = "frontend-public-ip"
    frontend_port_name             = "frontend-port-http"
    protocol                       = "Http"
    host_name                      = var.listener_hostname
  }

  request_routing_rule {
    name                       = "app-service-routing-rule"
    rule_type                  = "Basic"
    http_listener_name         = "domain-http-listener"
    backend_address_pool_name  = "app-service-backend-pool"
    backend_http_settings_name = "app-service-http-settings"
    priority                   = 100
  }
}

resource "azurerm_monitor_diagnostic_setting" "this" {
  name                       = "diag-application-gateway"
  target_resource_id         = azurerm_application_gateway.this.id
  log_analytics_workspace_id = var.log_analytics_workspace_id

  enabled_log {
    category = "ApplicationGatewayAccessLog"
  }

  enabled_log {
    category = "ApplicationGatewayPerformanceLog"
  }

  enabled_log {
    category = "ApplicationGatewayFirewallLog"
  }

  enabled_metric {
    category = "AllMetrics"
  }
}

output "id" {
  value = azurerm_application_gateway.this.id
}

output "public_ip_address" {
  value = azurerm_public_ip.this.ip_address
}

output "public_fqdn" {
  value = azurerm_public_ip.this.fqdn
}

