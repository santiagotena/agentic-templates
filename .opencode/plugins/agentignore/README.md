# `.agentignore` enforcement

A dependency-free local OpenCode plugin that enforces `.agentignore` at the
repository root.

- `read`, `edit`, `write`, and `patch` are refused for ignored paths.
- `glob` and `grep` refuse ignored search paths and drop ignored results,
  including the match lines under an ignored file. Result counts are adjusted.
- Editing `.agentignore` is blocked; change it yourself.
- Rules use a practical subset of gitignore syntax: comments, `!` negation,
  `*`, `**`, `?`, and trailing `/` for directories. The last matching rule wins.

`shell` commands are deliberately not inspected: reliably parsing a shell
command is not feasible, and a best-effort check blocks harmless commands while
missing indirect reads. Control shell access with `permissions` instead.

This is a context guardrail, not a security boundary. The plugin loads
automatically from `.opencode/plugins/` and requires no configuration. Verify
it with `opencode plugin list`.

## Files

- `index.ts` — registers the `execute.before` and `execute.after` hooks.
- `ignore.ts` — gitignore-style matcher.
- `test/` — `node --test` suites (run with `make test`; Node 22.18+ strips
  types, so no build step or dependencies are needed).
- `filter.ts` — input inspection and `glob`/`grep` result filtering. It depends
  on the built-in tools' text output format, so recheck it after OpenCode
  upgrades.
