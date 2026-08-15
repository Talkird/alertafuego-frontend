# One-time bootstrap: creates the S3 bucket that holds the *main*
# Terraform config's remote state. This has to live outside `terraform/`
# and use its own local state, since the main config's S3 backend can't
# point at a bucket that doesn't exist yet.
#
# Run this once, manually, before the main config's `terraform init`:
#
#   cd terraform/bootstrap
#   terraform init
#   terraform apply
#
# You won't need to touch it again after that.

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "project_name" {
  type    = string
  default = "alertafuego-frontend"
}

resource "aws_s3_bucket" "tfstate" {
  bucket = "${var.project_name}-tfstate"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_name" {
  value = aws_s3_bucket.tfstate.bucket
}
