# `.agentignore` enforcement

A dependency-free local OpenCode plugin that enforces `.agentignore` at the
repository root.

- `read`, `edit`, `write`, and `patch` are refused for ignored paths.
- `glob` and `grep` refuse ignored search paths and drop ignored results,
  including the match lines under an ignored file. Result counts are adjusted.
- Editing `.agentignore` is blocked; change it yourself.
- Rules use a practical subset of gitignore syntax: comments, `!` negation,
  `*`, `**`, `?`, and trailing `/` for directories. The last matching rule wins.
- `shell` commands that name an ignored path are refused, and shell writes to
  `.agentignore` (redirection, `sed -i`, `rm`, `mv`, `cp`, `tee`) are blocked.
  `rm`, `rmdir`, and `mkdir` on ignored paths are allowed because they do not
  expose contents.

This is a context guardrail, not a security boundary. The shell check is
best-effort: it sees literal path arguments only, not variables, command
substitution, `cd dir && cmd`, or scripts that read files themselves. Use
`permissions` if you need real restrictions. The plugin loads automatically
from `.opencode/plugins/` and requires no configuration. Verify it with
`opencode plugin list`.

## Files

- `index.ts` — registers the `execute.before` and `execute.after` hooks.
- `ignore.ts` — gitignore-style matcher.
- `shell.ts` — best-effort scan of shell commands for ignored paths.
- `test/` — `node --test` suites (run with `make test`; Node 22.18+ strips
  types, so no build step or dependencies are needed).
- `filter.ts` — input inspection and `glob`/`grep` result filtering. It depends
  on the built-in tools' text output format, so recheck it after OpenCode
  upgrades.
