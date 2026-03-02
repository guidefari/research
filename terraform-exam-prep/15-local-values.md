# 15 — Local Values

> **Exam objective:** Understand local values (`locals`), when to use them, and how they differ from variables.

---

## What Are Local Values?

Local values (declared with the `locals` block) are **named expressions** within a module. Think of them as constants or computed values you give a name to, so you can reference them multiple times without repeating the expression.

```hcl
locals {
  # A simple computed value
  app_name = "${var.project}-${var.environment}"

  # A reusable map of tags
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

---

## Variables vs. Locals vs. Outputs

| | Variables (`variable`) | Locals (`locals`) | Outputs (`output`) |
|---|---|---|---|
| **Direction** | Input (from outside) | Internal (within module) | Output (to caller) |
| **Who sets it** | Caller (user, CI, tfvars) | Author (in .tf files) | Terraform (computed) |
| **Mutable?** | No — set at plan time | No — computed expressions | No |
| **Reference** | `var.name` | `local.name` | N/A (referenced by caller) |

---

## Declaring Locals

```hcl
# main.tf or a dedicated locals.tf

locals {
  # String interpolation
  name_prefix = "${var.project}-${var.environment}"

  # Computed from a data source or variable
  region_short = substr(var.aws_region, 0, 2)  # "us" from "us-east-1"

  # Common tags — defined once, used everywhere
  common_tags = merge(
    var.extra_tags,
    {
      Project     = var.project
      Environment = var.environment
      Region      = var.aws_region
      ManagedBy   = "terraform"
    }
  )

  # Conditional value
  instance_type = var.environment == "prod" ? "t3.medium" : "t3.micro"

  # Derived list
  az_list = ["${var.aws_region}a", "${var.aws_region}b", "${var.aws_region}c"]
}
```

---

## Referencing Locals

Use `local.name` (singular) to reference a local value:

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = local.instance_type  # uses local.instance_type

  tags = local.common_tags  # applies the whole tags map
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.name_prefix}-logs"  # uses name_prefix

  tags = local.common_tags  # same tags on every resource
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-db"

  tags = merge(local.common_tags, {
    # Additional tags specific to this resource
    Backup = "true"
  })
}
```

---

## When to Use Locals

### Good Use Cases

**1. Avoid repetition (DRY principle)**
```hcl
locals {
  common_tags = {
    Project   = var.project
    ManagedBy = "terraform"
  }
}
# Now use local.common_tags on every resource instead of repeating the map
```

**2. Simplify complex expressions**
```hcl
locals {
  # Complex expression — name it for readability
  vpc_cidr_blocks = [
    for subnet in var.subnets : subnet.cidr_block
    if subnet.public == true
  ]
}
```

**3. Computed name patterns**
```hcl
locals {
  bucket_name = lower(replace("${var.project}-${var.environment}-${var.region}", "_", "-"))
}
```

**4. Centralise conditional logic**
```hcl
locals {
  is_prod           = var.environment == "prod"
  enable_monitoring = local.is_prod
  instance_type     = local.is_prod ? "t3.large" : "t3.micro"
  min_capacity      = local.is_prod ? 3 : 1
}
```

### When NOT to Use Locals

- Don't use locals for values that should come **from outside** the module — use variables instead.
- Don't use locals for values that should be **consumed outside** the module — use outputs instead.
- Avoid deeply-nested locals chains that are hard to follow.

---

## Hands-On

```hcl
# locals-demo/main.tf
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "myapp"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Must be dev, staging, or prod."
  }
}

locals {
  # Computed name prefix
  name_prefix = "${var.project}-${var.environment}"

  # Conditional values
  is_prod    = var.environment == "prod"
  file_count = local.is_prod ? 3 : 1

  # Tag map — defined once
  tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    IsProduction = tostring(local.is_prod)
  }

  # Derived list of file names
  file_names = [for i in range(local.file_count) : "${local.name_prefix}-replica-${i}.conf"]
}

resource "local_file" "config" {
  for_each = toset(local.file_names)
  filename = "${path.module}/${each.key}"
  content  = "# Config for ${each.key}\n${jsonencode(local.tags)}\n"
}
```

```bash
terraform init
terraform apply -var="project=demo" -var="environment=dev"
# Creates 1 file: demo-dev-replica-0.conf

terraform apply -var="project=demo" -var="environment=prod"
# Creates 3 files: demo-prod-replica-{0,1,2}.conf
```

---

## Locals in Complex Scenarios

### For Expressions in Locals

```hcl
variable "instances" {
  type = map(object({
    instance_type = string
    disk_size_gb  = number
  }))
  default = {
    web = { instance_type = "t3.micro", disk_size_gb = 20 }
    api = { instance_type = "t3.small", disk_size_gb = 30 }
  }
}

locals {
  # Flatten instances to a list of names
  instance_names = keys(var.instances)

  # Filter instances by type
  large_instances = {
    for name, config in var.instances :
    name => config
    if config.disk_size_gb >= 30
  }
}
```

---

## Exam Tips

- `locals` is the block name (plural); `local.name` is how you reference (singular).
- Locals are evaluated at plan time — they're not dynamic.
- Locals can reference other locals, but **circular references are not allowed**.
- Use locals to keep configurations DRY and improve readability.
- Locals are **module-scoped** — they're not accessible from outside the module.
- Unlike variables, locals **cannot be overridden** from outside — they're always computed from the configuration.

---

## Further Reading

| Resource | URL |
|---|---|
| Local Values | https://developer.hashicorp.com/terraform/language/values/locals |
| Expressions | https://developer.hashicorp.com/terraform/language/expressions |
| For Expressions | https://developer.hashicorp.com/terraform/language/expressions/for |
| Best Practices | https://www.terraform-best-practices.com |

---

*Next: [16 — Outputs](./16-outputs.md)*
