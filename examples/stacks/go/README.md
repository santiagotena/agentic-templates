# Go stack overlay

A minimal, runnable Go project that shows how to specialize the root template.

## Try it

Requires Go 1.22+ and, for `make lint`, golangci-lint v2. Verified with Go
1.27.4 and golangci-lint 2.15.0 (`brew install golangci-lint`).

```sh
cd examples/stacks/go
make test
make lint   # go vet + golangci-lint, including the gofmt check
make format # apply gofmt
make check  # lint + test
```

`make lint` fails on unformatted code because `.golangci.yml` enables the
`gofmt` formatter; `make format` fixes it.

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
- run: |
    curl -sSfL https://raw.githubusercontent.com/golangci/golangci-lint/HEAD/install.sh \
      | sh -s -- -b "$(go env GOPATH)/bin" v2.15.0
    echo "$(go env GOPATH)/bin" >> "$GITHUB_PATH"
```

Keep the pinned golangci-lint version in step with the one you develop with.
