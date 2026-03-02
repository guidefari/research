# 19 — Best Practices

> **Exam objective:** Apply Terraform best practices for code quality, security, collaboration, and maintainability.

---

## Overview

This module consolidates the best practices from https://www.terraform-best-practices.com and HashiCorp's own guidelines. These aren't just theory — the exam tests whether you know *why* these practices exist.

---

## 1. Code Structure

### Standard File Layout

```
project/
├── main.tf          # resources and module calls
├── variables.tf     # all variable declarations
├── outputs.tf       # all output declarations
├── versions.tf      # terraform{} block, required_providers, backend
├── locals.tf        # local values (if substantial)
└── README.md        # what does this config do?
```

For large configs, split by resource domain:
```
├── networking.tf
├── compute.tf
├── database.tf
├── iam.tf
```

### Directory Structure for Multiple Environments

```
infra/
├── modules/              # Reusable, generic modules
│   ├── network/
│   ├── compute/
│   └── database/
└── environments/         # Per-environment root configs
    ├── dev/
    │   ├── main.tf
    │   ├── variables.tf
    │   └── terraform.tfvars
    ├── staging/
    └── prod/
```

> **Prefer separate directories over workspaces** for different production environments. Workspaces share the same config — one mistake in the workspace name and you're changing the wrong environment.

---

## 2. Naming Conventions

From https://www.terraform-best-practices.com/naming:

```hcl
# Use underscores — not hyphens — in resource names, variables, outputs
resource "aws_security_group" "web_server" { ... }  # Good
resource "aws_security_group" "web-server" { ... }  # Bad

# Don't repeat the resource type in the name
resource "aws_route_table" "public" { ... }         # Good
resource "aws_route_table" "public_route_table" { } # Bad (redundant)

# Single instance of a resource type → name it "this"
resource "aws_vpc" "this" { ... }

# Use singular nouns
resource "aws_subnet" "public" { ... }   # Good
resource "aws_subnet" "publics" { ... }  # Bad

# Output naming: {name}_{type}_{attribute}
output "instance_public_ip" { ... }
output "bucket_arn" { ... }
output "db_endpoint" { ... }

# Variables: use plural for list/map types
variable "subnet_ids" { type = list(string) }  # plural
variable "tags" { type = map(string) }         # plural
```

---

## 3. State Management

### Always Use Remote State

```hcl
# versions.tf
terraform {
  backend "s3" {
    bucket         = "myorg-terraform-state"
    key            = "prod/networking/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

| Practice | Why |
|---|---|
| Use remote state | Local state can't be shared; no locking |
| Enable encryption | State can contain passwords and keys |
| Enable state locking | Prevent concurrent applies corrupting state |
| Use meaningful state paths | `{env}/{component}/terraform.tfstate` |
| Never edit state manually | Use `terraform state mv`, `rm`, `import` |

### State Locking

DynamoDB (for S3 backend) provides locking:
```hcl
resource "aws_dynamodb_table" "terraform_lock" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }
}
```

---

## 4. Security Best Practices

### Never Hardcode Secrets

```hcl
# Bad — never do this
resource "aws_db_instance" "main" {
  password = "mypassword123"   # committed to git!
}

# Good — use a variable (supply via env var or secrets manager)
variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

resource "aws_db_instance" "main" {
  password = var.db_password
}
```

Supply secrets via:
```bash
# Environment variable (never logged)
export TF_VAR_db_password=$(aws secretsmanager get-secret-value --secret-id db-pass --query SecretString --output text)
terraform apply
```

### Use `sensitive = true`

```hcl
variable "api_key" {
  type      = string
  sensitive = true
}

output "connection_string" {
  value     = "postgresql://user:${var.db_password}@${aws_db_instance.main.endpoint}/db"
  sensitive = true
}
```

### Least-Privilege IAM

```hcl
# Give Terraform only the permissions it needs — not AdministratorAccess
data "aws_iam_policy_document" "terraform" {
  statement {
    actions   = ["ec2:*", "s3:*", "rds:*"]  # scope to what's needed
    resources = ["*"]
  }
}
```

---

## 5. Provider and Version Pinning

```hcl
terraform {
  required_version = ">= 1.5.0, < 2.0.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"   # allows 5.x, blocks 6.x
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

- Always commit `.terraform.lock.hcl`
- Use `~>` (pessimistic constraint) for providers to allow patches
- Run `terraform init -upgrade` periodically and review changelogs

---

## 6. Variable Best Practices

```hcl
# Good: clear description, explicit type, validation
variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

# Use nullable = false for required variables
variable "project_name" {
  description = "Project identifier, used in resource naming"
  type        = string
  nullable    = false
}
```

---

## 7. Formatting and Validation

Always run before committing:

```bash
# Format all .tf files
terraform fmt -recursive

# Validate configuration (no cloud calls)
terraform validate

# Check formatting in CI (returns non-zero if any file needs formatting)
terraform fmt -check -recursive
```

Add to your CI pipeline:
```yaml
- name: Terraform Format Check
  run: terraform fmt -check -recursive

- name: Terraform Validate
  run: terraform validate
```

---

## 8. Tagging Strategy

Tag every resource with consistent metadata:

```hcl
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    Team        = var.team
    ManagedBy   = "terraform"
    Repository  = "github.com/myorg/infra"
    CostCentre  = var.cost_centre
  }
}

# AWS provider supports default_tags — applies to all resources
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = local.common_tags
  }
}
```

---

## 9. Module Best Practices

```hcl
# modules/network/main.tf

# Good module characteristics:
# 1. Single responsibility — one module does one thing
# 2. All inputs via variables — no hardcoded values
# 3. All outputs declared — callers can get what they need
# 4. README.md with usage examples
# 5. versions.tf with required_providers

# Good: use "this" for the primary resource in a module
resource "aws_vpc" "this" {
  cidr_block = var.cidr_block
}

# Good: expose all useful attributes via outputs
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "vpc_arn" {
  description = "ARN of the VPC"
  value       = aws_vpc.this.arn
}
```

---

## 10. The `.gitignore`

```
# .gitignore for Terraform

# Local .terraform directories
**/.terraform/*

# .tfstate files
*.tfstate
*.tfstate.*

# Crash log files
crash.log
crash.*.log

# Sensitive variable files (may contain secrets)
*.tfvars
*.tfvars.json
!example.tfvars     # keep example files

# Override files (local-only changes)
override.tf
override.tf.json
*_override.tf
*_override.tf.json

# Generated plan files
*.tfplan

# CLI configuration files
.terraformrc
terraform.rc
```

---

## Quick Reference Checklist

```
Code Quality
[ ] terraform fmt -recursive passes
[ ] terraform validate passes
[ ] All variables have descriptions
[ ] All outputs have descriptions
[ ] No hardcoded secrets in config
[ ] .terraform.lock.hcl committed

Structure
[ ] versions.tf, variables.tf, outputs.tf separate files
[ ] README.md exists
[ ] Consistent naming (underscores, singular, no type repetition)
[ ] .gitignore in place

State
[ ] Remote backend configured
[ ] State encryption enabled
[ ] State locking enabled
[ ] State file NOT committed to git

CI/CD
[ ] fmt-check in pipeline
[ ] validate in pipeline
[ ] Plan saved with -out, apply uses saved plan
[ ] TF_IN_AUTOMATION=true set in CI
```

---

## Exam Tips

- `terraform fmt` uses 2-space indentation.
- Always commit `.terraform.lock.hcl` — never commit `.terraform/` or `*.tfstate`.
- `sensitive = true` on variables/outputs redacts from terminal but NOT from state.
- Use `depends_on` only when implicit dependencies don't capture the real dependency.
- Workspaces ≠ environments for production — prefer separate directories/state files.
- Tag everything — it's a HashiCorp and cloud best practice.

---

## Further Reading

| Resource | URL |
|---|---|
| Terraform Best Practices Book | https://www.terraform-best-practices.com |
| Code Structure | https://www.terraform-best-practices.com/code-structure |
| Naming Conventions | https://www.terraform-best-practices.com/naming |
| Security Best Practices | https://developer.hashicorp.com/terraform/tutorials/configuration-language/sensitive-variables |
| Style Guide | https://developer.hashicorp.com/terraform/language/style |
| Remote State | https://developer.hashicorp.com/terraform/language/settings/backends/s3 |

---

*Next: [20 — Destroy](./20-destroy.md)*
