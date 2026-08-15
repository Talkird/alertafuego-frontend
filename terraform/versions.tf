terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Remote state, required for GitHub Actions to run Terraform (runners are
  # ephemeral - local state would mean every run starts from a blank
  # slate). Bucket names can't use variables in a backend block, so this
  # must match `bootstrap/main.tf`'s `project_name`-tfstate naming exactly.
  # Create the bucket with `terraform/bootstrap` first - see its comments.
  backend "s3" {
    bucket       = "alertafuego-frontend-tfstate"
    key          = "alertafuego-frontend/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}

provider "aws" {
  region = var.aws_region
}
