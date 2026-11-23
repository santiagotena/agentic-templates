# API contracts

Put canonical interface definitions here so agents, clients, and tests share one
source of truth.

- `openapi.yaml` — HTTP API contract, when the project exposes one.
- `*.proto`, `schema.graphql`, or similar — other interface definitions.
- `examples/` — request/response fixtures used by tests and docs.

Update the contract before or with the implementation. Do not let generated
clients drift from the checked-in definition.
