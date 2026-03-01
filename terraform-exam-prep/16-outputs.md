# 16 — Outputs

> **Exam objective:** Define and use output values — for the CLI, for other modules, and for automation.

---

## What Are Outputs?

Output values are **return values** from a Terraform module. They serve three purposes:

1. **Display** useful information to the user after `terraform apply`
2. **Pass values** from a child module to a parent module
3. **Expose values** to external systems via `terraform output`

```hcl
output "instance_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.web.public_ip
}
```

After `terraform apply`:
```
Outputs:

instance_ip = "54.235.12.100"
```

---

## Declaring Outputs

```hcl
# outputs.tf

output "vpc_id" {
  description = "ID of the created VPC"
  value       = aws_vpc.main.id
}

output "subnet_ids" {
  description = "List of subnet IDs"
  value       = aws_subnet.public[*].id
}

output "db_endpoint" {
  description = "Database connection endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true  # value redacted in CLI output
}

output "instance_arn" {
  description = "ARN of the web server"
  value       = aws_instance.web.arn
}
```

> **Best Practice:** Always include a `description`. Name outputs as `{name}_{type}_{attribute}` — e.g., `instance_public_ip`, `bucket_arn`, `db_endpoint`.

---

## Sensitive Outputs

```hcl
output "database_password" {
  description = "Database master password"
  value       = random_password.db.result
  sensitive   = true
}
```

In CLI output:
```
Outputs:

database_password = <sensitive>
```

To read a sensitive output:
```bash
# Outputs are still accessible programmatically
terraform output -json database_password
# Shows the value in JSON
```

> **Warning:** Sensitive outputs are still stored in state. Use encrypted remote state in production.

---

## Reading Outputs from the CLI

```bash
# Show all outputs
terraform output

# Show a specific output
terraform output instance_ip

# Machine-readable JSON (great for scripts)
terraform output -json

# Raw value (no quotes around strings)
terraform output -raw instance_ip
```

```bash
# Use in a script
INSTANCE_IP=$(terraform output -raw instance_ip)
ssh ubuntu@$INSTANCE_IP
```

---

## Outputs in Modules

Outputs are the **only** way to pass values from a child module to a parent module.

### Child Module

```hcl
# modules/network/outputs.tf
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.this.id
}

output "public_subnet_ids" {
  description = "IDs of public subnets"
  value       = aws_subnet.public[*].id
}
```

### Parent Module

```hcl
# main.tf (root module)
module "network" {
  source      = "./modules/network"
  cidr_block  = "10.0.0.0/16"
  az_count    = 3
}

# Reference child module outputs
resource "aws_instance" "web" {
  ami       = var.ami_id
  subnet_id = module.network.public_subnet_ids[0]  # use child module output

  vpc_security_group_ids = [aws_security_group.web.id]
}

# Pass child module output to root output
output "vpc_id" {
  value = module.network.vpc_id
}
```

---

## `terraform_remote_state` — Cross-Workspace Outputs

When multiple Terraform workspaces manage different pieces of infrastructure, use `terraform_remote_state` to read outputs from one workspace in another:

```hcl
# In the "network" workspace
output "vpc_id" {
  value = aws_vpc.main.id
}
```

```hcl
# In the "application" workspace — reads from "network" workspace
data "terraform_remote_state" "network" {
  backend = "s3"
  config = {
    bucket = "my-terraform-state"
    key    = "network/terraform.tfstate"
    region = "us-east-1"
  }
}

resource "aws_instance" "app" {
  # Reference output from another workspace
  subnet_id = data.terraform_remote_state.network.outputs.public_subnet_ids[0]
}
```

> **Best Practice:** Use `terraform_remote_state` for loose coupling between workspaces. But be careful — it creates a dependency between workspaces that can slow down CI.

---

## Hands-On

```hcl
# outputs-demo/main.tf
terraform {
  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "random_id" "app" {
  byte_length = 8
}

resource "random_password" "secret" {
  length  = 16
  special = true
}

resource "local_file" "config" {
  filename = "${path.module}/app.conf"
  content  = "app_id=${random_id.app.hex}\n"
}

output "app_id" {
  description = "Unique application identifier"
  value       = random_id.app.hex
}

output "app_id_decimal" {
  description = "App ID in decimal format"
  value       = random_id.app.dec
}

output "config_file_path" {
  description = "Path to the generated config file"
  value       = local_file.config.filename
}

output "app_secret" {
  description = "Application secret (sensitive)"
  value       = random_password.secret.result
  sensitive   = true
}
```

```bash
terraform init
terraform apply

# See all outputs
terraform output

# Get specific output
terraform output app_id

# Get raw value (no quotes)
terraform output -raw app_id

# Get all as JSON
terraform output -json

# Read sensitive output
terraform output -json app_secret
```

---

## `precondition` in Outputs

```hcl
output "instance_ip" {
  description = "Public IP of the instance"
  value       = aws_instance.web.public_ip

  precondition {
    condition     = aws_instance.web.public_ip != ""
    error_message = "The instance must have a public IP. Check the subnet configuration."
  }
}
```

---

## Exam Tips

- Outputs are shown after `terraform apply` and `terraform output`.
- `sensitive = true` hides output in CLI but it's still in state.
- `terraform output -json` → machine-readable; `terraform output -raw` → plain string value.
- Outputs are the **only** mechanism to pass values between modules.
- `terraform_remote_state` reads outputs from another workspace's state.
- Output naming convention: `{name}_{type}_{attribute}` (from terraform-best-practices.com).
- Always include a `description` on every output.

---

## Further Reading

| Resource | URL |
|---|---|
| Output Values | https://developer.hashicorp.com/terraform/language/values/outputs |
| `terraform output` | https://developer.hashicorp.com/terraform/cli/commands/output |
| `terraform_remote_state` | https://developer.hashicorp.com/terraform/language/state/remote-state-data |
| Best Practices - Outputs | https://www.terraform-best-practices.com/naming |

---

*Next: [17 — Divide Files](./17-divide-files.md)*
