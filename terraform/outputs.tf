output "terraform_workspace" {
  description = "Terraform workspace used for this deployment."
  value       = terraform.workspace
}

output "environment" {
  description = "Environment name derived from the Terraform workspace."
  value       = local.environment
}

output "resource_group_name" {
  value = module.resource_group.name
}

output "app_service_name" {
  value = module.app_service.name
}

output "app_service_default_hostname" {
  value = module.app_service.default_hostname
}

output "application_gateway_public_fqdn" {
  value = module.application_gateway.public_fqdn
}
