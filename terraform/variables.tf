variable "project_name" {
  description = "Short project name used in Azure resource names."
  type        = string
  default     = "kubecart"
}

variable "location" {
  description = "Azure region for all regional resources."
  type        = string
  default     = "Central India"
}

variable "unique_suffix" {
  description = "A short lowercase suffix used for globally unique Azure names."
  type        = string
}

variable "domain_name" {
  description = "Host name accepted by the Application Gateway HTTP listener."
  type        = string
  default     = "www.aasikdevops.website"
}

variable "source_control_repo_url" {
  description = "Git repository used by App Service continuous deployment."
  type        = string
}

variable "source_control_branch" {
  description = "Git branch used by App Service continuous deployment."
  type        = string
  default     = "main"
}

