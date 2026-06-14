# Perspective Memory Reuse Quality Review v0.1

## Status

PASS. This PR adds a deterministic local preview helper and smoke coverage for
Perspective Memory Reuse Quality Review v0.1.

## Context

PR #560 added Codex Memory Brief metadata:

- `selected_item_count`
- `codex_memory_brief_character_count`
- `codex_memory_brief_line_count`
- `has_large_selection_warning`
- `compact_brief_recommended`

The next question is not storage. The next question is reuse quality: was
selected memory relevant, bounded, non-stale, and useful? This preview does not claim semantic truth. It only produces mechanical review material for an
operator.

## Change

Added:

- `lib/perspective-ingest/perspective-memory-reuse-quality-review.ts`
- `scripts/smoke-perspective-memory-reuse-quality-review.mjs`
- `docs/PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_V0_1.md`

Versions:

- `perspective_memory_reuse_quality_review.v0.1`
- `perspective_memory_reuse_quality_review_summary.v0.1`

The helper builds a copyable local review packet and summary from a reuse packet
context. It checks missing why_selected, missing reuse_boundary, selected count,
`PASS with follow-up`, `deprecated`, `retracted`, `superseded`,
`compact_brief_recommended`, and `large_selection_warning`.

## Boundary

This remains preview-only deterministic local review and mechanical checks only.

No new authority is introduced:

- no persistence
- no provider/model calls
- no OpenAI API calls
- no Codex SDK execution
- no MCP tool calls
- no MCP bridge startup
- no GitHub mutation
- no DB schema or migrations
- no perspective-memory persistence writes
- no reuse packet persistence
- no return binding persistence
- no quality review persistence
- no product boundary creation
- no proof/evidence writes
- no automatic synthesis
- no automatic memory creation
- no default/user DB writes
- no hidden background daemons
- no runtime startup
- no Augnes state commit/reject authority

This does not justify storage. Quality review persistence should wait until
repeated dogfood shows a concrete product reason.

## Verification

Passed:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-quality-review`
- `npm run smoke:perspective-memory-reuse-return-binding`
- `npm run smoke:perspective-memory-reuse-return-binding-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-report`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-seed`
- `npm run smoke:perspective-memory-reuse-live-data-dogfood-harness-rerun-report`
- `npm run smoke:augnes-codex-bootstrap`
- `npm run smoke:augnes-codex-doctor`
- `npm run smoke:augnes-codex-prepare`
- `npm run smoke:augnes-operator-plugin-scaffold`
- `npm run smoke:augnes-operator-plugin-hooks`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`

## Next recommended PR

Dogfood the quality review preview with the live-data seeded reuse route output.
Only consider persistence after repeated review shows a concrete product reason.
