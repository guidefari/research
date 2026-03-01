# 18 — Modules

> **Exam objective:** Understand Terraform modules — creating them, using them, sourcing from the registry, and managing versions.

---

## What Is a Module?

A **module** is a container for multiple resources that are used together. Every Terraform configuration is technically a module — the **root module**. When you call another module from your root, that's a **child module**.

Modules enable:
- **Reuse** — write once, use many times
- **Abstraction** — hide complexity behind a simple interface
- **Consistency** — enforce standards across teams
- **Composition** — assemble complex infrastructure from building blocks

---

## Module Structure

A module is just a directory with `.tf` files:

```
modules/
└── webserver/            ← a module
    ├── main.tf           # Resources
    ├── variables.tf      # Inputs (the module's interface)
    ├── outputs.tf        # Outputs (what the module returns)
    ├── versions.tf       # Provider requirements
    └── README.md         # Documentation (highly recommended)
```

### Module `variables.tf` — The Interface

```hcl
# modules/webserver/variables.tf
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "ami_id" {
  description = "AMI ID for the web server"
  type        = string
}

variable "subnet_id" {
  description = "Subnet to deploy the instance in"
  type        = string
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "tags" {
  description = "Tags to apply to the instance"
  type        = map(string)
  default     = {}
}
```

### Module `main.tf` — The Resources

```hcl
# modules/webserver/main.tf
resource "aws_instance" "this" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = var.subnet_id
  vpc_security_group_ids = var.security_group_ids

  tags = merge(var.tags, { Name = "${var.tags["Project"]}-web" })

  lifecycle {
    create_before_destroy = true
  }
}
```

### Module `outputs.tf`

```hcl
# modules/webserver/outputs.tf
output "instance_id" {
  description = "ID of the web server instance"
  value       = aws_instance.this.id
}

output "public_ip" {
  description = "Public IP of the web server"
  value       = aws_instance.this.public_ip
}
```

---

## Calling a Module

Use a `module` block in the root configuration:

```hcl
# root main.tf
module "webserver" {
  source = "./modules/webserver"   # local path

  ami_id             = data.aws_ami.ubuntu.id
  subnet_id          = module.network.public_subnet_ids[0]
  security_group_ids = [aws_security_group.web.id]
  instance_type      = "t3.small"
  tags               = local.common_tags
}

# Use the module's outputs
output "web_ip" {
  value = module.webserver.public_ip
}
```

After adding or changing a module source, run:
```bash
terraform init   # downloads/updates the module
```

---

## Module Sources

Modules can come from many sources:

### Local Paths
```hcl
module "network" {
  source = "./modules/network"    # relative path
}
module "shared" {
  source = "../shared/modules/security"  # parent directory
}
```

### Terraform Registry (Public)
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b", "us-east-1c"]
  # ...
}
```

### GitHub / GitLab
```hcl
module "example" {
  source = "github.com/myorg/terraform-modules//network"
  # Double slash // separates repo from subdirectory
}

module "versioned" {
  source = "git::https://github.com/myorg/terraform-modules.git//network?ref=v1.2.0"
}
```

### HCP Terraform Private Registry
```hcl
module "private" {
  source  = "app.terraform.io/myorg/network/aws"
  version = "~> 1.0"
}
```

---

## Module Versioning

Always pin module versions:

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"   # allow 5.x patch/minor updates
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "= 20.0.0"  # pin exactly
}
```

> **Best Practice:** Always specify a `version` for registry modules. For local modules, use git tags via the `ref` parameter.

---

## Module Count and For_Each

Modules support `count` and `for_each` like resources:

```hcl
# Create the same module multiple times
module "webserver" {
  count  = 3
  source = "./modules/webserver"
  index  = count.index
  # ...
}

# Create one module per environment
module "environment" {
  for_each = toset(["dev", "staging", "prod"])
  source   = "./modules/environment"
  name     = each.key
  # ...
}

# Reference outputs from for_each modules
output "env_vpcs" {
  value = { for k, v in module.environment : k => v.vpc_id }
}
```

---

## Hands-On: Build and Use a Local Module

**Step 1: Create the module**

```bash
mkdir -p local-module-demo/modules/greeter
```

```hcl
# modules/greeter/variables.tf
variable "names" {
  description = "List of names to greet"
  type        = list(string)
}

variable "greeting" {
  description = "Greeting word"
  type        = string
  default     = "Hello"
}

variable "output_dir" {
  description = "Directory to write greeting files"
  type        = string
}
```

```hcl
# modules/greeter/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}

resource "local_file" "greeting" {
  for_each = toset(var.names)
  filename = "${var.output_dir}/greeting-${each.key}.txt"
  content  = "${var.greeting}, ${each.key}!\n"
}
```

```hcl
# modules/greeter/outputs.tf
output "file_paths" {
  description = "Paths of generated greeting files"
  value       = [for f in local_file.greeting : f.filename]
}
```

**Step 2: Call the module**

```hcl
# local-module-demo/main.tf
terraform {
  required_providers {
    local = { source = "hashicorp/local", version = "~> 2.4" }
  }
}

module "english_greeter" {
  source     = "./modules/greeter"
  names      = ["Alice", "Bob"]
  greeting   = "Hello"
  output_dir = path.module
}

module "spanish_greeter" {
  source     = "./modules/greeter"
  names      = ["Carlos", "Maria"]
  greeting   = "Hola"
  output_dir = path.module
}

output "all_files" {
  value = concat(
    module.english_greeter.file_paths,
    module.spanish_greeter.file_paths
  )
}
```

```bash
cd local-module-demo
terraform init
terraform apply
```

---

## The Public Registry

Browse community modules at https://registry.terraform.io/browse/modules

Popular verified modules:
- `terraform-aws-modules/vpc/aws` — VPC setup
- `terraform-aws-modules/eks/aws` — EKS cluster
- `terraform-aws-modules/rds/aws` — RDS instances
- `terraform-google-modules/network/google` — GCP networking

---

## Exam Tips

- `module "name" { source = "..." }` is how you call a module.
- After adding a module, always run `terraform init`.
- Module outputs are accessed as `module.<name>.<output_name>`.
- `version` is required for registry modules; use it for local modules via git refs.
- Modules support `count` and `for_each`.
- The root module is your working directory — everything else is a child module.
- Module sources: local path, Terraform Registry, GitHub/GitLab, HCP Terraform registry.
- The double slash `//` in git URLs separates the repo URL from the subdirectory.

---

## Further Reading

| Resource | URL |
|---|---|
| Modules Overview | https://developer.hashicorp.com/terraform/language/modules |
| Module Sources | https://developer.hashicorp.com/terraform/language/modules/sources |
| Terraform Registry Modules | https://registry.terraform.io/browse/modules |
| Module Composition | https://developer.hashicorp.com/terraform/language/modules/develop/composition |
| Best Practices - Modules | https://www.terraform-best-practices.com/key-concepts |

---

*Next: [19 — Best Practices](./19-best-practices.md)*
