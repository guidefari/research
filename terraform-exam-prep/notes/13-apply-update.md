# 13 — Apply Update

> **Exam objective:** Understand how Terraform handles updates to existing infrastructure — in-place updates vs. replacements.

---

## Two Kinds of Updates

When you change a resource's configuration and run `terraform apply`, one of two things happens:

| Type | Symbol | What Happens |
|---|---|---|
| **In-place update** | `~` | Resource is modified without being destroyed |
| **Replacement** | `-/+` | Resource is destroyed, then a new one is created |

Which type occurs depends on the **provider's implementation** — specifically, whether an attribute supports in-place updates via the cloud API.

---

## In-Place Updates

Most attribute changes can be applied without recreating the resource:

```hcl
# Before
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Web server security group"
}

# After — change description
resource "aws_security_group" "web" {
  name        = "web-sg"
  description = "Web server security group (updated)"  # changed
}
```

Plan output:
```
~ resource "aws_security_group" "web" {
    ~ description = "Web server security group" -> "Web server security group (updated)"
    # Everything else stays the same
  }

Plan: 0 to add, 1 to change, 0 to destroy.
```

The security group is modified in-place — no downtime.

---

## Replacement Updates

Some attributes **cannot** be changed without destroying and recreating the resource — the underlying API doesn't support mutation:

```hcl
# Before
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.public.id
}

# After — change subnet (forces replacement)
resource "aws_instance" "web" {
  ami           = "ami-0c55b159cbfafe1f0"
  instance_type = "t3.micro"
  subnet_id     = aws_subnet.private.id  # changed — forces replacement!
}
```

Plan output:
```
-/+ resource "aws_instance" "web" {
      ~ subnet_id = "subnet-public-123" -> "subnet-private-456"  # forces replacement
    }

Plan: 1 to add, 0 to change, 1 to destroy.
```

The old instance is **destroyed** and a **new one** is created in its place.

---

## Common "Forces Replacement" Attributes

| Resource | Attributes That Force Replacement |
|---|---|
| `aws_instance` | `ami`, `subnet_id`, `availability_zone` |
| `aws_s3_bucket` | `bucket` (name) |
| `aws_rds_instance` | `engine`, `engine_version` (major), `db_name`, `storage_encrypted` |
| `aws_eks_cluster` | `name`, `role_arn` |
| `aws_db_subnet_group` | `name` |

> **Exam tip:** You don't need to memorize all of these. The plan output always tells you when an attribute `# forces replacement`.

---

## Controlling Update Behaviour

### `create_before_destroy` — Zero-Downtime Replacements

By default, Terraform destroys the old resource before creating the new one. For stateful or traffic-serving resources, this causes downtime:

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = "t3.micro"

  lifecycle {
    create_before_destroy = true  # new instance up before old is removed
  }
}
```

With this flag, the plan becomes:
```
+/- resource "aws_instance" "web" {  # note: + before -
      ~ ami = "ami-old" -> "ami-new"
    }
Plan: 1 to add, 0 to change, 1 to destroy.
```

Terraform creates the replacement first, then removes the old one.

### `prevent_destroy` — Block Accidental Destruction

```hcl
resource "aws_rds_instance" "prod" {
  # ...
  lifecycle {
    prevent_destroy = true
  }
}
```

If a plan would destroy this resource, Terraform errors out:
```
Error: Instance cannot be destroyed
  on main.tf line 1
  Resource aws_rds_instance.prod has lifecycle.prevent_destroy set to true.
```

### `ignore_changes` — Skip Certain Attribute Diffs

When external systems manage certain attributes (like auto-scaling desired count, or tags added by a tagging tool):

```hcl
resource "aws_autoscaling_group" "app" {
  # ...
  desired_capacity = 3

  lifecycle {
    ignore_changes = [desired_capacity]  # managed by autoscaling policies
  }
}
```

---

## Force-Replace Without Config Change

To force Terraform to replace a resource (recreate it) without changing its config:

```bash
# Force recreate a specific resource
terraform apply -replace=aws_instance.web

# Old way (deprecated in 0.15.2+)
terraform taint aws_instance.web
terraform apply
```

Use cases:
- Instance became unhealthy — refresh it
- Userdata/cloud-init changes that only apply at launch
- You want to reprovision with the same config

---

## Hands-On: Observe In-Place vs Replacement

```hcl
# update-demo/main.tf
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "local_file" "app" {
  filename        = "${path.module}/app.txt"
  content         = var.content
  file_permission = var.permissions
}

variable "content" {
  default = "version 1"
}

variable "permissions" {
  default = "0644"
}
```

```bash
terraform init
terraform apply -var="content=version 1" -var="permissions=0644"

# In-place update (content change)
terraform plan -var="content=version 2" -var="permissions=0644"
# Shows ~ (in-place update)

# Replacement (permissions force new resource in local_file provider)
terraform plan -var="content=version 2" -var="permissions=0755"
# Shows -/+ (replacement)
```

---

## Exam Tips

- `~` = in-place update; `-/+` = destroy + recreate (replacement).
- The provider documentation tells you which attributes `# forces replacement`.
- `create_before_destroy = true` creates the new resource before destroying the old one — critical for high-availability.
- `terraform apply -replace=<resource>` is the modern way to force-recreate. `terraform taint` is deprecated.
- `prevent_destroy = true` prevents the resource from being destroyed in a plan — it does NOT affect `terraform destroy` from being attempted — it will error out on any plan that includes a destroy of that resource.

---

## Further Reading

| Resource | URL |
|---|---|
| Resource Lifecycle | https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle |
| `terraform apply -replace` | https://developer.hashicorp.com/terraform/cli/commands/apply#replace-address |
| Zero-Downtime Deployments | https://developer.hashicorp.com/terraform/tutorials/state/resource-lifecycle |

---

*Next: [14 — Input Variables](./14-input-variables.md)*
