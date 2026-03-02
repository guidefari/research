# 12 — Change Automation

> **Exam objective:** Understand how Terraform automates infrastructure changes and integrates into CI/CD pipelines.

---

## What Is Change Automation?

Change automation is Terraform's ability to:
1. **Detect** what needs to change (plan)
2. **Validate** the change (review, policy checks)
3. **Apply** the change consistently and safely
4. **Record** the change (state, audit logs)

All without manual steps or console clicking.

---

## The Problem With Manual Changes

| Manual (ClickOps) | Terraform (Automated) |
|---|---|
| No audit trail | Full git history |
| Error-prone, inconsistent | Reproducible |
| Can't be reviewed before apply | Plan reviewed by humans and machines |
| Slow | Minutes |
| Hard to roll back | Revert config commit + re-apply |
| "Works in dev, broken in prod" | Same config, different variable values |

---

## Terraform's Change Workflow

```
Dev writes config change
         │
         ▼
  git commit & push
         │
         ▼
  CI: terraform plan
    ├── Success: post plan output for review
    └── Failure: block merge
         │
         ▼
  Human reviews plan (PR review)
         │
         ▼
  PR approved & merged
         │
         ▼
  CD: terraform apply (from saved plan)
         │
         ▼
  State updated, infra changed
         │
         ▼
  Notifications / post-apply checks
```

---

## CI/CD Integration Patterns

### Pattern 1: GitHub Actions

```yaml
# .github/workflows/terraform.yml
name: Terraform

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  plan:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Terraform Init
        run: terraform init
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Terraform Validate
        run: terraform validate

      - name: Terraform Plan
        run: terraform plan -out=plan.tfplan -no-color
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Post Plan to PR
        uses: actions/github-script@v7
        with:
          script: |
            // Post plan output as PR comment
            // (simplified — real implementations parse plan output)

  apply:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: terraform init
      - run: terraform apply -auto-approve
        env:
          TF_IN_AUTOMATION: true
```

### Pattern 2: GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - validate
  - plan
  - apply

.terraform:
  image: hashicorp/terraform:1.7.0
  before_script:
    - terraform init

validate:
  extends: .terraform
  stage: validate
  script:
    - terraform validate
    - terraform fmt -check -recursive

plan:
  extends: .terraform
  stage: plan
  script:
    - terraform plan -out=plan.tfplan
  artifacts:
    paths:
      - plan.tfplan
    expire_in: 1 hour

apply:
  extends: .terraform
  stage: apply
  script:
    - terraform apply plan.tfplan
  when: manual
  only:
    - main
```

> **Best Practice:** Require `when: manual` (or equivalent) for apply — a human should explicitly trigger infrastructure changes, not just code merges.

---

## Key Automation Flags

| Flag | Use Case |
|---|---|
| `-auto-approve` | Skip interactive confirmation (CI/CD) |
| `-no-color` | Remove ANSI color codes (CI log readability) |
| `-input=false` | Fail if any values require interactive input |
| `TF_IN_AUTOMATION=true` | Suppress "Did you know?" messages in output |
| `TF_LOG=INFO` | Log level for debugging pipelines |

```bash
# Canonical CI pipeline command
TF_IN_AUTOMATION=true terraform apply \
  -auto-approve \
  -no-color \
  -input=false \
  plan.tfplan
```

---

## Drift Detection

Drift is when the real-world infra diverges from your Terraform state (e.g., someone manually changed a security group in the console).

```bash
# Detect drift without making changes
terraform plan -refresh-only

# Example output when drift exists:
# ~ resource "aws_security_group" "web" {
#     ~ ingress = [
#         # extra rule added manually in console
#         + {
#             cidr_blocks = ["0.0.0.0/0"]
#             from_port   = 22
#             protocol    = "tcp"
#             to_port     = 22
#           },
#       ]
#   }
```

To fix drift: apply normally and Terraform will reconcile the state.

---

## Change Sets and Replace

### Forcing Replacement

Sometimes you need to force-recreate a resource (e.g., to pick up a new AMI on an EC2 instance):

```bash
# Replace a specific resource
terraform apply -replace=aws_instance.web

# Old flag (deprecated, use -replace instead)
# terraform taint aws_instance.web
```

### Untainting (No Longer Needed in Modern Terraform)

The old `terraform taint` / `terraform untaint` commands have been replaced by `-replace` in Terraform 1.2+:

```bash
# Modern approach
terraform apply -replace=aws_instance.web

# Old approach (still works but deprecated)
terraform taint aws_instance.web
terraform apply
```

---

## Import Existing Resources

If resources were created manually (outside Terraform), bring them under management:

```bash
# Import an existing S3 bucket into state
terraform import aws_s3_bucket.logs my-existing-bucket-name

# Import an EC2 instance
terraform import aws_instance.web i-1234567890abcdef0
```

After import, write the resource config in your `.tf` files to match the imported resource, then run `terraform plan` to verify no unintended changes.

> **Terraform 1.5+:** Use the new `import` block in config for declarative imports:

```hcl
import {
  to = aws_s3_bucket.logs
  id = "my-existing-bucket-name"
}

resource "aws_s3_bucket" "logs" {
  bucket = "my-existing-bucket-name"
}
```

---

## Hands-On: Simulate a CI Pipeline Locally

```bash
# Simulate what CI does
export TF_IN_AUTOMATION=true
export TF_INPUT=0

# Step 1: Validate
terraform validate

# Step 2: Plan and save
terraform plan -out=ci.tfplan -no-color

# Step 3: Apply saved plan
terraform apply -auto-approve -no-color ci.tfplan

# Step 4: Detect drift
terraform plan -refresh-only -no-color
```

---

## Exam Tips

- In CI, always save the plan with `-out` and apply the saved plan — this ensures consistency.
- `TF_IN_AUTOMATION=true` is best practice for CI environments.
- `terraform taint` is **deprecated** — use `terraform apply -replace=<resource>`.
- `-replace` forces destruction and recreation of a specific resource.
- Drift detection uses `terraform plan -refresh-only` — it proposes state updates, not infra changes.
- `terraform import` brings existing resources into Terraform management.

---

## Further Reading

| Resource | URL |
|---|---|
| Automate Terraform | https://developer.hashicorp.com/terraform/tutorials/automation/automate-terraform |
| CI/CD with GitHub Actions | https://developer.hashicorp.com/terraform/tutorials/automation/github-actions |
| Drift Detection | https://developer.hashicorp.com/terraform/tutorials/state/resource-drift |
| `terraform import` | https://developer.hashicorp.com/terraform/cli/commands/import |
| Import block (1.5+) | https://developer.hashicorp.com/terraform/language/import |

---

*Next: [13 — Apply Update](./13-apply-update.md)*
