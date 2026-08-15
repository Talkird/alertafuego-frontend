output "s3_bucket_name" {
  description = "Upload the built site here, e.g. `aws s3 sync .output/public/ s3://<this>`."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "Needed to invalidate the cache after each deploy, e.g. `aws cloudfront create-invalidation --distribution-id <this> --paths '/*'`."
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "The site's URL (until/unless you add a custom domain)."
  value       = aws_cloudfront_distribution.frontend.domain_name
}
