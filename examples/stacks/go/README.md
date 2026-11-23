# Go stack overlay

A minimal, runnable Go project that shows how to specialize the root template.

## Try it

Requires Go 1.22+ and, for `make lint`, golangci-lint v2.

```sh
cd examples/stacks/go
make test
make lint   # go vet + golangci-lint
make check  # lint + test
```

## Lift it into a project

1. Copy `.golangci.yml` and `Makefile` to your repository root, or merge the
   targets into the root `Makefile`.
2. Copy `go.mod`, or merge the module path and Go version into your own.
3. Replace `example.com/starter` with your module path and bump the `go`
   directive to your toolchain's version.
4. Keep `make setup`, `make test`, `make lint`, `make format`, and `make check`
   as the only interface agents need.

## CI

Add these steps after checkout and before the `make setup` step in
`.github/workflows/ci.yml`:

```yaml
- uses: actions/setup-go@v5
  with:
    go-version-file: go.mod
- run: go install github.com/golangci/golangci-lint/v2/cmd/golangci-lint@latest
```

Pin the golangci-lint version for reproducible CI.
