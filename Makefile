.DEFAULT_GOAL := help
SHELL := /bin/sh

.PHONY: help setup test lint format check

help: ## List available targets
	@awk 'BEGIN {FS = ":.*## "} /^[a-zA-Z_-]+:.*## / {printf "  %-8s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Install dependencies and enable git hooks
	@if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
		git config core.hooksPath .githooks; \
		chmod +x .githooks/pre-commit; \
		echo "Git hooks enabled."; \
	else \
		echo "note: not a git repository; run 'git init' then 'make setup' again"; \
	fi
	@if [ -z "$${CI:-}" ] && ! command -v opencode >/dev/null 2>&1; then \
		echo "note: opencode is not installed (https://opencode.ai/v2/install)"; \
	fi
	@echo "Add stack-specific dependency installation to the setup target."

# The test and lint targets verify the template's own tooling (the agentignore
# plugin, OpenCode config, hooks). Add your project's commands alongside them.
test: ## Run the agentignore plugin tests (Node 22.18+)
	@if [ -d .opencode/plugins/agentignore ]; then \
		node --test '.opencode/plugins/**/*.test.ts'; \
	else \
		echo "test: no tests configured yet"; \
	fi

lint: ## Validate OpenCode config, agents, skills, and hooks
	node scripts/lint.mjs
	sh -n .githooks/pre-commit

format: ## Apply formatters and safe autofixes (replace the placeholder command)
	@echo "format: no format command configured yet"

check: lint test ## Run lint and tests
