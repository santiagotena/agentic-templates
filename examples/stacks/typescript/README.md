# TypeScript stack overlay

A minimal, runnable TypeScript project that shows how to specialize the root
template with pnpm, Biome, and Vitest.

## Try it

Requires Node.js 20+ and pnpm 10+ (`corepack enable` provides pnpm).

```sh
cd examples/stacks/typescript
pnpm install
make check
```

Commit the generated `pnpm-lock.yaml` so CI can install reproducibly. Tool
versions are pinned in `package.json`; update them together with the Biome
schema URL in `biome.json`.

## Lift it into a project

1. Copy `biome.json`, `tsconfig.json`, and `Makefile` to your repository root,
   or merge the targets into the root `Makefile`.
2. Merge the scripts and dev dependencies from `package.json`.
3. Keep `make setup`, `make test`, `make lint`, `make format`, and `make check`
   as the only interface agents need.

## CI

Add these steps after checkout and before the `make setup` step in
`.github/workflows/ci.yml`:

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: pnpm
```

`make setup` installs dependencies and uses `--frozen-lockfile` once
`pnpm-lock.yaml` is committed.
