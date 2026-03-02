# 11 — Resource Graph

> **Exam objective:** Understand how Terraform builds and uses the resource dependency graph.

---

## What Is the Resource Graph?

Terraform builds a **directed acyclic graph (DAG)** of all resources in your configuration before doing anything. This graph determines:

1. **Order of operations** — which resources must be created before others
2. **Parallelism opportunities** — resources without dependencies can be created simultaneously
3. **Destroy order** — reverse of create order

The resource graph is central to how Terraform works. Everything — plan, apply, destroy — is a walk of this graph.

---

## How Dependencies Are Established

### Implicit Dependencies (Reference Expressions)

When one resource references an attribute of another, Terraform automatically infers a dependency:

```hcl
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public" {
  # This reference creates an implicit dependency on aws_vpc.main
  vpc_id     = aws_vpc.main.id
  cidr_block = "10.0.1.0/24"
}

resource "aws_instance" "web" {
  subnet_id = aws_subnet.public.id  # depends on subnet
  # ...
}
```

The graph looks like:
```
aws_vpc.main → aws_subnet.public → aws_instance.web
```

Terraform will:
1. Create `aws_vpc.main` first
2. Create `aws_subnet.public` (using `aws_vpc.main.id`)
3. Create `aws_instance.web` (using `aws_subnet.public.id`)

### Explicit Dependencies (`depends_on`)

Sometimes a dependency exists that can't be expressed through attribute references. Use `depends_on` to declare it explicitly:

```hcl
resource "aws_iam_role_policy" "app_policy" {
  role   = aws_iam_role.app.id
  policy = jsonencode({...})
}

resource "aws_instance" "app" {
  ami           = "ami-12345"
  instance_type = "t3.micro"

  # The instance needs the IAM policy to exist before it can launch
  # (it uses the role, but doesn't reference the policy directly)
  depends_on = [aws_iam_role_policy.app_policy]
}
```

> **Warning:** `depends_on` defeats some of Terraform's parallelism optimizations. Use it only when implicit dependencies aren't enough — i.e., when there's a side effect not captured in resource attributes.

---

## Parallelism in the Graph

Terraform exploits the graph to run independent operations **in parallel** (up to 10 by default):

```hcl
# These three have no dependencies on each other
resource "aws_s3_bucket" "logs" { ... }
resource "aws_s3_bucket" "backups" { ... }
resource "aws_sqs_queue" "events" { ... }
```

Terraform creates all three simultaneously:
```
aws_s3_bucket.logs      ┐
aws_s3_bucket.backups   ├── created in parallel
aws_sqs_queue.events    ┘
```

---

## Viewing the Graph

```bash
# Output DOT format
terraform graph

# Render as image (requires Graphviz)
terraform graph | dot -Tsvg > graph.svg
open graph.svg
```

### Graph for Different Phases

```bash
# Graph for the plan phase
terraform graph -type=plan

# Graph for the apply phase
terraform graph -type=apply

# Graph for destroy phase
terraform graph -type=plan-destroy
```

---

## Hands-On: Build a Dependency Chain

```hcl
# graph-demo/main.tf
terraform {
  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Step 1: Generate a random ID
resource "random_id" "app" {
  byte_length = 4
}

# Step 2: Create a config file using the random ID (implicit dependency)
resource "local_file" "app_config" {
  filename = "${path.module}/app-${random_id.app.hex}.conf"
  content  = "app_id = ${random_id.app.hex}\n"
}

# Step 3: Create a metadata file that depends on the config (implicit)
resource "local_file" "metadata" {
  filename = "${path.module}/metadata.txt"
  content  = "Config file: ${local_file.app_config.filename}\n"
}

# Step 4: This one has NO dependency — created in parallel with step 3
resource "local_file" "readme" {
  filename = "${path.module}/README.txt"
  content  = "This project uses random_id: ${random_id.app.hex}\n"
}
```

```bash
cd graph-demo
terraform init
terraform graph | dot -Tsvg > graph.svg

# Inspect — you should see:
# random_id.app → local_file.app_config → local_file.metadata
# random_id.app → local_file.readme (parallel with metadata)
```

---

## The Destroy Graph

Destroy is the **reverse** of the create graph:

```
Create order:  vpc → subnet → instance
Destroy order: instance → subnet → vpc
```

Terraform automatically computes the reverse order. You don't have to worry about ordering in your `terraform destroy` commands.

---

## Graph and Modules

Module boundaries appear in the graph as subgraphs. Resources inside a module depend on the module's inputs being resolved first:

```
module.network.aws_vpc.main → module.network.aws_subnet.public → aws_instance.web
```

---

## Exam Tips

- The resource graph is a **DAG** — directed acyclic graph.
- **Implicit dependencies** come from attribute references (e.g., `vpc_id = aws_vpc.main.id`).
- **Explicit dependencies** use `depends_on = [resource.name]`.
- Independent resources are created **in parallel** (default: 10 at a time).
- Destroy order is the **reverse** of create order.
- `terraform graph` outputs DOT format — visualize with Graphviz.
- Use `depends_on` sparingly — it reduces parallelism and can hide architectural problems.

---

## Further Reading

| Resource | URL |
|---|---|
| Resource Dependencies | https://developer.hashicorp.com/terraform/language/meta-arguments/depends_on |
| `terraform graph` | https://developer.hashicorp.com/terraform/cli/commands/graph |
| Terraform Internals: Graph | https://developer.hashicorp.com/terraform/internals/graph |
| Graphviz | https://graphviz.org |

---

*Next: [12 — Change Automation](./12-change-automation.md)*
