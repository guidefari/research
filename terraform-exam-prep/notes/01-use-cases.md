# 01 — Use Cases

> **Exam objective:** Understand the use cases for Terraform and Infrastructure as Code (IaC).

---

## What is Infrastructure as Code?

Infrastructure as Code (IaC) means managing and provisioning infrastructure through **machine-readable configuration files** instead of manual processes or interactive GUIs.

Think of it this way: just as application developers write code to describe what their software should do, infrastructure engineers write code to describe what their infrastructure should look like.

### The Problems IaC Solves

| Problem (manual approach) | Solution (IaC) |
|---|---|
| "Works on my machine" infra inconsistency | Reproducible, version-controlled configs |
| Undocumented one-off changes ("click ops") | Every change is a code commit |
| Slow provisioning — hours of console clicking | Minutes with `terraform apply` |
| No audit trail | Full git history of every change |
| Difficult to scale or replicate environments | Parameterise once, reuse everywhere |

---

## Where Terraform Fits

Terraform is a **declarative IaC tool**. You describe the *desired end state* of your infrastructure; Terraform figures out how to get there.

```
You say:  "I want 3 EC2 instances, a VPC, and a load balancer."
Terraform says: "Got it — I'll create them in the right order."
```

Compare this to **imperative** tools (bash scripts, Ansible playbooks), where you describe every step to take.

---

## Core Use Cases

### 1. Multi-Cloud and Hybrid Cloud Provisioning

Terraform has providers for **AWS, Azure, GCP, Kubernetes, Datadog, GitHub, PagerDuty** — over 3000+ providers. You write one consistent language (HCL) regardless of the target.

```hcl
# AWS S3 bucket
resource "aws_s3_bucket" "data" {
  bucket = "my-app-data"
}

# Azure Storage Account — same language, different provider
resource "azurerm_storage_account" "data" {
  name                     = "myappdata"
  resource_group_name      = "my-rg"
  location                 = "East US"
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
```

### 2. Application Infrastructure

Provision the full stack an application needs:
- Networking (VPCs, subnets, security groups)
- Compute (EC2, ECS, Lambda)
- Databases (RDS, DynamoDB)
- DNS, load balancers, certificates

### 3. Self-Service Clusters

Platform teams define Terraform modules; application teams call them like an internal API. No need to understand the underlying cloud console.

### 4. Policy Compliance & Guardrails

With Sentinel (HCP Terraform) or Open Policy Agent, you can codify policies:
- "No S3 buckets can be public"
- "Every resource must have a cost-centre tag"

### 5. Kubernetes Management

Terraform can provision **and** manage Kubernetes clusters (EKS, GKE, AKS) *and* deploy resources inside them using the Kubernetes provider.

### 6. Network Infrastructure

Traditional network teams use Terraform to manage firewalls (Palo Alto, Fortinet), load balancers, and DNS zones using the same workflow as cloud infra.

### 7. Disaster Recovery / Multi-Region

Because your infra is code, spinning up a replica environment in a different region is a variable change away.

---

## Key Advantages of Terraform (Exam-Relevant)

| Advantage | Why It Matters |
|---|---|
| **Declarative** | Describe what you want, not how to get there |
| **Cloud-agnostic** | One tool for all providers |
| **Idempotent** | Running `apply` twice has no unintended side effects |
| **State management** | Tracks real-world resources to detect drift |
| **Execution plans** | Preview changes before they happen |
| **Modular & reusable** | DRY infrastructure through modules |
| **Version controlled** | Infra changes reviewed like application code |

---

## Hands-On: Explore the Registry

1. Go to https://registry.terraform.io
2. Browse **Providers** — notice AWS, Azure, GCP have thousands of resources each.
3. Browse **Modules** — search for `vpc` and see community-built modules you can call directly.

No code yet — just get a feel for the ecosystem.

---

## Exam Tips

- Know the difference between **declarative** and **imperative** IaC.
- Be able to list at least 4 benefits of IaC / Terraform.
- Understand that Terraform is **cloud-agnostic** (not tied to one provider).
- Know that Terraform uses **state** to track real-world resources.

---

## Further Reading

| Resource | URL |
|---|---|
| What is IaC? (HashiCorp) | https://developer.hashicorp.com/terraform/tutorials/aws-get-started/infrastructure-as-code |
| Terraform Use Cases | https://developer.hashicorp.com/terraform/intro/use-cases |
| Terraform vs other tools | https://developer.hashicorp.com/terraform/intro/vs |
| Terraform Registry | https://registry.terraform.io |

---

*Next: [02 — Core and Plugins](./02-core-and-plugins.md)*
