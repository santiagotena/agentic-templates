# Agent-Ready Project Template

A minimal, language-agnostic starter for agentic software development with
[OpenCode](https://opencode.ai/v2/docs/). It standardizes the files agents need:
persistent instructions, permissions, fast verification commands, hooks, and
on-demand documentation.

## Quickstart

1. Install OpenCode: `curl -fsSL https://opencode.ai/v2/install | bash`
2. Copy this template into your repository.
3. Run `make setup` to enable the git hooks.
4. Add your stack's commands to the `Makefile`. `test` and `lint` currently
   verify the template's own tooling (Node 22.18+ required); `format` is a
   placeholder.
5. Replace the placeholders in `AGENTS.md` with project-specific context.
6. Run `make check`.

## Layout

| Path                              | Purpose                                                       |
| --------------------------------- | ------------------------------------------------------------- |
| `AGENTS.md`                       | Persistent instructions for every agent working in this repo. |
| `opencode.jsonc`                  | OpenCode permissions, formatter, watcher, and MCP config.     |
| `Makefile`                        | Standard `test` / `lint` / `format` / `check` interface.      |
| `.githooks/pre-commit`            | Runs `make check` before every commit.                        |
| `.github/workflows/ci.yml`        | Runs `make setup` and `make check` on every push and PR.      |
| `.opencode/skills/verify-change/` | Example skill that teaches the agent the verification loop.   |
| `.opencode/agents/reviewer.md`    | Read-only review subagent.                                    |
| `.opencode/commands/`             | Slash commands: `/code-review` and `/verify`.                 |
| `.opencode/plugins/agentignore/`  | Enforces `.agentignore` for tools and searches.               |
| `.agentignore`                    | Paths agents must not read, edit, or search.                  |
| `scripts/lint.mjs`                | Validates config, agents, skills, and required files.         |
| `examples/stacks/`                | Optional Go and TypeScript overlays.                          |
| `.gitignore`                      | Keeps artifacts, dependencies, and secrets out of git.        |
| `docs/adr/`                       | Architecture decision records and a copyable template.        |
| `docs/api/`                       | Canonical API contracts and interface definitions.            |

## Specializing the template

- **Makefile** — keep the template checks (`scripts/lint.mjs`, the plugin
  tests) and add your stack's commands, or replace them, for example `pytest`, `ruff check .`, `ruff format .`, `go test ./...`, or
  `pnpm test`. Keep `make check` fast enough for a pre-commit hook. `make lint`
  should check formatting without rewriting files; `make format` applies it.
- **CI** — `.github/workflows/ci.yml` runs `make setup` and `make check` on
  every push and pull request. Keep CI and the local check equivalent; add
  dependency installation to `make setup` rather than duplicating it in the
  workflow.
- **Linters and formatters** — add the config files your stack expects
  (`ruff.toml`, `biome.json`, `.golangci.yml`). OpenCode runs built-in
  formatters automatically when `formatter` is enabled.
- **Stack overlays** — start from `examples/stacks/go/` or
  `examples/stacks/typescript/` when your stack matches, then delete the
  overlays you do not need.
- **opencode.jsonc** — shell access is unrestricted in this template. Replace
  the `shell` rule with `ask` plus targeted `allow`/`deny` rules for projects
  that need guardrails. Add MCP servers and a default model as needed.
- **Skills** — copy `.opencode/skills/verify-change/` as the pattern for
  task-specific workflows. Skills are discovered automatically from
  `.opencode/skills/`.
- **Subagents** — copy `.opencode/agents/reviewer.md` as the pattern for
  read-only or narrowly scoped agents. The example denies edits and restricts
  shell to read-only git commands. Agent files are discovered from
  `.opencode/agents/`.
- **Commands** — `/code-review` runs the read-only reviewer subagent and
  `/verify` runs the verification skill. Copy either file in
  `.opencode/commands/` for your own shortcuts. Avoid names that shadow
  built-ins such as `/review`, and avoid `!` shell blocks: they run outside the
  permission flow and the `agentignore` shell guard.
- **Ignore rules** — edit `.agentignore` yourself; the agent cannot. The
  `agentignore` plugin in `.opencode/plugins/` enforces it and needs no
  configuration. Delete the plugin if you prefer `.gitignore` alone.
- **Docs** — record design decisions in `docs/adr/` and interface contracts in
  `docs/api/`. Link them from `AGENTS.md` instead of copying their content.

## Stack overlays

`examples/stacks/` contains runnable Go and TypeScript examples. They are
optional and self-contained; the root template stays language-agnostic.

```sh
cd examples/stacks/go && make check
cd examples/stacks/typescript && pnpm install && make check
```

See each overlay's `README.md` for lift-in steps and CI additions.

## Ignore rules

`.agentignore` at the repository root lists paths the agent should not load into
context. It uses `.gitignore` syntax: comments, `!` negation, `*`, `**`, `?`,
and a trailing `/` for directories. The last matching rule wins.

A local plugin in `.opencode/plugins/agentignore/` enforces the file:

- `read`, `edit`, `write`, and `patch` are refused for ignored paths.
- `glob` and `grep` refuse ignored search roots and drop ignored results.
- `shell` commands that name an ignored path (`cat .env`, `grep x secrets/*`)
  are refused. Removing or creating ignored directories (`rm -rf node_modules`)
  is still allowed.
- Editing `.agentignore` is blocked, including through shell redirection,
  `sed -i`, `rm`, `mv`, and similar, so the agent cannot widen its own access.

The plugin loads automatically and needs no configuration. It is a context
guardrail, not a security boundary. The shell check only sees literal paths:
variables, command substitution, and scripts that read files themselves get
through. Pair it with `permissions` when you need real isolation.

Run `make test` to execute the plugin's tests.

Three files must stay in sync:

1. `.agentignore` — what the agent skips.
2. `.gitignore` — what git skips; commit this so clones stay clean.
3. `watcher.ignore` in `opencode.jsonc` — what the file watcher ignores, so it
   does not churn on generated output.

Add secrets to `.agentignore` and `.gitignore`, and deny them explicitly in
`permissions` if they must stay on disk.

## Design rules

- Keep configuration minimal. Let standard tools and model defaults handle
  generic knowledge.
- Keep verification commands short, deterministic, and exit-code correct.
- Put deep context in `docs/` and load it on demand, not in every prompt.
