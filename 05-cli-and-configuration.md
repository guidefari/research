# 05 — CLI and Configuration

> **Exam objective:** Know the Terraform CLI commands and how to configure the CLI behaviour.

---

## The Terraform CLI

The `terraform` binary is your primary interface. All commands follow the pattern:

```
terraform [global options] <command> [command options] [args]
```

---

## Essential Commands Reference

### Initialisation & Setup

| Command | What It Does |
|---|---|
| `terraform init` | Initialise working directory; download providers/modules |
| `terraform init -upgrade` | Upgrade providers to latest allowed version |
| `terraform init -backend=false` | Skip backend initialisation |
| `terraform init -reconfigure` | Reconfigure backend (useful after changing backend config) |

### Planning & Applying

| Command | What It Does |
|---|---|
| `terraform plan` | Show what will change |
| `terraform plan -out=plan.tfplan` | Save plan to a file |
| `terraform plan -destroy` | Preview a destroy |
| `terraform apply` | Apply changes (prompts for confirmation) |
| `terraform apply -auto-approve` | Apply without confirmation prompt |
| `terraform apply plan.tfplan` | Apply a saved plan file |
| `terraform destroy` | Destroy all managed resources |
| `terraform destroy -target=resource_type.name` | Destroy a specific resource |

### State Management

| Command | What It Does |
|---|---|
| `terraform show` | Human-readable view of state or plan |
| `terraform show plan.tfplan` | Show a saved plan |
| `terraform state list` | List all resources in state |
| `terraform state show <resource>` | Show attributes of a resource in state |
| `terraform state mv <src> <dst>` | Move a resource in state (rename without destroy) |
| `terraform state rm <resource>` | Remove resource from state (without destroying it) |
| `terraform state pull` | Print current state to stdout |
| `terraform state push` | Push state to the backend |

### Inspection & Validation

| Command | What It Does |
|---|---|
| `terraform validate` | Check configuration syntax and logic |
| `terraform fmt` | Format HCL files to canonical style |
| `terraform fmt -check` | Check formatting without modifying (for CI) |
| `terraform fmt -recursive` | Format all .tf files recursively |
| `terraform graph` | Output dependency graph in DOT format |
| `terraform output` | Show outputs from state |
| `terraform output -json` | Show outputs as JSON |
| `terraform providers` | Show providers required in configuration |
| `terraform version` | Show Terraform version |

### Import & Refresh

| Command | What It Does |
|---|---|
| `terraform import <resource> <id>` | Import existing infrastructure into state |
| `terraform refresh` | Sync state with real-world infrastructure (deprecated, use `apply -refresh-only`) |
| `terraform apply -refresh-only` | Refresh state without making changes |

### Workspace Commands

| Command | What It Does |
|---|---|
| `terraform workspace list` | List workspaces |
| `terraform workspace new <name>` | Create a new workspace |
| `terraform workspace select <name>` | Switch to a workspace |
| `terraform workspace show` | Show current workspace |
| `terraform workspace delete <name>` | Delete a workspace |

---

## Targeting Specific Resources

Use `-target` to operate on a subset of resources:

```bash
# Plan only one resource
terraform plan -target=aws_instance.web

# Apply only a module
terraform apply -target=module.database

# Destroy a single resource
terraform destroy -target=aws_s3_bucket.logs
```

> **Warning:** `-target` is a temporary escape hatch for unusual situations. Relying on it regularly indicates a structural problem with your configuration.

---

## CLI Configuration File

The CLI configuration file controls Terraform's own behaviour (not your infrastructure).

| OS | Location |
|---|---|
| Linux / macOS | `~/.terraformrc` |
| Windows | `%APPDATA%\terraform.rc` |

You can override the path with `TF_CLI_CONFIG_FILE` environment variable.

### Example `~/.terraformrc`

```hcl
# ~/.terraformrc

# Use a local plugin cache — avoids re-downloading providers
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"

# Disable version checkpoint (phone-home)
disable_checkpoint = true

# Credentials for HCP Terraform or private registries
credentials "app.terraform.io" {
  token = "your-hcp-terraform-token"
}
```

### Plugin Cache

Set up a shared plugin cache to avoid downloading the same provider binary in every project:

```bash
mkdir -p ~/.terraform.d/plugin-cache
```

```hcl
# ~/.terraformrc
plugin_cache_dir = "$HOME/.terraform.d/plugin-cache"
```

> **Best Practice:** Use a plugin cache in CI environments to speed up pipelines and reduce registry load.

---

## Environment Variables

Terraform respects several environment variables that override CLI config or provider settings:

| Variable | Effect |
|---|---|
| `TF_LOG` | Enable logging: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR` |
| `TF_LOG_PATH` | Write logs to this file path |
| `TF_INPUT` | Set to `0` to disable interactive input (useful in CI) |
| `TF_VAR_<name>` | Set an input variable value (e.g., `TF_VAR_region=us-east-1`) |
| `TF_CLI_ARGS` | Default CLI arguments for all commands |
| `TF_CLI_ARGS_plan` | Default arguments for `terraform plan` |
| `TF_DATA_DIR` | Override `.terraform` directory location |
| `TF_WORKSPACE` | Select a workspace |
| `TF_IN_AUTOMATION` | Adjusts output for CI — reduces noise |

### Enabling Debug Logging

```bash
# Log to terminal
export TF_LOG=DEBUG
terraform apply

# Log to a file
export TF_LOG=TRACE
export TF_LOG_PATH=./terraform.log
terraform apply
```

---

## Hands-On: CLI Exploration

```bash
# 1. See all available commands
terraform --help

# 2. See detailed help for a subcommand
terraform state --help
terraform state list --help

# 3. Validate your config (no cloud calls)
terraform validate

# 4. Format your files
terraform fmt -recursive

# 5. Try verbose logging
TF_LOG=DEBUG terraform validate
```

---

## Exam Tips

- Know the difference between `terraform refresh` (deprecated) and `terraform apply -refresh-only`.
- `terraform fmt` uses **2-space indentation** and aligns `=` signs.
- `TF_LOG=TRACE` gives the most verbose output — useful for debugging provider issues.
- `TF_IN_AUTOMATION=true` suppresses the "Did you know?" messages in CI.
- The CLI config file (`~/.terraformrc`) is different from your infrastructure `.tf` files.
- `-target` is a break-glass tool — the exam knows this.

---

## Further Reading

| Resource | URL |
|---|---|
| Terraform CLI Commands | https://developer.hashicorp.com/terraform/cli/commands |
| CLI Configuration | https://developer.hashicorp.com/terraform/cli/config/config-file |
| Environment Variables | https://developer.hashicorp.com/terraform/cli/config/environment-variables |
| Debugging Terraform | https://developer.hashicorp.com/terraform/internals/debugging |

---

*Next: [06 — Terraform Lifecycle](./06-terraform-lifecycle.md)*
