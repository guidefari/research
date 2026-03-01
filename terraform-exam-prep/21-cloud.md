# 21 — Cloud (HCP Terraform)

> **Exam objective:** Understand HCP Terraform (formerly Terraform Cloud) — workspaces, remote operations, VCS integration, and collaboration features.

---

## What Is HCP Terraform?

**HCP Terraform** (HashiCorp Cloud Platform Terraform, formerly Terraform Cloud) is HashiCorp's managed service for:

- **Remote state storage** — encrypted, versioned, accessible to teams
- **Remote plan/apply** — runs execute in managed cloud infrastructure, not on your laptop
- **Collaboration** — pull request reviews, approval workflows, audit logs
- **VCS integration** — trigger plans automatically from git commits
- **Policy as Code** — Sentinel policies enforce compliance
- **Private module registry** — share modules across your organisation

The free tier supports up to 500 managed resources — suitable for learning and small teams.

---

## HCP Terraform vs. Terraform CLI

| Feature | CLI (Local) | HCP Terraform |
|---|---|---|
| State storage | Local file or self-managed S3 | Managed, encrypted, versioned |
| Plan/Apply execution | Your machine or CI server | Managed cloud runners |
| Team access | Manual file sharing | Role-based access control |
| Audit logging | None | Full audit log |
| Policy enforcement | Manual | Sentinel / OPA |
| VCS integration | Manual | Native (GitHub, GitLab, etc.) |
| Cost | Free | Free tier + paid plans |

---

## Setting Up HCP Terraform

### Step 1: Create an Account

1. Go to https://app.terraform.io
2. Create a free account (or use your HashiCorp account)
3. Create an **organisation**

### Step 2: Get a Token

```bash
# Login via CLI — opens browser for authentication
terraform login
```

This stores a token in `~/.terraform.d/credentials.tfrc.json`.

Or create a token manually:
- User Settings → Tokens → Create API Token

---

## Workspaces

In HCP Terraform, a **workspace** is the unit of organisation. Each workspace has:
- Its own state file
- Its own set of variables
- Its own run history
- Its own access permissions

> **Note:** HCP Terraform workspaces ≠ CLI workspaces. CLI workspaces are just different state files in the same backend. HCP Terraform workspaces are full isolated environments with their own settings.

### Creating a Workspace (CLI-driven)

**Workflow:** You run Terraform locally; HCP Terraform stores state and can enforce policies.

```hcl
# versions.tf
terraform {
  required_version = ">= 1.5.0"

  cloud {
    organization = "my-org"

    workspaces {
      name = "my-app-production"
    }
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

```bash
terraform login
terraform init    # connects to HCP Terraform
terraform plan    # state stored in HCP Terraform
terraform apply   # runs apply (locally by default in CLI-driven mode)
```

### Creating a Workspace (VCS-driven)

In the HCP Terraform UI:
1. New Workspace → Version Control Workflow
2. Connect to GitHub/GitLab/Bitbucket
3. Select repository and branch
4. Configure auto-apply settings

Once configured:
- **Push to branch** → triggers a plan in HCP Terraform
- **Merge PR** → auto-apply (if configured)

---

## Remote Backend (Legacy approach, still common)

The `cloud` block (above) is the modern approach. The older approach uses `backend "remote"`:

```hcl
terraform {
  backend "remote" {
    organization = "my-org"

    workspaces {
      name = "my-app-production"
    }
  }
}
```

Both work; the `cloud` block is preferred for new configurations.

---

## Remote Execution (API-driven)

When using HCP Terraform with the `cloud` block in "remote" execution mode:
- Plans and applies run on HCP Terraform's infrastructure, not locally
- Useful for: consistent environments, no need to manage CI runners
- Configure in workspace settings: **Execution Mode → Remote**

```bash
# With remote execution, these commands stream output from HCP Terraform
terraform plan    # plan runs in HCP Terraform cloud
terraform apply   # apply runs in HCP Terraform cloud
```

---

## Variables in HCP Terraform

Set variables at the workspace level in the UI or via API — they don't need to be in your repository:

```bash
# Set a workspace variable via CLI
terraform workspace select my-app-production

# Or configure in UI: Workspace → Variables → Add Variable
```

Variable types:
- **Terraform Variables** — equivalent to `-var` on CLI
- **Environment Variables** — set in the runner's environment (for provider credentials, etc.)

For secrets, mark variables as **Sensitive** — they're write-only (you can't read them back).

---

## Hands-On: Connect to HCP Terraform

```bash
# 1. Login
terraform login

# 2. Update your configuration
cat > versions.tf << 'EOF'
terraform {
  cloud {
    organization = "YOUR-ORG-NAME"

    workspaces {
      name = "learning-terraform"
    }
  }

  required_providers {
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}
EOF

# 3. Init — connects to HCP Terraform
terraform init

# 4. Plan — state now stored in HCP Terraform
terraform plan

# 5. Apply
terraform apply

# 6. Check the workspace in the UI
# https://app.terraform.io/app/YOUR-ORG-NAME/workspaces/learning-terraform
```

---

## Access Control

HCP Terraform has team-based RBAC:

| Role | Permissions |
|---|---|
| **Read** | View runs, state, variables |
| **Plan** | Read + trigger plans |
| **Write** | Plan + apply, manage variables |
| **Admin** | Write + manage workspace settings |

---

## Sentinel (Policy as Code)

Sentinel is HCP Terraform's policy framework (paid feature). Policies run after `plan` and before `apply`:

```python
# Example Sentinel policy: enforce instance type limits
import "tfplan/v2" as tfplan

allowed_types = ["t3.micro", "t3.small", "t3.medium"]

main = rule {
  all tfplan.resource_changes as _, rc {
    rc.type is not "aws_instance" or
    rc.change.after.instance_type in allowed_types
  }
}
```

Policies can be **advisory** (warn but allow) or **mandatory** (block apply).

---

## Exam Tips

- HCP Terraform provides **remote state, remote execution, VCS integration, and policy enforcement**.
- The `cloud` block is the modern way to connect to HCP Terraform (replaces `backend "remote"`).
- HCP Terraform workspaces are full isolated environments — different from CLI workspaces.
- Sensitive variables in HCP Terraform are **write-only** — they can't be read back.
- Remote execution mode runs plans/applies on HCP Terraform's managed infrastructure.
- Sentinel policies run **between** plan and apply (paid feature).
- `terraform login` authenticates with HCP Terraform and stores credentials locally.

---

## Further Reading

| Resource | URL |
|---|---|
| HCP Terraform | https://developer.hashicorp.com/terraform/cloud-docs |
| Get Started with HCP Terraform | https://developer.hashicorp.com/terraform/tutorials/cloud/cloud-sign-up |
| Workspace Overview | https://developer.hashicorp.com/terraform/cloud-docs/workspaces |
| The `cloud` Block | https://developer.hashicorp.com/terraform/language/settings/terraform-cloud |
| Sentinel | https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement |
| Remote Execution | https://developer.hashicorp.com/terraform/cloud-docs/run/remote-operations |

---

*Next: [22 — Cloud Updated](./22-cloud-updated.md)*
