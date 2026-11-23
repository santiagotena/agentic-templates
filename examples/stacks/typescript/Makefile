.DEFAULT_GOAL := help
SHELL := /bin/sh

PNPM ?= pnpm

.PHONY: help setup test lint format check

help: ## List available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  %-8s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Install dependencies
	@if [ -f pnpm-lock.yaml ]; then \
		$(PNPM) install --frozen-lockfile; \
	else \
		$(PNPM) install; \
	fi

test: ## Run tests
	$(PNPM) test

lint: ## Run typecheck and Biome checks
	$(PNPM) typecheck
	$(PNPM) lint

format: ## Apply Biome formatting and safe fixes
	$(PNPM) format

check: lint test ## Run lint and tests
