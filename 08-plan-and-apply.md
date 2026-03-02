# 08 — Plan and Apply

> **Exam objective:** Understand the `terraform plan` and `terraform apply` workflow in depth.

---

## The Plan-Apply Cycle

```
┌─────────────────────────────────────────────────────┐
│                    terraform plan                    │
│                                                      │
│  1. Read configuration (.tf files)                   │
│  2. Read current state (backend)                     │
│  3. Query providers for real-world resource state    │
│  4. Diff: desired config vs current state            │
│  5. Output: execution plan                           │
└─────────────────────────────────────────────────────┘
                         │
                         │ (you review and approve)
                         ▼
┌─────────────────────────────────────────────────────┐
│                    terraform apply                   │
│                                                      │
│  1. (Re-)run plan                                    │
│  2. Prompt for confirmation                          │
│  3. Execute CRUD operations via providers            │
│  4. Update state with new real-world attributes      │
└─────────────────────────────────────────────────────┘
```

---

## `terraform plan` in Depth

### Basic Usage

```bash
terraform plan
```

### Reading the Plan Output

```
Terraform will perform the following actions:

  # aws_instance.web will be created
  + resource "aws_instance" "web" {
      + ami                          = "ami-0c55b159cbfafe1f0"
      + instance_type                = "t3.micro"
      + id                           = (known after apply)
      + public_ip                    = (known after apply)
      + tags                         = {
          + "Name" = "web-server"
        }
    }

  # aws_s3_bucket.logs must be replaced
-/+ resource "aws_s3_bucket" "logs" {
      ~ bucket = "old-name" -> "new-name"  # forces replacement
    }

  # aws_security_group.ssh will be updated in-place
  ~ resource "aws_security_group" "ssh" {
      ~ description = "Old description" -> "New description"
    }

Plan: 1 to add, 1 to change, 1 to destroy.
```

### Plan Symbols

| Symbol | Meaning |
|---|---|
| `+` | Will be **created** |
| `-` | Will be **destroyed** |
| `~` | Will be **updated in-place** |
| `-/+` | Will be **destroyed and recreated** (replaced) |
| `<=` | Will be **read** (data source) |
| `(known after apply)` | Value not known until the resource is created |

### Saving a Plan

```bash
# Save the plan to a binary file
terraform plan -out=tfplan

# Apply that exact plan (no re-plan, no prompt)
terraform apply tfplan
```

> **Best Practice:** In CI/CD pipelines, always save the plan and apply the saved file. This ensures what you reviewed is exactly what gets applied — no surprises from infra changing between plan and apply.

### Plan Flags

| Flag | Effect |
|---|---|
| `-out=<file>` | Save plan to file |
| `-destroy` | Preview a destroy |
| `-refresh-only` | Only refresh state, don't plan changes |
| `-refresh=false` | Skip provider refresh (faster, uses cached state) |
| `-target=<resource>` | Only plan specific resource(s) |
| `-var="key=value"` | Set a variable |
| `-var-file=<file>` | Load variables from a file |
| `-parallelism=<n>` | Control concurrent operations (default: 10) |

---

## `terraform apply` in Depth

### Basic Usage

```bash
terraform apply
```

This runs a fresh plan, shows it, and prompts:
```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value:
```

Type `yes` to proceed.

### Apply a Saved Plan

```bash
terraform apply tfplan
```

No prompt — this applies exactly what was planned.

### Apply Flags

| Flag | Effect |
|---|---|
| `-auto-approve` | Skip confirmation prompt |
| `-target=<resource>` | Only apply specific resource(s) |
| `-var="key=value"` | Set a variable |
| `-var-file=<file>` | Load variables from file |
| `-parallelism=<n>` | Concurrent operations (default: 10) |
| `-refresh=false` | Skip provider refresh before apply |
| `-destroy` | Destroy all resources (same as `terraform destroy`) |

---

## Hands-On: Full Plan-Apply Workflow

```hcl
# main.tf
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "local_file" "app_config" {
  filename = "${path.module}/app.conf"
  content  = <<-EOT
    environment = ${var.environment}
    debug       = ${var.debug}
  EOT
}

variable "environment" {
  default = "development"
}

variable "debug" {
  default = false
}
```

```bash
# Initialize
terraform init

# Plan and inspect output carefully
terraform plan

# Save the plan
terraform plan -out=myplan.tfplan

# Show the saved plan (human-readable)
terraform show myplan.tfplan

# Apply the saved plan
terraform apply myplan.tfplan

# Update a variable and see what changes
terraform plan -var="environment=production"

# Apply with auto-approve (careful!)
terraform apply -var="environment=production" -auto-approve
```

---

## Refresh Behaviour

During `plan` and `apply`, Terraform calls providers to get the **current real-world state** of each resource. This is called a "refresh."

```bash
# Apply but don't refresh (uses state as-is — faster, but can miss drift)
terraform apply -refresh=false

# ONLY refresh — don't plan changes (detect drift)
terraform apply -refresh-only
```

---

## What Happens to State After Apply

After a successful apply:
1. Terraform writes **all resource attributes** to the state file
2. The state reflects the post-apply real-world state
3. A backup of the previous state is saved as `terraform.tfstate.backup`

---

## Parallelism

By default, Terraform performs up to **10 operations concurrently**. You can adjust this:

```bash
# Slow down for rate-limited APIs
terraform apply -parallelism=5

# Speed up if your API handles it
terraform apply -parallelism=20
```

---

## Exam Tips

- `terraform plan` shows a **preview** — nothing is changed.
- `terraform apply` runs a plan first, then prompts. With `-auto-approve`, it skips the prompt.
- Saved plan files (`-out`) guarantee that what you approved is what gets applied.
- `+` = create, `-` = destroy, `~` = update, `-/+` = replace.
- `(known after apply)` means the provider will determine the value at creation time.
- `-refresh=false` skips the provider API calls — can be used when you trust your state.
- The default parallelism is **10**.

---

## Further Reading

| Resource | URL |
|---|---|
| `terraform plan` | https://developer.hashicorp.com/terraform/cli/commands/plan |
| `terraform apply` | https://developer.hashicorp.com/terraform/cli/commands/apply |
| Core Workflow | https://developer.hashicorp.com/terraform/intro/core-workflow |
| Inspecting Plans | https://developer.hashicorp.com/terraform/tutorials/cli/plan |

---

*Next: [09 — Execution Plans](./09-execution-plans.md)*
