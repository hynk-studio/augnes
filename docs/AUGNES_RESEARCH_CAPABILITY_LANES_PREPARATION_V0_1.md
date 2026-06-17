# Augnes Research Capability Lanes Preparation v0.1

## Purpose

This document is a preparation and contract slice for product-facing Research
capability lanes in Augnes Perspective development.

It moves the active research work anchor beyond the historical
`AG-DOGFOOD-RESEARCH-001` preview-only scenario pack without implementing any
research capability lane. It defines the next bounded planning surface for
manual source intake, bounded source handling, candidate review, and eventual
human-reviewed perspective promotion.

## Source Work Routing

- Work ID: `AG-RESEARCH-CAPABILITY-LANES-001`
- Scope: `project:augnes`
- Source seeded work item: `scripts/demo-seed.mjs`
- Preferred fallback command:
  `npm run codex:next-work -- --scope project:augnes --prefer-research`

`AG-DOGFOOD-RESEARCH-001` remains historical dogfood evidence and may still be
targeted explicitly with `--work-id AG-DOGFOOD-RESEARCH-001`. It is not the
current active `--prefer-research` target.

## Bounded Lane Contract

Future product-facing Research capability work may be split into these lanes:

- manual source intake
- bounded operator-provided source fetching
- provider-assisted extraction/summary
- derived retrieval indexes, including FTS, embedding, vector, or RAG-style
  retrieval
- durable research candidate memory
- human-reviewed perspective promotion

Each lane needs a fresh Work Brief or Core Handoff that names the lane,
expected files, expected checks, source limits, authority boundary, and
verification. This preparation slice only defines the contract vocabulary and
first recommended product slice.

## Authority Model

Fetched, provider-derived, and retrieval-derived outputs are candidate inputs
only until human review.

Derived retrieval indexes must be rebuildable, source-ref based, and
non-authoritative. They may help retrieve or rank candidate material, but they
cannot create proof/evidence rows, work closure, approval, publication, merge,
or Augnes state commit/reject authority by themselves.

Durable writes, when separately authorized, should start as
candidate/review records. They should not write committed perspective state
directly.

Perspective updates remain candidates until human review, promote, and commit
gates exist. No lane mutates perspective memory by itself.

## First Recommended Product Slice

Start with a user-facing candidate review surface for manually supplied
source/reference/notes. The first slice should help an operator inspect source
provenance, candidate claims, candidate evidence, tensions, gaps, and possible
perspective-update candidates without adding crawler, provider, retrieval, or
durable-write behavior.

Do not start with crawler/RAG first. Source ingestion and retrieval should wait
for separately authorized lane contracts and verification.

## Expected Files And Checks

Expected files:

- `docs/AUGNES_RESEARCH_CAPABILITY_LANES_PREPARATION_V0_1.md`
- `scripts/smoke-research-capability-lanes-preparation-v0-1.mjs`
- `scripts/demo-seed.mjs`
- `scripts/codex-next-work.mjs`
- `scripts/smoke-codex-worker-bootstrap-v0-1.mjs`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `package.json`

Expected checks:

- `node scripts/smoke-research-capability-lanes-preparation-v0-1.mjs`
- `node scripts/smoke-codex-worker-bootstrap-v0-1.mjs`
- `git diff --check`

## Stop Conditions

Stop instead of implementing if this preparation PR would require any of these:

- source fetching
- crawler behavior
- provider/OpenAI calls
- embeddings
- RAG
- vector search
- FTS or indexing implementation
- DB migration
- durable research writes
- candidate/review record storage
- perspective promotion
- proof/evidence writes
- work close/status mutation outside the seed/demo fixture update
- state commit/reject
- API route changes
- App/MCP tool changes
- production auth or OAuth
- automatic Codex execution
- GitHub automation
- branch or PR creation from App/MCP code
- package dependency additions

## What This Preparation Slice Does Not Implement

This slice does not implement source fetching, crawlers, provider/OpenAI calls,
embeddings, RAG, vector search, FTS/indexing, DB migration, durable research
writes, proof/evidence writes, work status mutation, state commit/reject,
perspective memory mutation, App/MCP tools, automatic Codex execution, GitHub
automation, or package dependency additions.

## Next Recommended Step

Use this preparation contract to define the first user-facing candidate review
surface for manually supplied source/reference/notes. Keep every output
candidate-only until a human review/promote/commit path is explicitly designed
and authorized.
