# 04 — Up and Running

> **Exam objective:** Write a basic Terraform configuration and run the core workflow end-to-end.

---

## Your First Terraform Configuration

We'll use the **`local` provider** so you don't need any cloud credentials — this is purely to learn the workflow.

### Step 1 — Create a Working Directory

```bash
mkdir terraform-hello && cd terraform-hello
```

### Step 2 — Write Your Configuration

Create a file called `main.tf`:

```hcl
# main.tf

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

# Create a local file on your machine
resource "local_file" "hello" {
  content  = "Hello, Terraform!"
  filename = "${path.module}/hello.txt"
}
```

**What each part does:**

| Block | Purpose |
|---|---|
| `terraform {}` | Global settings — version requirements, backend |
| `required_providers` | Declares which providers are needed and their versions |
| `resource "local_file" "hello"` | A single managed resource. Type: `local_file`. Name: `hello` |
| `content` | The file content |
| `filename` | Where to write the file; `path.module` = directory of this .tf file |

---

### Step 3 — Initialize

```bash
terraform init
```

Terraform will:
1. Download the `hashicorp/local` provider plugin
2. Create a `.terraform/` directory
3. Create (or update) `.terraform.lock.hcl`

Expected output:
```
Initializing the backend...
Initializing provider plugins...
- Finding hashicorp/local versions matching "~> 2.4"...
- Installing hashicorp/local v2.4.0...

Terraform has been successfully initialized!
```

---

### Step 4 — Plan

```bash
terraform plan
```

Terraform compares your configuration against the real world (currently: nothing exists) and shows you what it *will* do:

```
Terraform will perform the following actions:

  # local_file.hello will be created
  + resource "local_file" "hello" {
      + content              = "Hello, Terraform!"
      + directory_permission = "0777"
      + file_permission      = "0777"
      + filename             = "./hello.txt"
      + id                   = (known after apply)
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

The `+` sign means "will be created". You haven't changed anything in the real world yet.

---

### Step 5 — Apply

```bash
terraform apply
```

Terraform shows the plan again, then prompts you to confirm:

```
Do you want to perform these actions?
  Terraform will perform the actions described above.
  Only 'yes' will be accepted to approve.

  Enter a value: yes
```

Type `yes` and press Enter.

```
local_file.hello: Creating...
local_file.hello: Creation complete after 0s [id=abc123...]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

Verify it worked:
```bash
cat hello.txt
# Hello, Terraform!
```

---

### Step 6 — Inspect State

```bash
terraform show
```

This shows you what Terraform tracks in its state file (`terraform.tfstate`).

```bash
# List all resources in state
terraform state list
# local_file.hello

# Show a specific resource
terraform state show local_file.hello
```

---

### Step 7 — Apply Again (Idempotency)

Run `terraform apply` a second time:

```bash
terraform apply
# Apply complete! Resources: 0 added, 0 changed, 0 destroyed.
```

Nothing changed — Terraform detected that the real world already matches your config. This is **idempotency** in action.

---

### Step 8 — Modify a Resource

Edit `main.tf` — change the `content`:

```hcl
resource "local_file" "hello" {
  content  = "Hello, Terraform! (updated)"
  filename = "${path.module}/hello.txt"
}
```

```bash
terraform plan
```

You'll see:
```
  # local_file.hello must be replaced
-/+ resource "local_file" "hello" {
      ~ content = "Hello, Terraform!" -> "Hello, Terraform! (updated)"
      ...
    }

Plan: 1 to add, 0 to change, 1 to destroy.
```

`-/+` means destroy and recreate (replace). Apply it:

```bash
terraform apply
```

---

### Step 9 — Destroy

```bash
terraform destroy
```

Terraform removes all resources it manages:

```
Destroy complete! Resources: 0 destroyed.
```

---

## What Just Happened — The Files

| File | Purpose | Commit to git? |
|---|---|---|
| `main.tf` | Your configuration | **Yes** |
| `.terraform/` | Downloaded providers/modules | **No** (add to .gitignore) |
| `.terraform.lock.hcl` | Provider version lock file | **Yes** |
| `terraform.tfstate` | Current state of managed resources | **No** (use remote state in teams) |
| `terraform.tfstate.backup` | Previous state backup | **No** |

Create a `.gitignore`:

```
# .gitignore
.terraform/
*.tfstate
*.tfstate.backup
*.tfvars       # may contain secrets
crash.log
override.tf
```

---

## Exam Tips

- The core workflow is: `init` → `plan` → `apply`.
- `terraform apply` always runs a plan first — you can skip the prompt with `-auto-approve` (avoid in production).
- Running `apply` on unchanged infra makes **no changes** (idempotency).
- `terraform.tfstate` is **sensitive** — it can contain secrets; never commit it to public repos.
- `.terraform.lock.hcl` **should** be committed to version control.

---

## Further Reading

| Resource | URL |
|---|---|
| Get Started with Terraform (AWS) | https://developer.hashicorp.com/terraform/tutorials/aws-get-started |
| Local Provider | https://registry.terraform.io/providers/hashicorp/local/latest/docs |
| Terraform Language Basics | https://developer.hashicorp.com/terraform/language |
| .gitignore for Terraform | https://github.com/github/gitignore/blob/main/Terraform.gitignore |

---

*Next: [05 — CLI and Configuration](./05-cli-and-configuration.md)*
