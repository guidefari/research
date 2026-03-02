# 14 — Input Variables

> **Exam objective:** Declare, use, and supply input variables. Understand variable types, validation, and sensitivity.

---

## What Are Input Variables?

Input variables are **parameters** for your Terraform module. They allow the same configuration to be reused with different values — like function arguments in a programming language.

```hcl
# Without variables (hardcoded — bad)
resource "aws_instance" "web" {
  instance_type = "t3.micro"
  ami           = "ami-0c55b159cbfafe1f0"
}

# With variables (flexible — good)
resource "aws_instance" "web" {
  instance_type = var.instance_type
  ami           = var.ami_id
}
```

---

## Declaring Variables

Variables are declared with a `variable` block:

```hcl
# variables.tf

variable "instance_type" {
  description = "EC2 instance type for the web server"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID to use for the EC2 instance"
  type        = string
  # No default — must be provided
}

variable "instance_count" {
  description = "Number of instances to create"
  type        = number
  default     = 1
}

variable "enable_monitoring" {
  description = "Whether to enable detailed monitoring"
  type        = bool
  default     = false
}
```

> **Best Practice:** Always include a `description`. The `description → type → default → validation` order is the convention from terraform-best-practices.com.

---

## Variable Types

### Primitive Types

```hcl
variable "name" {
  type    = string
  default = "my-app"
}

variable "port" {
  type    = number
  default = 8080
}

variable "debug_mode" {
  type    = bool
  default = false
}
```

### Collection Types

```hcl
# List (ordered, same type)
variable "availability_zones" {
  description = "List of AZs to deploy into"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# Map (key-value pairs, same value type)
variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Team        = "platform"
  }
}

# Set (unordered, unique values)
variable "allowed_ips" {
  type    = set(string)
  default = ["10.0.0.1/32", "10.0.0.2/32"]
}
```

### Structural Types

```hcl
# Object (named attributes, can be different types)
variable "database" {
  description = "Database configuration"
  type = object({
    engine         = string
    instance_class = string
    storage_gb     = number
    multi_az       = bool
  })
  default = {
    engine         = "postgres"
    instance_class = "db.t3.micro"
    storage_gb     = 20
    multi_az       = false
  }
}

# Tuple (ordered list of mixed types)
variable "server_config" {
  type = tuple([string, number, bool])
  default = ["t3.micro", 8080, true]
}

# Any type (no type checking — use sparingly)
variable "flexible" {
  type    = any
  default = null
}
```

---

## Variable Validation

Add custom validation rules with a `validation` block:

```hcl
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = contains(["t3.micro", "t3.small", "t3.medium"], var.instance_type)
    error_message = "instance_type must be one of: t3.micro, t3.small, t3.medium."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string

  validation {
    condition     = can(regex("^(dev|staging|prod)$", var.environment))
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "port" {
  description = "Port number"
  type        = number

  validation {
    condition     = var.port >= 1 && var.port <= 65535
    error_message = "Port must be between 1 and 65535."
  }
}
```

---

## Sensitive Variables

Mark variables that contain secrets:

```hcl
variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true  # value redacted from plan/apply output
}
```

In plan output, sensitive values show as `(sensitive value)`:
```
~ password = (sensitive value)
```

> **Warning:** `sensitive = true` redacts from output but the value IS stored in state (potentially in plaintext). Use remote state with encryption.

---

## Supplying Variable Values

### Priority Order (highest wins)

1. `-var` flag on the command line
2. `-var-file` flag on the command line
3. `*.auto.tfvars` and `*.auto.tfvars.json` files (automatically loaded)
4. `terraform.tfvars.json`
5. `terraform.tfvars`
6. Environment variables (`TF_VAR_<name>`)
7. Default value in the `variable` block
8. Interactive prompt (if none of the above)

### Method 1: Command-Line Flags

```bash
terraform apply -var="instance_type=t3.small" -var="environment=prod"
```

### Method 2: `.tfvars` Files

```hcl
# dev.tfvars
instance_type = "t3.micro"
environment   = "dev"
region        = "us-east-1"
tags = {
  Environment = "dev"
  CostCentre  = "eng-001"
}
```

```bash
terraform apply -var-file="dev.tfvars"
terraform apply -var-file="prod.tfvars"
```

### Method 3: `terraform.tfvars` (Auto-loaded)

```hcl
# terraform.tfvars — loaded automatically by Terraform
instance_type = "t3.micro"
environment   = "dev"
```

### Method 4: Environment Variables

```bash
export TF_VAR_instance_type=t3.small
export TF_VAR_db_password=supersecret
terraform apply
```

> **Best Practice:** Use `.tfvars` files per environment (`dev.tfvars`, `prod.tfvars`). Keep secrets out of `.tfvars` files — use environment variables or a secrets manager instead. Never commit `terraform.tfvars` if it contains secrets.

---

## Referencing Variables

```hcl
resource "aws_instance" "web" {
  ami           = var.ami_id
  instance_type = var.instance_type

  tags = merge(var.tags, {
    Name = "${var.environment}-web"
  })
}
```

### `nullable`

By default, variables can be set to `null`. Disable this with:

```hcl
variable "instance_type" {
  type     = string
  nullable = false  # passing null will error
}
```

---

## Hands-On

```hcl
# vars-demo/variables.tf
variable "greeting" {
  description = "Greeting message"
  type        = string
  default     = "Hello"

  validation {
    condition     = length(var.greeting) > 2
    error_message = "Greeting must be more than 2 characters."
  }
}

variable "names" {
  description = "List of names to greet"
  type        = list(string)
  default     = ["World"]
}

variable "output_dir" {
  description = "Directory to write files to"
  type        = string
  default     = "."
}
```

```hcl
# vars-demo/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}

resource "local_file" "greeting" {
  for_each = toset(var.names)
  filename = "${var.output_dir}/hello-${each.key}.txt"
  content  = "${var.greeting}, ${each.key}!"
}
```

```bash
# Use defaults
terraform apply

# Override with CLI flags
terraform apply -var='names=["Alice","Bob","Carol"]' -var='greeting=Hi'

# Use a tfvars file
cat > custom.tfvars << EOF
greeting = "Howdy"
names    = ["Texas", "Oklahoma"]
EOF
terraform apply -var-file=custom.tfvars
```

---

## Exam Tips

- Variable declaration order: `description` → `type` → `default` → `validation`.
- `sensitive = true` hides values in output but NOT in state.
- `terraform.tfvars` and `*.auto.tfvars` are **automatically** loaded.
- CLI `-var` flags override everything else.
- Environment variables are named `TF_VAR_<variable_name>`.
- `nullable = false` prevents `null` from being passed.
- Know the primitive types: `string`, `number`, `bool`.
- Know the collection types: `list()`, `map()`, `set()`.
- Know the structural types: `object()`, `tuple()`.

---

## Further Reading

| Resource | URL |
|---|---|
| Input Variables | https://developer.hashicorp.com/terraform/language/values/variables |
| Variable Validation | https://developer.hashicorp.com/terraform/language/expressions/custom-conditions#input-variable-validation |
| Sensitive Variables | https://developer.hashicorp.com/terraform/language/values/variables#suppressing-values-in-cli-output |
| Best Practices - Variables | https://www.terraform-best-practices.com/naming |

---

*Next: [15 — Local Values](./15-local-values.md)*
