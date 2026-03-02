# 07 — Init

> **Exam objective:** Initialise a Terraform working directory and understand what `terraform init` does.

---

## What `terraform init` Does

`terraform init` is **always the first command** you run in a new or cloned Terraform working directory. It prepares the directory for use by:

1. **Installing providers** declared in `required_providers`
2. **Installing modules** referenced in the configuration
3. **Configuring the backend** (where state is stored)
4. **Validating** the configuration syntax (basic)

Think of it like `npm install` for Node or `go mod download` for Go — it resolves and downloads dependencies.

---

## Backend 101

A **Terraform backend** is the mechanism Terraform uses to:

1. Store state (`terraform.tfstate`)
2. Read/write that state during plan/apply
3. Coordinate locking (for backends that support it)

If providers are "how Terraform talks to cloud APIs", backend is "where Terraform remembers reality."

### Why It Matters

- Terraform decisions come from comparing **config** vs **state** vs **real world**.
- If state is wrong, lost, or concurrently modified, your plans can be wrong.
- In teams, backend choice determines whether collaboration is safe.

### Local vs Remote Backends (Quick View)

| Backend Type | Where state lives | Team-safe | Locking |
|---|---|---|---|
| Local (`backend "local"` or implicit default) | On your machine (`terraform.tfstate`) | No | No |
| Remote (S3, HCP Terraform, etc.) | Shared remote system | Yes | Usually yes |

### Minimal Examples

```hcl
# Local backend (default)
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
```

```hcl
# Remote backend example (S3)
terraform {
  backend "s3" {
    bucket = "my-terraform-state"
    key    = "prod/network/terraform.tfstate"
    region = "us-east-1"
  }
}
```

> **Rule of thumb:** Local backend is fine for learning. For shared/team environments, use a remote backend from day one.

---

## What Gets Created

After `terraform init`:

```
your-project/
├── main.tf
├── variables.tf
├── outputs.tf
├── .terraform/                     ← created by init
│   ├── providers/
│   │   └── registry.terraform.io/
│   │       └── hashicorp/aws/5.31.0/linux_amd64/
│   │           └── terraform-provider-aws_v5.31.0_x5
│   └── modules/
│       └── vpc/                    ← downloaded module
└── .terraform.lock.hcl             ← created/updated by init
```

> **Important:** The `.terraform/` directory should be in `.gitignore`. The `.terraform.lock.hcl` file **should** be committed.

---

## Hands-On: A Backend + Provider Init

```hcl
# main.tf
terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Local backend (default — no config needed)
  # backend "s3" { ... }  ← we'll see remote backends in module 21
}

provider "aws" {
  region = "us-east-1"
}
```

```bash
# First init
terraform init

# Output:
# Initializing the backend...
# Initializing provider plugins...
# - Finding hashicorp/aws versions matching "~> 5.0"...
# - Installing hashicorp/aws v5.31.0...
# - Installed hashicorp/aws v5.31.0 (signed by HashiCorp)
#
# Terraform has created a lock file .terraform.lock.hcl
# Terraform has been successfully initialized!
```

---

## Init Flags You Should Know

| Flag | Effect |
|---|---|
| `-upgrade` | Update providers to the latest version allowed by constraints |
| `-reconfigure` | Reconfigure the backend, ignoring any existing saved state |
| `-migrate-state` | Attempt to migrate state when backend changes |
| `-backend=false` | Skip backend initialisation |
| `-backend-config=<file>` | Partial backend configuration from a separate file |
| `-get=false` | Skip module installation |
| `-plugin-dir=<path>` | Use providers from a specific directory (no download) |

### Upgrading Providers

```bash
# After changing version constraints, upgrade to new allowed versions
terraform init -upgrade
```

### Reconfiguring the Backend

```bash
# After changing backend configuration (e.g., changing S3 bucket)
terraform init -reconfigure
```

---

## The Lock File in Detail

`.terraform.lock.hcl` records the **exact versions and checksums** of providers:

```hcl
# .terraform.lock.hcl
provider "registry.terraform.io/hashicorp/aws" {
  version     = "5.31.0"
  constraints = "~> 5.0"
  hashes = [
    "h1:abc123...",
    "zh:def456...",
  ]
}
```

**Why this matters:**
- Ensures everyone on the team (and CI) uses the exact same provider binary
- Protects against supply-chain attacks (checksum verification)
- Should be committed to version control — treat it like `package-lock.json`

To update the lock file after changing version constraints:
```bash
terraform init -upgrade
```

---

## Backend Configuration

The **backend** defines where Terraform stores state. By default, it uses the **local** backend (a `terraform.tfstate` file in the working directory).

```hcl
# Default — local backend (implicit, no config needed)
terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}

# S3 backend example (for teams)
terraform {
  backend "s3" {
    bucket         = "my-terraform-state"
    key            = "prod/network/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

> **Best Practice:** Use remote state from day one, even on solo projects. The local backend is fine for learning, but should never be used in team/production environments.

### Partial Backend Configuration

For security, you can omit sensitive values from your `.tf` files and pass them at init time:

```hcl
# main.tf — partial config
terraform {
  backend "s3" {
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
    # bucket and dynamodb_table provided via -backend-config
  }
}
```

```bash
# Pass the rest at init time
terraform init \
  -backend-config="bucket=my-secret-state-bucket" \
  -backend-config="dynamodb_table=my-lock-table"
```

Or via a separate file:
```hcl
# backend.hcl (don't commit this if it has secrets)
bucket         = "my-terraform-state"
dynamodb_table = "terraform-state-lock"
```

```bash
terraform init -backend-config=backend.hcl
```

---

## Module Downloads

If your configuration references modules, `init` downloads them too:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}
```

After `terraform init`, the module is cached in `.terraform/modules/`.

---

## Modules vs Providers vs Provider Binaries

This is one of the most common points of confusion.

### Quick Definitions

- **Module**: Terraform configuration code (`.tf` files) that groups resources into a reusable unit.
- **Provider**: Terraform plugin interface for an API/service (AWS, Azure, Kubernetes, GitHub, etc.).
- **Provider binary**: The compiled executable file Terraform downloads and runs for a provider.

### Mental Model

Think of it like this:

- A **module** is your recipe.
- A **provider** is the appliance type the recipe needs (oven, blender).
- A **provider binary** is the actual installed appliance on disk.

### Where Each Lives

```text
your-project/
├── main.tf
├── modules/                        # optional local module source code
│   └── networking/
│       └── main.tf
└── .terraform/                     # created by init
    ├── modules/                    # downloaded/cached module source code
    │   └── vpc/
    └── providers/                  # downloaded provider binaries
        └── registry.terraform.io/hashicorp/aws/5.x.x/.../terraform-provider-aws_*
```

### Execution Flow During `init`

```text
Read .tf config
   ├─ find module blocks      -> download/cache module source code
   ├─ find required_providers -> resolve versions
   └─ download provider binaries + write .terraform.lock.hcl
```

### Key Difference in Practice

| Thing | Purpose | Downloaded by `init` | Version pinning |
|---|---|---|---|
| Module | Reusable Terraform code | Yes (`.terraform/modules`) | In `module` block (`version` if registry module) |
| Provider | API integration plugin type | Yes (as binary) | Constraints in `required_providers` |
| Provider binary | Actual executable plugin file | Yes (`.terraform/providers`) | Exact version + checksum in `.terraform.lock.hcl` |

### Important Exam Detail

`.terraform.lock.hcl` locks **provider binaries**, not module versions.

So this is true:
- provider exact versions/checksums are locked in lock file.
- module version selection is controlled in `module` blocks (or git/local source refs), not lock file.

### Example: Both Together

```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "network" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
}
```

In this example:
- `module "network"` downloads Terraform code for the VPC module.
- `required_providers.aws` downloads the AWS provider binary Terraform executes.
- The lock file pins the AWS provider binary, not the module.

---

## Exam Tips

- `terraform init` must be run **before** any other commands (plan, apply, etc.).
- It's safe to run `init` multiple times — it's idempotent.
- `-upgrade` updates providers within constraints; without it, init uses the locked version.
- The lock file (`.terraform.lock.hcl`) pins **provider** versions, NOT module versions.
- Changing the backend config requires `-reconfigure` or `-migrate-state`.
- `terraform init` does NOT require cloud credentials (unless your backend does).

---

## Further Reading

| Resource | URL |
|---|---|
| `terraform init` | https://developer.hashicorp.com/terraform/cli/commands/init |
| Backend Configuration | https://developer.hashicorp.com/terraform/language/settings/backends/configuration |
| Dependency Lock File | https://developer.hashicorp.com/terraform/language/files/dependency-lock |
| Remote State (S3) | https://developer.hashicorp.com/terraform/language/settings/backends/s3 |

---

*Next: [08 — Plan and Apply](./08-plan-and-apply.md)*
