# 17 — Divide Files

> **Exam objective:** Understand how to organise Terraform configuration across multiple files and directories.

---

## Terraform Reads All `.tf` Files in a Directory

Terraform loads **all `.tf` files** in the current working directory as a single configuration. The files can be split in any way — Terraform merges them before processing.

```
my-project/
├── main.tf        # resources
├── variables.tf   # input variable declarations
├── outputs.tf     # output declarations
├── versions.tf    # terraform{} and provider blocks
└── locals.tf      # local values (optional)
```

---

## The Standard File Layout

This is the convention used across the Terraform community and by terraform-best-practices.com:

```
project/
├── main.tf          # Core resources (or module calls)
├── variables.tf     # All variable declarations
├── outputs.tf       # All output declarations
├── versions.tf      # required_version, required_providers
├── locals.tf        # Local values (if many — otherwise inline in main.tf)
├── data.tf          # Data source blocks (if many)
├── terraform.tfvars # Variable values (default environment — don't commit secrets)
└── README.md        # Document what this config does
```

### `versions.tf`

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/main.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### `variables.tf`

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### `main.tf`

```hcl
# main.tf
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = local.common_tags
  }
}

resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${local.name_prefix}-vpc" }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet("10.0.0.0/16", 8, count.index)
  availability_zone = local.az_list[count.index]
  tags              = { Name = "${local.name_prefix}-public-${count.index}" }
}
```

### `locals.tf`

```hcl
# locals.tf
locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  })

  az_list = ["${var.aws_region}a", "${var.aws_region}b"]
}
```

### `outputs.tf`

```hcl
# outputs.tf
output "vpc_id" {
  description = "ID of the main VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}
```

---

## When to Split Further

For large codebases, add resource-type-specific files:

```
project/
├── versions.tf
├── variables.tf
├── outputs.tf
├── locals.tf
├── networking.tf       # VPCs, subnets, route tables, SGs
├── compute.tf          # EC2 instances, ASGs, launch templates
├── database.tf         # RDS, DynamoDB
├── iam.tf              # IAM roles, policies, instance profiles
├── monitoring.tf       # CloudWatch, alarms, dashboards
└── terraform.tfvars
```

---

## Override Files

Terraform supports **override files** — special files that merge their content on top of the main configuration:

```
override.tf             # overrides for development use
terraform_override.tf   # another override file
```

```hcl
# override.tf — developer override (don't commit this)
resource "aws_instance" "web" {
  instance_type = "t3.nano"  # cheaper for local dev
}
```

Override files are useful for temporary local changes. Add them to `.gitignore`.

---

## Splitting by Environment

A common pattern for managing multiple environments:

### Approach 1: Separate directories

```
infra/
├── modules/        # Reusable modules
│   ├── network/
│   └── compute/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   │   ├── main.tf
│   │   └── terraform.tfvars
│   └── prod/
│       ├── main.tf
│       └── terraform.tfvars
```

### Approach 2: Workspaces + `.tfvars` files

```
infra/
├── main.tf
├── variables.tf
├── outputs.tf
├── dev.tfvars
├── staging.tfvars
└── prod.tfvars
```

```bash
# Development
terraform workspace select dev
terraform apply -var-file=dev.tfvars

# Production
terraform workspace select prod
terraform apply -var-file=prod.tfvars
```

> **Best Practice from terraform-best-practices.com:** Prefer **separate directories per environment** over workspaces for production infrastructure. Separate directories have separate state files and reduce the blast radius of mistakes.

---

## Hands-On: Refactor a Single-File Config

Take this monolithic `main.tf`:

```hcl
# Before — everything in one file
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}
variable "project" { default = "demo" }
variable "environment" { default = "dev" }
locals {
  prefix = "${var.project}-${var.environment}"
}
resource "local_file" "config" {
  filename = "${path.module}/${local.prefix}.conf"
  content  = "project=${var.project}\nenvironment=${var.environment}\n"
}
output "config_path" {
  value = local_file.config.filename
}
```

Split it into:

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}
```

```hcl
# variables.tf
variable "project" {
  description = "Project name"
  type        = string
  default     = "demo"
}
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}
```

```hcl
# locals.tf
locals {
  prefix = "${var.project}-${var.environment}"
}
```

```hcl
# main.tf
resource "local_file" "config" {
  filename = "${path.module}/${local.prefix}.conf"
  content  = "project=${var.project}\nenvironment=${var.environment}\n"
}
```

```hcl
# outputs.tf
output "config_path" {
  description = "Path to the generated config file"
  value       = local_file.config.filename
}
```

```bash
# Works exactly the same — Terraform reads all .tf files
terraform init
terraform apply
```

---

## Exam Tips

- Terraform reads **all `.tf` files** in the working directory — order doesn't matter.
- The standard split: `main.tf`, `variables.tf`, `outputs.tf`, `versions.tf`.
- Override files (`override.tf`) merge on top of regular configs — useful for local dev.
- Workspaces vs separate directories: the exam may ask about trade-offs.
- Keep `terraform.tfvars` out of version control if it contains secrets.
- `terraform fmt -recursive` formats all `.tf` files recursively.

---

## Further Reading

| Resource | URL |
|---|---|
| File and Directory Structure | https://developer.hashicorp.com/terraform/language/files |
| Code Structure Best Practices | https://www.terraform-best-practices.com/code-structure |
| Override Files | https://developer.hashicorp.com/terraform/language/files/override |
| Workspaces | https://developer.hashicorp.com/terraform/language/state/workspaces |

---

*Next: [18 — Modules](./18-modules.md)*
