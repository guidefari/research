terraform {
    required_version = ">= 1.14.0"

    required_providers {
      local = {
        source = "hashicorp/local"
        version = "~> 2.4"
      }
    }
}

resource "local_file" "hello" {
  content = "Hello, Terraform! - I've changed contents!"
  filename = "${path.module}/hello.txt"
}