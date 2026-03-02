# 03 — Install

> **Exam objective:** Install and verify the Terraform CLI.

---

## Installation Methods

### Option A — Official Package Managers (Recommended)

**macOS (Homebrew)**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Ubuntu / Debian**
```bash
wget -O- https://apt.releases.hashicorp.com/gpg | \
  sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] \
  https://apt.releases.hashicorp.com $(lsb_release -cs) main" | \
  sudo tee /etc/apt/sources.list.d/hashicorp.list

sudo apt update && sudo apt install terraform
```

**RHEL / Amazon Linux**
```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/RHEL/hashicorp.repo
sudo yum install terraform
```

**Windows (Chocolatey)**
```powershell
choco install terraform
```

**Windows (winget)**
```powershell
winget install Hashicorp.Terraform
```

### Option B — Manual Binary Download

1. Go to https://developer.hashicorp.com/terraform/downloads
2. Download the zip for your OS/architecture
3. Unzip and move the binary to a directory in your `$PATH`

```bash
# Linux/macOS example
unzip terraform_*.zip
sudo mv terraform /usr/local/bin/
```

### Option C — tfenv (Version Manager — Recommended for Teams)

`tfenv` lets you install and switch between multiple Terraform versions — essential when working on projects with different version requirements.

```bash
# macOS
brew install tfenv

# Linux
git clone --depth=1 https://github.com/tfutils/tfenv.git ~/.tfenv
echo 'export PATH="$HOME/.tfenv/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Install a specific version
tfenv install 1.7.0
tfenv use 1.7.0

# Install the version specified in .terraform-version file
tfenv install

# List installed versions
tfenv list
```

> **Best Practice:** Pin your Terraform version in a `.terraform-version` file at the root of each project. This ensures everyone on the team (and your CI pipeline) uses the same version.

```bash
# .terraform-version
1.7.0
```

---

## Verify Your Installation

```bash
terraform version
```

Expected output:
```
Terraform v1.7.0
on linux_amd64
```

```bash
# Enable shell autocompletion (bash)
terraform -install-autocomplete

# Restart your shell, then tab-complete terraform commands
terraform <TAB>
```

---

## Version Constraints — What You Need to Know

In your configuration, you can require a minimum Terraform version:

```hcl
terraform {
  required_version = ">= 1.5.0"
}
```

| Constraint | Meaning |
|---|---|
| `= 1.5.0` | Exactly this version |
| `>= 1.5.0` | This version or newer |
| `~> 1.5` | 1.5.x (patch updates only) |
| `~> 1.5.0` | >= 1.5.0, < 1.6.0 |
| `>= 1.5.0, < 2.0.0` | Explicit range |

> **Exam tip:** Terraform uses [Semantic Versioning](https://semver.org). The `~>` operator is called the "pessimistic constraint operator."

---

## Directory Structure After Install

After installing, Terraform stores user-level data in:

| Path | Contents |
|---|---|
| `~/.terraform.d/` | Credentials, plugin cache |
| `~/.terraform.d/plugins/` | Optional global plugin cache |
| `~/.terraformrc` (Linux/Mac) | CLI configuration file |
| `%APPDATA%\terraform.rc` (Windows) | CLI configuration file |

---

## Hands-On: Your First Sanity Check

```bash
# 1. Confirm version
terraform version

# 2. See all available commands
terraform --help

# 3. See help for a specific command
terraform plan --help

# 4. (Optional) Set up autocomplete
terraform -install-autocomplete
```

---

## Exam Tips

- Terraform is distributed as a **single binary** — no runtime dependencies.
- You can have **multiple versions** installed via tfenv.
- The `required_version` constraint in `terraform {}` block enforces the version at plan/apply time.
- `terraform -install-autocomplete` sets up tab completion for bash and zsh.

---

## Further Reading

| Resource | URL |
|---|---|
| Install Terraform | https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli |
| Terraform Downloads | https://developer.hashicorp.com/terraform/downloads |
| tfenv | https://github.com/tfutils/tfenv |
| Version Constraints | https://developer.hashicorp.com/terraform/language/expressions/version-constraints |

---

*Next: [04 — Up and Running](./04-up-and-running.md)*
