# Agent Guide

<!--
Keep this file lean. Add only project-specific context that an experienced
engineer could not infer from the code and standard tooling.
-->

## Project

<One paragraph: what this project does, who uses it, and the main runtime.>
Replace this section when you specialize the template.

## Commands

Run everything from the repository root.

| Command        | Purpose                                                          |
| -------------- | ---------------------------------------------------------------- |
| `make setup`   | Install dependencies and enable git hooks. Run once after clone. |
| `make test`    | Run unit and integration tests.                                  |
| `make lint`    | Run static analysis and formatting checks.                       |
| `make format`  | Apply formatting and safe autofixes.                             |
| `make check`   | Run `lint` and `test`. Use before declaring work complete.       |

The `Makefile` is the source of truth. `test` and `lint` currently verify the
template's own tooling (the `agentignore` plugin, config, agents, skills);
`format` is a placeholder. Add the real stack commands alongside them. CI runs `make setup` then `make
check` on every push and pull request; keep local and CI verification
equivalent.

## Architecture

- `<path>/` — replace with the top-level areas of this project.
- `docs/adr/` — architecture decisions and their rationale.
- `docs/api/` — canonical API contracts.
- `scripts/` — repository tooling run by `make lint`.
- `examples/stacks/` — optional Go and TypeScript overlays; keep them runnable.

Update this map when you add or move a top-level area.

## Conventions

- Formatting and style are enforced by tooling. Do not hand-format or debate style.
- Match the naming, error handling, and test layout of the nearest existing code.
- Prefer small, focused changes. Do not mix refactors with behavior changes.
- Add or update tests for behavior changes; keep tests deterministic and offline.

## Boundaries

- Do not edit generated files, vendored code, or lockfiles by hand.
- Do not commit secrets or local environment files.
- Do not bypass hooks (`--no-verify`) or weaken lint/test configuration to make a change pass.
- Do not rewrite accepted ADRs. Supersede them with a new ADR instead.
- Do not edit `.agentignore`. It is human-maintained; the `agentignore` plugin
  blocks agent writes and refuses access to the paths it lists. Ask before
  changing it.
- Run `make check` after edits. If a check cannot run, say so explicitly.

## Workflow

1. Read the relevant code and `docs/adr/` before changing a design.
2. Make the smallest change that satisfies the request.
3. Run `make format` and `make check`.
4. Report what changed, what was verified, and any remaining risk.

Use the `reviewer` subagent for an independent read-only review of non-trivial
changes. The `/code-review` and `/verify` commands wrap the review and
verification steps.
