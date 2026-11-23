.DEFAULT_GOAL := help
SHELL := /bin/sh

GO ?= go
GOLANGCI_LINT ?= golangci-lint

.PHONY: help setup test lint format check

help: ## List available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  %-8s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Download modules and check for golangci-lint
	$(GO) mod download
	@command -v $(GOLANGCI_LINT) >/dev/null 2>&1 || \
		echo "note: install golangci-lint v2 (https://golangci-lint.run/welcome/install/)"

test: ## Run tests
	$(GO) test ./...

lint: ## Run go vet and golangci-lint
	$(GO) vet ./...
	$(GOLANGCI_LINT) run

format: ## Format Go sources
	$(GO) fmt ./...

check: lint test ## Run lint and tests
