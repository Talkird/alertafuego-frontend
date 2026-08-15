# S3 bucket names are globally unique across all of AWS, so a random
# suffix avoids collisions with other accounts using a similar name.
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${var.project_name}-${random_id.bucket_suffix.hex}"

  # Lets `terraform destroy` remove the bucket even if deployed build
  # artifacts are still in it. Fine for a project this size; drop this if
  # you'd rather be forced to empty the bucket manually first.
  force_destroy = true

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

# CloudFront (via the Origin Access Control below) is the only intended
# reader of this bucket - it stays fully private, with no public access
# and no static-website-hosting endpoint (that endpoint is HTTP-only and
# bypasses CloudFront's caching/HTTPS entirely).
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    sid       = "AllowCloudFrontOAC"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.frontend.arn}/*"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}
