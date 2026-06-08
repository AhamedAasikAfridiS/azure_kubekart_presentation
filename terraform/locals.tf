locals {
  # The default Terraform workspace is treated as the dev environment.
  environment = terraform.workspace == "default" ? "dev" : terraform.workspace

  name_prefix = "${var.project_name}-${local.environment}"

  app_service_name = "app-${local.name_prefix}-${var.unique_suffix}"
  cosmos_name      = "cosmos-${local.name_prefix}-${var.unique_suffix}"
  front_door_name  = "fd-${local.name_prefix}-${var.unique_suffix}"
  key_vault_name   = substr("kv-${local.name_prefix}-${var.unique_suffix}", 0, 24)
  service_bus_name = substr("sb-${local.name_prefix}-${var.unique_suffix}", 0, 50)
  storage_name     = substr(lower(replace("st${local.name_prefix}${var.unique_suffix}", "-", "")), 0, 24)

  common_tags = {
    Project     = var.project_name
    Environment = local.environment
    ManagedBy   = "Terraform"
  }
}

