# 22 — Cloud Updated

> **Exam objective:** Understand HCP Terraform's advanced collaboration features — drift detection, audit logging, workspace organisation, and run workflows.

---

## HCP Terraform Run Workflow

A **run** in HCP Terraform is the lifecycle of a single plan+apply operation. Understanding runs is key to the exam.

```
Code pushed / triggered
        │
        ▼
   ┌─────────┐
   │ Pending │  waiting to start
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │Planning │  terraform plan
   └────┬────┘
        │
        ▼
   ┌──────────────────────┐
   │ Needs Confirmation   │  waiting for human approval
   └────────┬─────────────┘
            │ approved
            ▼
   ┌─────────┐
   │Applying │  terraform apply
   └────┬────┘
        │
        ▼
   ┌─────────┐
   │ Applied │  complete
   └─────────┘
```

### Run Triggers

| Trigger | Description |
|---|---|
| **VCS push** | Code pushed to the connected branch |
| **Manual** | Triggered from UI or API |
| **API** | Triggered via HCP Terraform API |
| **Run trigger** | Upstream workspace applied successfully |

---

## Workspace Run Modes

Configure in Workspace Settings → General:

| Mode | Description |
|---|---|
| **Remote** | Plan and apply run in HCP Terraform's cloud |
| **Local** | Plan and apply run on your machine; state stored in HCP Terraform |
| **Agent** | Plan and apply run on your own infrastructure (self-hosted agents) |

---

## Auto-Apply

When enabled, approved plans are applied automatically without human confirmation:

```
Workspace Settings → Auto Apply → Enable
```

> **Caution:** Only enable auto-apply on non-production workspaces or workspaces with strong policy controls.

---

## Workspace Variables and Variable Sets

### Workspace Variables

Set per-workspace in the UI:
- Terraform Variables (equivalent to `-var`)
- Environment Variables (available to runs as env vars)

### Variable Sets

**Variable Sets** let you define variables once and apply them to multiple workspaces:

```
HCP Terraform UI:
Settings → Variable Sets → New Variable Set

Example: "AWS Credentials" variable set
  AWS_ACCESS_KEY_ID     = ***  (environment, sensitive)
  AWS_SECRET_ACCESS_KEY = ***  (environment, sensitive)

Apply to: all workspaces OR specific workspaces
```

This is much better than setting credentials on every workspace individually.

---

## Drift Detection

HCP Terraform can periodically check for **drift** — when real-world infrastructure has changed outside of Terraform:

```
Workspace Settings → Health → Enable Drift Detection
```

When drift is detected, HCP Terraform:
1. Creates a drift assessment (plan -refresh-only)
2. Shows what changed
3. Optionally triggers a remediation run

This is critical for compliance — you always know when someone made a manual change.

---

## Workspace Organisation

### Projects

**Projects** organise workspaces into logical groups:

```
HCP Terraform organisation
├── Project: Production
│   ├── Workspace: prod-networking
│   ├── Workspace: prod-compute
│   └── Workspace: prod-database
├── Project: Staging
│   ├── Workspace: staging-networking
│   └── Workspace: staging-compute
└── Project: Development
    └── Workspace: dev-shared
```

Projects enable:
- Role-based access at the project level
- Organised navigation
- Policy sets applied at the project level

### Workspace Tags

Tag workspaces for filtering and organisation:

```
Workspace: prod-networking
Tags: environment:prod, region:us-east-1, team:platform
```

---

## Run Triggers (Chaining Workspaces)

When workspace A's apply should trigger workspace B's plan:

```
Workspace B Settings → Run Triggers → Add Workspace → Select Workspace A

Now:
Workspace A apply completes → Workspace B plan starts automatically
```

Use case: networking workspace applies → compute workspace re-plans to pick up new subnet IDs.

---

## Audit Logging

Every action in HCP Terraform is logged:

- Who triggered a run
- Who approved an apply
- When variables were changed
- Who accessed state

Access: Organisation Settings → Audit Trail (Plus/Enterprise tier)

---

## HCP Terraform API

Everything in the UI can be automated via the API:

```bash
# List workspaces
curl \
  -H "Authorization: Bearer $TF_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  https://app.terraform.io/api/v2/organizations/MY-ORG/workspaces

# Trigger a run
curl \
  -H "Authorization: Bearer $TF_TOKEN" \
  -H "Content-Type: application/vnd.api+json" \
  --data '{"data":{"attributes":{"message":"Triggered from CI"},"type":"runs","relationships":{"workspace":{"data":{"type":"workspaces","id":"ws-abc123"}}}}}' \
  https://app.terraform.io/api/v2/runs
```

---

## Private Module Registry

Publish modules to your organisation's private registry:

1. Connect a VCS repository with your module
2. Tag a release (e.g., `v1.2.0`)
3. HCP Terraform publishes it automatically

```hcl
# Use your private module
module "network" {
  source  = "app.terraform.io/MY-ORG/network/aws"
  version = "~> 1.0"
}
```

Module naming convention for private registry:
```
terraform-{provider}-{module-name}
e.g., terraform-aws-network, terraform-aws-eks-cluster
```

---

## Sentinel Policy Enforcement

Policies gate applies. Policy sets can be applied to:
- Individual workspaces
- All workspaces in a project
- All workspaces in the organisation

```
Organisation/Project Settings → Policy Sets → Attach
```

Policy enforcement levels:
- **Advisory** — warn but allow apply
- **Soft mandatory** — block unless an organisation owner overrides
- **Hard mandatory** — always block (cannot be overridden)

---

## Hands-On: Workspace-to-Workspace Run Trigger

In the HCP Terraform UI:
1. Create two workspaces: `network` and `compute`
2. In `compute` workspace → Run Triggers → Add `network`
3. Apply something in `network`
4. Watch `compute` automatically plan

---

## Exam Tips

- HCP Terraform runs go through: Pending → Planning → Needs Confirmation → Applying → Applied.
- **Variable Sets** apply variables to multiple workspaces at once — great for credentials.
- **Drift Detection** periodically checks real-world state vs. Terraform state.
- **Run Triggers** chain workspace applies — upstream applies trigger downstream plans.
- **Projects** organise workspaces and enable project-level access control.
- **Private Module Registry** hosts internal modules accessible across the organisation.
- Auto-apply = no human confirmation required (use cautiously on production).
- Three execution modes: Remote (cloud runners), Local (local machine + remote state), Agent (self-hosted).

---

## Further Reading

| Resource | URL |
|---|---|
| HCP Terraform Workspaces | https://developer.hashicorp.com/terraform/cloud-docs/workspaces |
| Variable Sets | https://developer.hashicorp.com/terraform/cloud-docs/workspaces/variables/managing-variables#variable-sets |
| Drift Detection | https://developer.hashicorp.com/terraform/cloud-docs/workspaces/health |
| Run Triggers | https://developer.hashicorp.com/terraform/cloud-docs/workspaces/settings/run-triggers |
| Private Registry | https://developer.hashicorp.com/terraform/cloud-docs/registry |
| Sentinel | https://developer.hashicorp.com/terraform/cloud-docs/policy-enforcement |
| HCP Terraform API | https://developer.hashicorp.com/terraform/cloud-docs/api-docs |

---

*Next: [23 — Cleanup](./23-cleanup.md)*
