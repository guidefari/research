# 06 — Terraform Lifecycle

> **Exam objective:** Understand the Terraform resource lifecycle — including the `lifecycle` meta-argument and the overall workflow.

---

## The Terraform Workflow Lifecycle

At the highest level, every Terraform operation follows this cycle:

```
Write Config → init → plan → apply ──► Manage
                                ↑           │
                                └───────────┘
                            (repeat as infra evolves)
```

| Phase | What Happens |
|---|---|
| **Write** | Author `.tf` files describing desired state |
| **Init** | Download providers, modules, configure backend |
| **Plan** | Diff desired state vs real world → generate execution plan |
| **Apply** | Execute the plan: create/update/delete resources |
| **Manage** | Repeat: as requirements change, update config and re-apply |

---

## Resource Lifecycle — CRUD

Every Terraform resource goes through these states:

```
        terraform apply (new resource)
              │
              ▼
         ┌─────────┐
         │ Created │◄──── exists in state + real world
         └────┬────┘
              │ config changes
              ▼
         ┌─────────┐
         │ Updated │  ← in-place update   (config changes, same resource)
         │   OR    │
         │Replaced │  ← destroy + recreate (forces new resource)
         └────┬────┘
              │ terraform destroy
              ▼
         ┌─────────┐
         │ Deleted │  ← removed from state + real world
         └─────────┘
```

---

## The `lifecycle` Meta-Argument

Every resource supports a `lifecycle` block that customises how Terraform manages that resource. This is one of the most exam-tested areas.

```hcl
resource "aws_instance" "web" {
  ami           = "ami-12345678"
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true
    prevent_destroy       = false
    ignore_changes        = [tags]
    replace_triggered_by  = [aws_security_group.web]
  }
}
```

### `create_before_destroy`

**Default:** `false` (destroy old, then create new)

When set to `true`, Terraform creates the **replacement resource first**, then destroys the old one. Critical for zero-downtime deployments.

```hcl
resource "aws_instance" "web" {
  # ...
  lifecycle {
    create_before_destroy = true
  }
}
```

> **Use case:** Load-balanced instances — the new instance becomes healthy before the old one is removed.

### `prevent_destroy`

When `true`, Terraform will **error out** if a plan would destroy this resource. Protects against accidental deletion.

```hcl
resource "aws_rds_instance" "prod_db" {
  # ...
  lifecycle {
    prevent_destroy = true
  }
}
```

> **Important:** This only works when Terraform is managing the resource. Running `terraform destroy` on the whole workspace still requires removing this flag first.

### `ignore_changes`

Tell Terraform to ignore specific attribute changes — even if they drift from config. Useful for attributes managed externally or auto-set by the cloud.

```hcl
resource "aws_instance" "web" {
  ami = "ami-12345678"

  lifecycle {
    # Don't re-apply if someone manually changes the AMI
    ignore_changes = [ami]
  }
}

# Ignore all changes (use sparingly!)
resource "aws_ecs_service" "app" {
  # ...
  lifecycle {
    ignore_changes = [desired_count]  # managed by autoscaling
  }
}
```

### `replace_triggered_by`

Forces a resource to be **replaced** when any of the listed resources or attributes change — even if the resource itself hasn't changed.

```hcl
resource "aws_instance" "web" {
  # ...
  lifecycle {
    replace_triggered_by = [
      aws_security_group.web,          # replace if SG changes
      aws_launch_template.web.id,      # replace if LT id changes
    ]
  }
}
```

### `precondition` and `postcondition` (Terraform >= 1.2)

Custom validation conditions within `lifecycle`:

```hcl
resource "aws_instance" "web" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instance_type

  lifecycle {
    precondition {
      condition     = var.instance_type != "t1.micro"
      error_message = "t1.micro is deprecated. Use t3.micro or newer."
    }

    postcondition {
      condition     = self.public_ip != ""
      error_message = "Instance must have a public IP."
    }
  }
}
```

---

## Hands-On: Observe Lifecycle Behaviours

Set up a small local example to see `create_before_destroy` in action:

```hcl
# lifecycle-demo/main.tf

resource "local_file" "config" {
  filename = "${path.module}/config.txt"
  content  = "version: ${var.version}"

  lifecycle {
    create_before_destroy = true
  }
}

variable "version" {
  default = "1.0"
}
```

```bash
terraform init
terraform apply -var="version=1.0"
terraform apply -var="version=2.0"   # triggers replacement
```

Watch the plan — you'll see "will be replaced" and the order of operations.

---

## State and Drift

After `apply`, Terraform writes the **real-world attributes** to state. On the next `plan`:

1. Terraform **reads** state (what it last knew)
2. Terraform **queries** the provider API (what actually exists)
3. Terraform **diffs** desired config vs current reality
4. Any differences are reflected in the plan

This diff-and-reconcile loop is the heart of the Terraform lifecycle.

---

## Exam Tips

- `lifecycle` is a **meta-argument** — available on ALL resources.
- `create_before_destroy = true` is key for zero-downtime replacements.
- `prevent_destroy = true` prevents `terraform apply` from destroying the resource — NOT `terraform destroy` (it will error on apply, not on destroy). Actually it prevents both — Terraform will error any plan that would destroy the resource regardless of the command.
- `ignore_changes` accepts a list of **attribute names** or `all` (the literal keyword).
- `replace_triggered_by` was added in Terraform 1.2 — know the version.
- `precondition`/`postcondition` are validation hooks within the lifecycle.

---

## Further Reading

| Resource | URL |
|---|---|
| Resource Lifecycle | https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle |
| The Core Workflow | https://developer.hashicorp.com/terraform/intro/core-workflow |
| Custom Conditions | https://developer.hashicorp.com/terraform/language/expressions/custom-conditions |

---

*Next: [07 — Init](./07-init.md)*
