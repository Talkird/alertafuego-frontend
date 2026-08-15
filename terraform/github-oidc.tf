# Lets GitHub Actions assume an AWS role via short-lived OIDC tokens -
# no long-lived AWS access keys stored as GitHub secrets.
#
# Chicken-and-egg note: this role has to exist before the GitHub Actions
# workflow can use it, so the very first `terraform apply` (creating this
# role, among everything else) has to be run locally, with your own AWS
# credentials - same as the rest of this config. After that, put the
# `github_actions_role_arn` output into a repo secret named AWS_ROLE_ARN,
# and CI can take over from there.

variable "github_repository" {
  description = "GitHub \"owner/repo\" allowed to assume the deploy role."
  type        = string
  default     = "Talkird/alertafuego-frontend"
}

# AWS allows only one OIDC provider per issuer URL per account. This
# account already has one registered for GitHub Actions (from another
# project, most likely) - reuse it instead of trying to create a second
# one, which AWS rejects outright.
data "aws_iam_openid_connect_provider" "github_actions" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_iam_policy_document" "github_actions_trust" {
  statement {
    effect = "Allow"
    # aws-actions/configure-aws-credentials tags the assumed session by
    # default (only skipped if a workflow sets role-skip-session-tagging:
    # true, which ours don't) - without sts:TagSession allowed here too,
    # AWS rejects the whole combined call with "Not authorized to perform
    # sts:AssumeRoleWithWebIdentity", even though that action alone is
    # allowed.
    actions = ["sts:AssumeRoleWithWebIdentity", "sts:TagSession"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github_actions.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # GitHub's OIDC "sub" claim can't scope pull_request tokens down to
    # "PRs targeting main" specifically (only push events support a ref
    # condition) - it's repo-wide for any PR. The workflow's own trigger
    # filters (branches/paths) narrow *when* this runs; this narrows *who*
    # can assume the role to this repo.
    #
    # The wildcards after owner/repo aren't optional: GitHub's actual sub
    # claim is "repo:{owner}@{ownerId}/{repo}@{repoId}:...", not the plain
    # "repo:{owner}/{repo}:..." most examples show. Confirmed via CloudTrail
    # after an exact-match version of this condition rejected every real
    # token with AccessDenied. Same reason the backend role's condition
    # uses wildcards too.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${split("/", var.github_repository)[0]}*/${split("/", var.github_repository)[1]}*:pull_request",
        "repo:${split("/", var.github_repository)[0]}*/${split("/", var.github_repository)[1]}*:ref:refs/heads/main",
      ]
    }
  }
}

resource "aws_iam_role" "github_actions" {
  name               = "${var.project_name}-github-actions"
  assume_role_policy = data.aws_iam_policy_document.github_actions_trust.json

  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

data "aws_iam_policy_document" "github_actions_permissions" {
  statement {
    sid    = "TerraformState"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:ListBucket",
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-tfstate",
      "arn:aws:s3:::${var.project_name}-tfstate/*",
    ]
  }

  statement {
    sid    = "ManageFrontendBucket"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject",
      "s3:GetBucket*",
      "s3:PutBucket*",
    ]
    resources = [
      "arn:aws:s3:::${var.project_name}-*",
      "arn:aws:s3:::${var.project_name}-*/*",
    ]
  }

  statement {
    # Most CloudFront write/create actions don't support resource-level
    # ARNs - AWS only allows "*" for these. Read actions are scoped to
    # this account by IAM's implicit resource matching regardless.
    sid    = "ManageCloudFront"
    effect = "Allow"
    actions = [
      "cloudfront:GetDistribution",
      "cloudfront:CreateDistribution",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:TagResource",
      "cloudfront:ListTagsForResource",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:CreateOriginAccessControl",
      "cloudfront:UpdateOriginAccessControl",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:CreateInvalidation",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "github_actions" {
  name   = "${var.project_name}-github-actions"
  role   = aws_iam_role.github_actions.id
  policy = data.aws_iam_policy_document.github_actions_permissions.json
}

output "github_actions_role_arn" {
  description = "Add this as the AWS_ROLE_ARN secret in the GitHub repo's Actions settings."
  value       = aws_iam_role.github_actions.arn
}
