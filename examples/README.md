# Stack overlays

Optional, runnable examples that show how to specialize the root template. The
root template stays language-agnostic; copy the parts you need.

| Overlay             | Toolchain                          |
| ------------------- | ---------------------------------- |
| `stacks/go/`        | Go, golangci-lint                  |
| `stacks/typescript/` | TypeScript, pnpm, Biome, Vitest   |

Each overlay has its own `README.md`, `Makefile`, and configuration files. Run
`make check` inside an overlay to see the full verification loop.
