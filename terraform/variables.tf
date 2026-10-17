variable "aws_region" {
  description = "AWS region for the S3 bucket. CloudFront itself is a global service; this only affects where the bucket lives."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Prefix used for resource names and tags."
  type        = string
  default     = "alertafuego-frontend"
}

variable "environment" {
  description = "Deployment environment tag (e.g. production, staging)."
  type        = string
  default     = "production"
}

variable "cloudfront_price_class" {
  description = <<-EOT
    Which CloudFront edge locations to use. PriceClass_100 (US/Canada/Europe)
    is the cheapest option but does NOT include South America edge
    locations - Argentine users will still be faster than with no CDN, just
    not served from a local edge. PriceClass_All adds South America (and
    everywhere else) at a higher cost. See
    https://aws.amazon.com/cloudfront/pricing/ for the price difference.
  EOT
  type        = string
  default     = "PriceClass_100"
}

variable "domain_name" {
  description = "The site's domain, registered at NIC Argentina with its DNS delegated to Route 53 (see domain.tf)."
  type        = string
  default     = "alertafuego.com.ar"
}

variable "domain_delegated" {
  description = "Set to true once NIC.ar delegates domain_name to the Route 53 name servers (output name_servers): validates the certificate and serves the site on the domain. See domain.tf."
  type        = bool
  default     = false
}
