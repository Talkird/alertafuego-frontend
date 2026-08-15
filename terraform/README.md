# Infrastructure

S3 (private, static build output) + CloudFront (CDN, HTTPS, SPA fallback routing) for the frontend. No custom domain is configured — the site is served from CloudFront's default `*.cloudfront.net` domain. To add one later: request an ACM certificate **in `us-east-1`** (CloudFront requirement regardless of where the bucket lives), add it plus `aliases` to the `viewer_certificate`/distribution block in `cloudfront.tf`, and point your DNS at the distribution.

## First-time setup

Requires AWS credentials configured locally (e.g. `aws configure`, or `AWS_PROFILE`/`AWS_ACCESS_KEY_ID` env vars) — this repo has none set up for you. Do these once, in order:

```sh
# 1. Create the S3 bucket that holds this config's remote state.
cd terraform/bootstrap
terraform init
terraform apply

# 2. Now the main config can use that bucket as its backend.
cd ..
terraform init
terraform plan   # review what it would create
terraform apply
```

That second `apply` also creates the IAM role GitHub Actions uses to deploy (see `github-oidc.tf`) — copy its output and add it as a repo secret:

```sh
terraform output -raw github_actions_role_arn
```

GitHub repo → Settings → Secrets and variables → Actions → New repository secret → name it `AWS_ROLE_ARN`, paste the value.

After that, `.github/workflows/terraform-deploy.yml` takes over: it posts a plan as a PR comment on pull requests touching `terraform/**`, and applies automatically on merge to `main`. You won't need to run `terraform apply` locally again unless you're iterating on infra changes before opening a PR. If you want a manual approval gate even after merge, add required reviewers to the `production` environment under repo Settings → Environments — the `apply` job already targets that environment, so this is a one-click addition, no workflow changes needed.

## Deploying the site

Terraform only manages the infrastructure (bucket, CloudFront distribution) — it does not build or upload the app. That's a separate step, since build artifacts change on every deploy and re-running `terraform apply` for that would be slow and not idiomatic Terraform usage.

```sh
# From the project root
npm run generate   # nuxi generate — produces .output/public/

# Sync the static build to the bucket
aws s3 sync .output/public/ "s3://$(terraform -chdir=terraform output -raw s3_bucket_name)" --delete

# Bust CloudFront's cache so the new files are actually served
aws cloudfront create-invalidation \
  --distribution-id "$(terraform -chdir=terraform output -raw cloudfront_distribution_id)" \
  --paths '/*'
```

The site's URL is `terraform -chdir=terraform output -raw cloudfront_domain_name`.

## Notes

- `force_destroy = true` on the bucket means `terraform destroy` will delete deployed files along with the bucket, not just an empty bucket.
- `cloudfront_price_class` defaults to `PriceClass_100` (US/Canada/Europe edge locations only — no South America). See the comment in `variables.tf` for the cost/latency tradeoff if most users are in Argentina.
- This app is auth-gated (Supabase) with no public routes today, so most of what SSR/prerendering would normally buy you (SEO, pre-fetched content) doesn't apply — a static build is the right fit, not a compromise.
