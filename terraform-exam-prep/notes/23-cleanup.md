# 23 — Cleanup

> **Exam objective:** Know how to safely tear down infrastructure, clean up state, and maintain a healthy Terraform workspace.

---

## What "Cleanup" Means in Terraform

Cleanup has several dimensions:

1. **Resource cleanup** — destroying infrastructure no longer needed
2. **State cleanup** — removing stale entries, fixing corrupted state
3. **Workspace cleanup** — removing old workspaces
4. **Local cleanup** — removing cached providers, plan files
5. **Code cleanup** — removing unused resources from configuration

---

## 1. Resource Cleanup (`terraform destroy`)

The most common cleanup operation — see [20 — Destroy](./20-destroy.md) for the full deep-dive.

```bash
# Destroy all resources in the working directory
terraform destroy

# Preview first (always recommended)
terraform plan -destroy

# Destroy with saved plan
terraform plan -destroy -out=destroy.tfplan
terraform apply destroy.tfplan

# Partial cleanup
terraform destroy -target=module.old_service
```

---

## 2. State Cleanup

State accumulates entries over time. Stale entries cause noise in plans. Clean them up carefully.

### List State Contents

```bash
terraform state list
```

### Remove a Stale Resource from State

When a resource was deleted manually (outside Terraform) and you want to stop tracking it:

```bash
# Remove from state — does NOT destroy the real resource
terraform state rm aws_instance.old_web

# Remove a whole module from state
terraform state rm module.old_service
```

### Move Resources in State (Rename Without Recreate)

When you rename a resource in code:

```bash
# Move from old name to new name — avoids destroy+create
terraform state mv aws_instance.web aws_instance.web_server

# Move a resource into a module
terraform state mv aws_instance.web module.compute.aws_instance.web

# Move between workspaces (pull → modify → push)
terraform state pull > state.json
# edit state.json
terraform state push state.json
```

### Import Existing Resources

When resources exist in the real world but not in state:

```bash
# Import by resource address and cloud ID
terraform import aws_instance.existing i-0abc123def456789
terraform import aws_s3_bucket.logs my-existing-bucket

# Terraform 1.5+: declarative import block
```

```hcl
# import block (Terraform 1.5+)
import {
  to = aws_instance.existing
  id = "i-0abc123def456789"
}
```

### Refresh State (Detect Drift)

```bash
# Sync state with real world without making changes
terraform apply -refresh-only
```

---

## 3. Workspace Cleanup

### CLI Workspaces

```bash
# List workspaces
terraform workspace list

# Switch to default before deleting
terraform workspace select default

# Delete an old workspace
terraform workspace delete old-feature-branch

# Force-delete if it has state (be careful!)
terraform workspace delete -force old-feature-branch
```

> **Warning:** Deleting a workspace deletes its state file. Only do this after you've confirmed the resources are destroyed or you've migrated the state.

### HCP Terraform Workspaces

Delete via UI: Workspace → Settings → Danger Zone → Delete Workspace

Or via API:
```bash
curl \
  -H "Authorization: Bearer $TF_TOKEN" \
  -X DELETE \
  https://app.terraform.io/api/v2/workspaces/ws-ABC123
```

---

## 4. Local Directory Cleanup

After finishing with a working directory:

```bash
# Remove downloaded providers and modules (safe — re-downloadable with init)
rm -rf .terraform/

# Remove plan files
rm -f *.tfplan

# Remove local state (DANGER — only if you're done with the workspace)
rm -f terraform.tfstate terraform.tfstate.backup

# Re-initialize if you deleted .terraform/
terraform init
```

What to keep:
```
✓ Keep:  *.tf files
✓ Keep:  .terraform.lock.hcl
✗ Delete: .terraform/          (re-downloadable)
✗ Delete: *.tfplan             (stale plan files)
```

---

## 5. Cleaning Up Removed Resources from Code

When you remove a resource from your `.tf` files, Terraform will destroy it on the next apply. But sometimes you want to stop managing a resource **without** destroying it.

### Option A: `terraform state rm` (remove from state)

```bash
terraform state rm aws_instance.legacy
```

Now the instance is no longer tracked — Terraform won't destroy it or show it in plans.

### Option B: `removed` block (Terraform 1.7+)

```hcl
# Declare that you're removing this resource from management
removed {
  from = aws_instance.legacy

  lifecycle {
    destroy = false   # don't destroy it, just stop managing it
  }
}
```

Apply this once, then remove the `removed` block from your code.

---

## 6. Force-Unlock a Stuck State

If a `plan` or `apply` was interrupted, the state may be locked. To unlock:

```bash
# Show lock information
terraform force-unlock -help

# Force unlock (use the lock ID from the error message)
terraform force-unlock LOCK-ID-FROM-ERROR-MESSAGE
```

> **Caution:** Only force-unlock if you're sure no other apply is running. Force-unlocking during a live apply can corrupt state.

---

## Complete Cleanup Checklist

Use this when decommissioning a Terraform-managed environment:

```
Pre-Cleanup
[ ] Notify stakeholders
[ ] Backup state: terraform state pull > backup.tfstate
[ ] Disable lifecycle prevent_destroy on protected resources
[ ] Remove deletion protection from AWS resources (RDS, ELB, etc.)
[ ] Empty any S3 buckets or set force_destroy=true

Destroy
[ ] Run: terraform plan -destroy (review carefully)
[ ] Save plan: terraform plan -destroy -out=destroy.tfplan
[ ] Apply: terraform apply destroy.tfplan
[ ] Verify: check cloud console — no resources remain
[ ] Verify state: terraform state list (should be empty)

Post-Cleanup
[ ] Delete workspace (CLI or HCP Terraform)
[ ] Delete state backend resources (S3 bucket, DynamoDB table)
[ ] Archive or delete the git repository/branch
[ ] Remove credentials/secrets used by this workspace
[ ] Update documentation
```

---

## Hands-On: Full Cleanup of a Tutorial Environment

If you've been following these tutorials, here's how to clean up everything:

```bash
# 1. Go to each tutorial directory and destroy
for dir in local-module-demo vars-demo outputs-demo graph-demo; do
  if [ -d "$dir" ]; then
    cd "$dir"
    terraform destroy -auto-approve
    cd ..
  fi
done

# 2. Clean up local Terraform files
find . -name ".terraform" -type d -exec rm -rf {} + 2>/dev/null
find . -name "*.tfstate" -exec rm -f {} +
find . -name "*.tfstate.backup" -exec rm -f {} +
find . -name "*.tfplan" -exec rm -f {} +

# 3. Clean up generated files
find . -name "*.txt" -not -name "README.md" -exec rm -f {} +
find . -name "*.conf" -exec rm -f {} +
```

---

## Exam Tips

- `terraform state rm` removes from state but does NOT destroy the real resource.
- `terraform state mv` renames a resource in state — avoids destroy+recreate.
- `removed` block (1.7+) is the declarative way to stop managing a resource.
- `terraform force-unlock` unblocks a stuck state lock — use carefully.
- Deleting a CLI workspace deletes its state — only do this after destroying resources.
- After removing `prevent_destroy`, resources can be destroyed normally.
- Always `terraform plan -destroy` before `terraform destroy` — review what will go.

---

## Further Reading

| Resource | URL |
|---|---|
| `terraform destroy` | https://developer.hashicorp.com/terraform/cli/commands/destroy |
| `terraform state rm` | https://developer.hashicorp.com/terraform/cli/commands/state/rm |
| `terraform state mv` | https://developer.hashicorp.com/terraform/cli/commands/state/mv |
| `removed` block | https://developer.hashicorp.com/terraform/language/resources/syntax#removing-resources |
| `terraform force-unlock` | https://developer.hashicorp.com/terraform/cli/commands/force-unlock |
| Workspaces | https://developer.hashicorp.com/terraform/language/state/workspaces |

---

## Congratulations!

You've completed all 23 modules of this Terraform Associate exam prep tutorial.

### What's Next?

1. **Practice exam questions:**
   - HashiCorp's official sample questions: https://developer.hashicorp.com/terraform/tutorials/certification-004/associate-questions
   - Study guide: https://developer.hashicorp.com/terraform/tutorials/certification-004

2. **Hands-on labs:**
   - HashiCorp Learn: https://developer.hashicorp.com/terraform/tutorials
   - KodeKloud Terraform labs (free tier available)

3. **Review weak areas:**
   - Go back to any module where the exam tips tripped you up
   - The exam is multiple-choice — focus on concepts, not memorising commands

4. **Schedule the exam:**
   - https://developer.hashicorp.com/certifications/infrastructure-automation

Good luck!
