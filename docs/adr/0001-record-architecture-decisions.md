# 1. Record architecture decisions

- Status: Accepted
- Date: 2026-11-23

## Context

Agents and humans need durable context for why the project is built the way it
is. Code shows what exists; it rarely explains trade-offs, rejected options, or
the constraints that shaped a design.

## Decision

Record significant architecture decisions as ADRs in `docs/adr/`.

- Name files `NNNN-short-title.md`, using the next zero-padded number.
- Keep one decision per file.
- Never rewrite an accepted ADR. Supersede it with a new ADR that links back.
- Prefer short sections: Context, Decision, Consequences.

## Consequences

- Design rationale is available on demand instead of in every prompt.
- Changing a decision requires a visible, reviewable record.
- The team must remember to write ADRs; review can enforce it.
