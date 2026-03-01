# 20 — Destroy

> **Exam objective:** Understand how to destroy infrastructure with Terraform — fully, partially, and safely.

---

## `terraform destroy`

The `terraform destroy` command removes **all** resources managed by the current configuration from both the real world and the state file.

```bash
terraform destroy
```

Terraform shows a plan and prompts for confirmation:

```
Terraform will destroy all your managed infrastructure, as shown above.
There is no undo. Only 'yes' will be accepted to confirm.

Enter a value: yes
```

Internally, `destroy` is equivalent to:
```bash
terraform apply -destroy
```

---

## Destroy Is Ordered

Terraform destroys resources in the **reverse** of their creation order, respecting dependencies:

```
Created:  VPC → Subnet → EC2 Instance
Destroyed: EC2 Instance → Subnet → VPC
```

This ensures no resource is deleted while something else still depends on it.

---

## Preview Before Destroying

Always plan a destroy before doing it:

```bash
# Show what would be destroyed — don't actually destroy
terraform plan -destroy

# Save the destroy plan
terraform plan -destroy -out=destroy.tfplan

# Apply the saved destroy plan
terraform apply destroy.tfplan
```

---

## Targeted Destroy

Destroy a **specific resource** without touching everything else:

```bash
# Destroy one resource
terraform destroy -target=aws_instance.web

# Destroy a whole module
terraform destroy -target=module.database

# Destroy multiple targets
terraform destroy \
  -target=aws_instance.web \
  -target=aws_security_group.web
```

> **Warning:** Use `-target` carefully. It can leave your configuration and state inconsistent. After a targeted destroy, run `terraform plan` to verify the remaining state is clean.

---

## Preventing Destruction

### `prevent_destroy` Lifecycle

```hcl
resource "aws_rds_instance" "prod" {
  # ...
  lifecycle {
    prevent_destroy = true
  }
}
```

Any plan that would destroy this resource will error:

```
Error: Instance cannot be destroyed
  on main.tf line 1:
  Resource aws_rds_instance.prod has lifecycle.prevent_destroy set to true.
  To proceed, either remove lifecycle.prevent_destroy or reduce the scope of the plan.
```

To destroy it, you must first remove `prevent_destroy = true` from the config, then plan and apply.

### AWS Deletion Protection

Many AWS resources have their own deletion protection at the API level:

```hcl
resource "aws_rds_instance" "prod" {
  # ...
  deletion_protection = true   # AWS-level protection
}

resource "aws_elb" "main" {
  # ...
  # No delete protection, but you can use prevent_destroy
}
```

---

## Remove Resources from State Without Destroying

Sometimes you want to stop managing a resource with Terraform **without deleting it from the real world** (e.g., you're migrating to a different config, or moving between workspaces):

```bash
# Remove from state — resource still exists in the cloud
terraform state rm aws_instance.web

# After this, terraform plan will show it as needing to be created
# (because it's no longer in state)
```

---

## Forgetting Resources (`removed` block, Terraform 1.7+)

Terraform 1.7 introduced the `removed` block to declaratively remove resources from state:

```hcl
# This tells Terraform to remove the resource from state
# without destroying the real infrastructure
removed {
  from = aws_instance.web

  lifecycle {
    destroy = false   # don't destroy — just remove from management
  }
}
```

```bash
terraform apply   # removes from state, keeps the real resource
```

---

## Handling Destroy Dependencies

When you destroy, Terraform figures out the correct order. But sometimes you need to help it:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "my-app-logs"
}

resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id
  policy = data.aws_iam_policy_document.logs.json
}
```

The bucket policy depends on the bucket → on destroy, policy is removed first, then bucket.

### Force-Destroying Buckets with Contents

S3 buckets with objects can't be deleted directly. Use `force_destroy`:

```hcl
resource "aws_s3_bucket" "logs" {
  bucket        = "my-app-logs"
  force_destroy = true   # deletes all objects before deleting bucket
}
```

> **Use `force_destroy = true` carefully** — it deletes all bucket contents. Only enable this for non-critical buckets (e.g., log archives you don't need).

---

## Hands-On: Safe Destroy Workflow

```hcl
# destroy-demo/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}

resource "local_file" "important" {
  filename = "${path.module}/important.txt"
  content  = "This file is important!\n"

  lifecycle {
    prevent_destroy = true
  }
}

resource "local_file" "disposable" {
  filename = "${path.module}/disposable.txt"
  content  = "This can be deleted.\n"
}
```

```bash
terraform init
terraform apply

# Try to destroy everything — should fail (prevent_destroy)
terraform destroy
# Error: Resource has lifecycle.prevent_destroy set to true

# Preview destroy
terraform plan -destroy

# Destroy only the disposable resource
terraform destroy -target=local_file.disposable

# Remove prevent_destroy from config, then destroy everything
# (edit main.tf to remove the lifecycle block)
terraform destroy
```

---

## Destroy in CI/CD

Destroy is typically a **manual, human-approved** operation in CI/CD:

```yaml
# GitHub Actions example
destroy:
  runs-on: ubuntu-latest
  environment: production    # requires manual approval in GitHub
  steps:
    - uses: actions/checkout@v4
    - uses: hashicorp/setup-terraform@v3
    - run: terraform init
    - run: terraform plan -destroy -out=destroy.tfplan
    - run: terraform apply destroy.tfplan
```

---

## Common Destroy Gotchas

| Problem | Solution |
|---|---|
| Resource has `prevent_destroy = true` | Remove the lifecycle flag, then destroy |
| S3 bucket not empty | Add `force_destroy = true` to bucket resource |
| RDS with deletion protection | Set `deletion_protection = false`, apply, then destroy |
| Resources destroyed in wrong order | Check for missing `depends_on` |
| State file locked (another apply running) | Wait, or force-unlock with `terraform force-unlock <id>` |

---

## Exam Tips

- `terraform destroy` is equivalent to `terraform apply -destroy`.
- Destroy respects the dependency graph — resources are destroyed in **reverse creation order**.
- `prevent_destroy = true` errors on ANY plan that would destroy the resource.
- `terraform state rm` removes a resource from state **without** destroying it.
- Use `-target` for partial destroys (sparingly — can leave state inconsistent).
- `force_destroy = true` on S3 buckets allows destroying non-empty buckets.

---

## Further Reading

| Resource | URL |
|---|---|
| `terraform destroy` | https://developer.hashicorp.com/terraform/cli/commands/destroy |
| `terraform state rm` | https://developer.hashicorp.com/terraform/cli/commands/state/rm |
| Lifecycle prevent_destroy | https://developer.hashicorp.com/terraform/language/meta-arguments/lifecycle#prevent_destroy |
| Removed block (1.7+) | https://developer.hashicorp.com/terraform/language/resources/syntax#removing-resources |

---

*Next: [21 — Cloud](./21-cloud.md)*
