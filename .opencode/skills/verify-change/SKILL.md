---
name: Verify Change
description: Verify a change before finishing a task by running the project checks and reporting the result
---

# Verify Change

Use this workflow before reporting a coding task as complete.

1. Inspect the working tree with `git status --short` and `git diff`.
2. Confirm the change is limited to the requested scope. Flag unrelated edits.
3. Run `make check` from the repository root.
4. If a check fails, fix the cause and rerun. Do not suppress, skip, or weaken a
   check just to get a pass.
5. If a check cannot run in this environment, report which one and why.

Report:

- the commands run and whether each passed
- the files changed
- any unverified behavior or remaining risk

Do not commit, push, or rewrite history unless the user explicitly asks.
