variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name (used for resource naming)"
  type        = string
  default     = "creator-card"
}

variable "lambda_zip" {
  description = "Path to the Lambda deployment zip"
  type        = string
  default     = "../api.zip"
}

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}
