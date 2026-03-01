# 02 — Core and Plugins

> **Exam objective:** Understand Terraform's architecture — the distinction between Terraform Core and providers (plugins).

---

## Terraform's Two-Layer Architecture

Terraform is split into two distinct layers that communicate over a well-defined protocol:

```
┌─────────────────────────────────────────────┐
│              Terraform Core                  │
│  (HCL parsing, state, dependency graph,      │
│   plan/apply logic, RPC client)              │
└────────────────────┬────────────────────────┘
                     │ gRPC (plugin protocol v6)
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  ┌──────────┐ ┌──────────┐ ┌──────────┐
  │  AWS     │ │  Azure   │ │  random  │
  │ Provider │ │ Provider │ │ Provider │
  └──────────┘ └──────────┘ └──────────┘
     (plugin)     (plugin)     (plugin)
```

---

## Terraform Core

**Terraform Core** is the `terraform` binary you install. It is responsible for:

- Parsing and validating HCL configuration files
- Building the **resource dependency graph**
- Computing the **execution plan** (diff between desired state and actual state)
- Orchestrating `create`, `read`, `update`, `delete` (CRUD) operations *via* providers
- Managing **state** (reading, writing, locking)
- Running `init`, `plan`, `apply`, `destroy`, and all other CLI commands

Core does **not** know anything about AWS, GCP, or any specific cloud. It delegates all real-world API calls to providers.

---

## Providers (Plugins)

A **provider** is a plugin that bridges Terraform Core and a specific API. Each provider:

- Is a separate binary (downloaded by `terraform init`)
- Exposes **resource types** and **data sources** for its API
- Handles authentication with the upstream service
- Performs actual CRUD API calls

```hcl
# You declare which providers you need in terraform block
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Then configure the provider
provider "aws" {
  region = "us-east-1"
}
```

### Provider Tiers

| Tier | Maintained By | Example |
|---|---|---|
| **Official** | HashiCorp | `hashicorp/aws`, `hashicorp/azurerm` |
| **Partner** | Technology partner companies | `datadog/datadog`, `mongodb/mongodbatlas` |
| **Community** | Open-source contributors | Various |

Find all providers at https://registry.terraform.io/browse/providers

---

## How Core and Plugins Communicate

1. `terraform init` downloads the required provider binaries into `.terraform/providers/`
2. During `plan`/`apply`, Core **launches** each provider binary as a subprocess
3. Core and provider communicate over **gRPC** using Terraform's plugin protocol (currently v6)
4. Core sends CRUD requests; the provider translates them into API calls

> **Note:** You never call provider binaries directly — Core manages their entire lifecycle.

---

## Provider Installation Deep Dive

When you run `terraform init`, Terraform:

1. Reads the `required_providers` block in your config
2. Checks the local cache (`~/.terraform.d/plugins/` or `.terraform/providers/`)
3. Downloads missing providers from the **Terraform Registry** (or a custom registry)
4. Verifies the provider binary checksum (stored in `.terraform.lock.hcl`)

```
.terraform/
└── providers/
    └── registry.terraform.io/
        └── hashicorp/
            └── aws/
                └── 5.31.0/
                    └── linux_amd64/
                        └── terraform-provider-aws_v5.31.0_x5
```

### The Lock File

`.terraform.lock.hcl` pins exact provider versions and checksums. **Always commit this file to version control.**

```hcl
# .terraform.lock.hcl (auto-generated — do not edit by hand)
provider "registry.terraform.io/hashicorp/aws" {
  version     = "5.31.0"
  constraints = "~> 5.0"
  hashes = [
    "h1:abcdef...",
  ]
}
```

---

## Built-in Providers vs External Providers

A small number of providers are **built into** Terraform Core and don't need downloading:

- `terraform` provider — exposes `terraform_remote_state` data source
- These are the exception; everything else is an external plugin

---

## Hands-On: Inspect Your Provider

```bash
# After init, see what was downloaded
ls .terraform/providers/registry.terraform.io/hashicorp/

# Check which version was locked
cat .terraform.lock.hcl

# See provider schema (all resources + arguments)
terraform providers schema -json | jq '.provider_schemas | keys'
```

---

## Exam Tips

- Providers are **separate binaries** — not part of the `terraform` binary.
- `terraform init` is what **downloads** providers.
- The `.terraform.lock.hcl` file should be **committed** to version control.
- Provider version constraints use `~>`, `>=`, `=`, etc. — know the difference:
  - `~> 5.0` = allows `5.x`, not `6.0`
  - `>= 4.0, < 6.0` = explicit range
- Official providers are at `registry.terraform.io` — the default registry.

---

## Further Reading

| Resource | URL |
|---|---|
| How Terraform Works | https://developer.hashicorp.com/terraform/intro/how-terraform-works |
| Provider Configuration | https://developer.hashicorp.com/terraform/language/providers/configuration |
| Provider Requirements | https://developer.hashicorp.com/terraform/language/providers/requirements |
| Lock File | https://developer.hashicorp.com/terraform/language/files/dependency-lock |
| Terraform Registry | https://registry.terraform.io/browse/providers |

---

*Next: [03 — Install](./03-install.md)*
