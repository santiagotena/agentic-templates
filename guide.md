To build a clean, professional-grade starter template for agentic software development, here is a summary of the core project-level files you should include and configure, along with their roles:

1. Agent Instruction & Context Files
AGENTS.md (or tool-specific equivalents like CLAUDE.md, .cursorrules)

Role: The primary system prompt and operational guide for agents touching this repository.

What goes here:

Project overview and architectural patterns.

Exact build, test, and lint commands.

Coding conventions (formatting, error handling styles, naming).

Explicit boundaries (e.g., "Do not modify database migrations directly", "Run tests after making edits").

Best practice rule: Keep it lean. As models improve, remove prompt bloat and let standard tools or model defaults handle generic knowledge.

.cursorrules / .github/copilot-instructions.md

Role: Editor- or platform-specific instruction files if your team uses Cursor or GitHub Copilot.

What goes here: Often symlinked or kept minimal to mirror rules from AGENTS.md.

2. Guardrails & Ignore Rules
.gitignore

Role: Prevents temporary artifacts, secrets, and environment files from entering version control. Agents heavily rely on git state to know what's clean.

.agentignore (or tool equivalents like .cursorignore)

Role: Dictates what the coding agent's search and indexing tools must ignore.

What goes here: Large generated bundles, vendor directories (node_modules/, vendor/), large fixtures, binaries, lockfiles, or sensitive configs that waste context window tokens or degrade retrieval-augmented search.

3. Agent Tooling, Skills, & Extensions
Agent Configuration File (opencode.json, .vscode/settings.json, etc.)

Role: Configures the agent harness itself (model selection, enabled plugins, auto-approval permissions).

What goes here: Permissions for shell execution, default model routing (e.g., standard vs. reasoning models), and environment variable configurations.

Custom Tools / Skills Directory (e.g., .agents/skills/, .opencode/tools/, or MCP config)

Role: Custom function-calling capabilities exposed to the model.

What goes here: Model Context Protocol (MCP) configs (mcp.json) or custom scripts that let the agent run project-specific tasks (e.g., querying a local dev database schema, triggering staging deployments, or querying API docs).

4. Fast Feedback & Verification Harnesses
Makefile / Justfile / Taskfile.yml

Role: Standardized command interface.

What goes here: Predictable, single-command targets for the agent:

make test — run unit and integration tests.

make lint / make format — run static analysis and code formatters.

make check — run both linting and testing in one pass.

Agents perform best when verification commands are short, deterministic, and exit with proper status codes.

Linters & Formatters (.golangci.yml, ruff.toml, .eslintrc.json, biome.json)

Role: Immediate mechanical feedback.

What goes here: Strict rules for formatting and style so the agent doesn't waste context debating aesthetic style conventions.

Git Hooks (.husky/, .pre-commit-config.yaml)

Role: Automated enforcement.

What goes here: Automatic checks that run formatting, linting, or tests before commits, preventing bad agent output from being finalized into the git log.

5. Architectural & Domain Documentation
README.md

Role: High-level human and agent onboarding (what the project does, quickstart guide, environment prerequisites).

docs/ (Architecture Decision Records / ADRs, API specs)

Role: Deep context the agent can inspect on-demand rather than keeping in constant context:

docs/adr/: Why specific libraries or designs were chosen.

docs/api/ or openapi.yaml: Canonical interface definitions.

Golden Rule for the Template
Keep configuration as minimal as possible. Avoid over-prompting or baking in workarounds for bugs from older model generations; let the agent rely primarily on standard build tools, clear file organization, and fast test suites.
