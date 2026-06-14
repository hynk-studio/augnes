# Perspective Memory Reuse Packet v0.1 Brief Metadata

## Status

PASS. This follow-up adds selected count and brief length metadata to the
deterministic local Perspective Memory Reuse Packet v0.1 helper and workspace
at `/cockpit/perspective/memory-items/reuse`.

## Context

PR #559 reran the live-data dogfood harness after PR #558 removed manual seed
friction. The seeded rows loaded, packet JSON included both seeded IDs with no
missing memory item IDs, and the Codex Memory Brief was usable. The remaining
thin UX gap was that larger selections may need a visible selected-count and
brief-length hint before any compacting behavior is considered.

## Change

The reuse helper for `perspective_memory_reuse_packet.v0.1` now returns Codex
Memory Brief metadata next to the existing brief:

- `selected_item_count`
- `codex_memory_brief_character_count`
- `codex_memory_brief_line_count`
- `has_large_selection_warning`
- `compact_brief_recommended`

The reuse workspace renders that metadata near the Codex Memory Brief output.
The full Codex Memory Brief remains available. No compact brief output is introduced in this slice.

## Boundary

This remains intentionally not automated behavior and a deterministic local
builder only.

No new authority is introduced:

- No provider/model calls
- No OpenAI API calls
- No Codex SDK execution
- No MCP tool calls or MCP bridge startup
- No GitHub mutation
- No persistence writes
- No perspective-memory persistence writes
- No DB schema or migrations
- No proof/evidence writes
- No Augnes state commit/reject authority
- No runtime startup
- No hidden background daemons

This metadata does not justify persisted return binding storage. It only makes
reuse brief size and selection count visible while preserving the copyable
packet/brief workflow.

## Verification

Passed:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
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

Browser sanity also passed against the explicit temp DB seeded by the
live-data dogfood harness:

- desktop route loaded with both seeded item IDs
- packet JSON included both seeded IDs and `missing_memory_item_ids: []`
- Codex Memory Brief generated
- selected-count and brief-length metadata rendered near the brief output
- 390px viewport had no horizontal overflow
- forbidden authority controls were absent
- the short-lived runtime was stopped and port 3000 had no listener afterward

## Next recommended PR

Continue toward reuse quality review. Rerun live-data harness dogfood only if
the UI metadata needs route validation; persisted return binding storage should
wait for a concrete product reason from repeated live-data dogfood.
