terraform {
  required_version = ">= 1.14.0"

  required_providers {
    local = {
      source  = "hashicorp/local"
      version = "~> 2.4"
    }
  }
}

resource "local_file" "hello" {
  content  = "Hello, Terraform! - once again I've changed contents!"
  filename = "${path.module}/hello.txt"

  lifecycle {
    create_before_destroy = true
  }

}

resource "local_sensitive_file" "goodbye" {
  content  = "You shouldnt be seeing this..."
  filename = "${path.module}/goodbye.txt"

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [local_file.hello]
}

variable "semver" {
  default = "1.0"
}