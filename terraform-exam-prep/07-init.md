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
