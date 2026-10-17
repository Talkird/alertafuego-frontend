# Custom domain: alertafuego.com.ar, registered at NIC Argentina (Route 53 can't
# register .ar domains) with its DNS delegated to the Route 53 zone below.
#
# Two phases, because NIC.ar must point at this zone before the certificate can
# validate:
#   1. domain_delegated = false: creates the zone (output `name_servers`) and
#      requests the certificate. The site keeps its cloudfront.net URL.
#   2. Delegate the domain at NIC.ar to those name servers, wait until
#      `dig NS alertafuego.com.ar` returns them, then set domain_delegated = true:
#      waits for the certificate and serves the site on the domain.

locals {
  domain_names = [var.domain_name, "www.${var.domain_name}"]
}

resource "aws_route53_zone" "site" {
  name = var.domain_name

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }

  # The deploy role gets its Route 53 permissions in the same apply.
  depends_on = [aws_iam_role_policy.github_actions]
}

# CloudFront only accepts certificates from us-east-1, wherever the bucket is.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_acm_certificate" "site" {
  provider                  = aws.us_east_1
  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [aws_iam_role_policy.github_actions]
}

# The records ACM checks to issue (and later renew) the certificate.
resource "aws_route53_record" "certificate_validation" {
  for_each = {
    for option in aws_acm_certificate.site.domain_validation_options : option.domain_name => option
  }

  zone_id = aws_route53_zone.site.zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  records = [each.value.resource_record_value]
  ttl     = 300
}

# Blocks until ACM sees the records above, which needs the NIC.ar delegation.
resource "aws_acm_certificate_validation" "site" {
  count                   = var.domain_delegated ? 1 : 0
  provider                = aws.us_east_1
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for record in aws_route53_record.certificate_validation : record.fqdn]
}

# The domain and www both point at the distribution (A for IPv4, AAAA for IPv6).
resource "aws_route53_record" "site" {
  for_each = var.domain_delegated ? {
    for pair in setproduct(local.domain_names, ["A", "AAAA"]) : "${pair[0]} ${pair[1]}" => pair
  } : {}

  zone_id = aws_route53_zone.site.zone_id
  name    = each.value[0]
  type    = each.value[1]

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
