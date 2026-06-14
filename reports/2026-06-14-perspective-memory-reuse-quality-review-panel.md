# Perspective Memory Reuse Quality Review Panel

Perspective Memory Reuse Quality Review panel.

## Status

PASS. This PR adds a thin read-only deterministic quality review preview panel
inside `/cockpit/perspective/memory-items/reuse`.

## Context

PR #561 added `buildPerspectiveMemoryReuseQualityReview`. PR #562 dogfooded the
helper with live-data seeded reuse route output and found:

- the PASS seeded item was mechanically reviewable
- the PASS with follow-up seeded item needed operator review
- `why_selected` and `reuse_boundary` stayed visible
- brief metadata carried through
- there was no semantic truth claim
- there was no reason to persist quality reviews

The next useful slice was UI visibility, not storage.

## Change

The reuse workspace now builds a quality review preview from the current local
reuse context:

- current reuse packet ID
- task title and task description
- selected persisted perspective-memory items
- per-item `why_selected`
- per-item `reuse_boundary`
- item validation state and item status
- current Codex Memory Brief metadata

The panel displays:

- `review_version`
- `dogfood_route_status: not_applicable`
- `quality_review_preview_state`
- `reviewable_item_count`
- `needs_operator_review_count`
- `missing_why_selected_count`
- `missing_reuse_boundary_count`
- `compact_brief_recommended`
- `large_selection_warning`
- `suggested_next_action`
- item-level review states

The existing full reuse packet JSON remains available. The existing full Codex
Memory Brief remains available. Brief metadata remains visible.

## Boundary

The panel is read-only deterministic preview UI. It is not dogfood evidence and
does not mark route validation status; `dogfood_route_status: not_applicable`
is shown separately from `quality_review_preview_state`.

The panel uses mechanical checks only and has no semantic truth claim. It helps
an operator see missing notes, validation caveats, stale-ish status flags, and
brief-size metadata; it does not decide whether a memory is actually relevant,
fresh, or useful.

No persistence/storage is added:

- No persistence/storage
- No DB schema
- No provider/model calls
- No OpenAI API calls
- No MCP tool calls
- No Codex SDK execution
- No GitHub mutation
- No perspective-memory persistence writes
- No reuse packet persistence
- No return binding persistence
- No quality review persistence
- No product boundary creation
- No proof/evidence writes
- No automatic synthesis
- No automatic memory creation
- No default/user DB writes
- No hidden background daemons
- No runtime authority
- No Augnes state commit/reject authority

No helper code changed. Product UI code changed only to add the read-only
quality review preview panel inside the existing reuse workspace. The existing
helper was sufficient, and no product persistence, API, runtime, storage, or
authority behavior changed.

## Verification

Passed verification:

- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items-review-workspace`
- `npm run smoke:perspective-memory-items-reuse-packet`
- `npm run smoke:perspective-memory-reuse-quality-review`
- `npm run smoke:perspective-memory-reuse-quality-review-dogfood-report`
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

Live-data browser sanity also passed against the explicit temp DB seeded by
`npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes`:

- route loaded with both seeded item IDs
- existing full reuse packet JSON remained available
- existing full Codex Memory Brief remained available
- brief metadata remained visible
- quality review panel rendered
- `dogfood_route_status: not_applicable`
- `quality_review_preview_state: needs_operator_review`
- PASS seeded item rendered as mechanically reviewable
- PASS with follow-up seeded item rendered as `needs_operator_review`
- `compact_brief_recommended: yes`
- `large_selection_warning: no`
- forbidden mutation/persistence/provider/Core/GitHub controls were absent
- desktop and 390px viewport checks had no horizontal overflow
- short-lived runtime was stopped and port 3000 had no listener afterward
- temp browser dependency directory was removed afterward

## Next recommended PR

Dogfood the UI panel with the seeded live-data harness. Only discuss quality
review persistence if repeated UI dogfood produces a concrete product reason.
