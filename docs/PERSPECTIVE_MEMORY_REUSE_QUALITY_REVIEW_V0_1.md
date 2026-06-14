# Perspective Memory Reuse Quality Review v0.1

## Status

Perspective Memory Reuse Quality Review v0.1 is a deterministic local
preview-only helper for reviewing whether a Perspective Memory Reuse packet is
mechanically ready for human quality review.

This is not storage. It does not persist review packets, return bindings,
reuse packets, or perspective-memory items.

## Context

PR #550 added Perspective Memory Reuse Packet v0.1. Later dogfood and live-data
validation proved the copyable packet and Codex Memory Brief path works. PR #560
added brief metadata such as `selected_item_count`,
`codex_memory_brief_character_count`, `codex_memory_brief_line_count`,
`has_large_selection_warning`, and `compact_brief_recommended`.

The next question is reuse quality: was selected memory actually relevant,
bounded, non-stale, and useful? This helper does not answer that semantically.
It only makes mechanical review signals visible for an operator.

## Helper

`lib/perspective-ingest/perspective-memory-reuse-quality-review.ts`

Versions:

- `perspective_memory_reuse_quality_review.v0.1`
- `perspective_memory_reuse_quality_review_summary.v0.1`

The helper builds a review packet and a markdown summary from:

- `reuse_packet_id`
- `task_title`
- `task_description`
- `selected_item_count`
- `codex_memory_brief_metadata`
- `selected_memory_items`
- optional `return_binding_ref`
- optional `operator_notes`

Each selected item includes:

- `memory_item_id`
- `title`
- `why_selected`
- `reuse_boundary`
- `source_ref`
- `validation_state`
- `item_status`

## Mechanical Checks

The review is deterministic local mechanical checks only. It does not claim semantic truth and does not judge whether a memory is genuinely useful.

The helper checks:

- missing why_selected
- missing reuse_boundary
- selected count
- `compact_brief_recommended`
- `large_selection_warning`
- `PASS with follow-up`
- `deprecated`, `retracted`, or `superseded` item status

Uncertain cases are marked `needs_operator_review`.

## Output Shape

The review packet includes:

- `review_version`
- `review_id`
- `created_at`
- `reuse_packet_id`
- `task_title`
- `selected_item_count`
- `brief_metadata`
- `return_binding_ref`
- `operator_notes`
- `item_reviews`
- `aggregate_summary`
- `authority_boundary`

Each item review includes:

- `memory_item_id`
- `has_why_selected`
- `has_reuse_boundary`
- `relevance_review_state: reviewable | needs_operator_review`
- `boundary_review_state: bounded | needs_operator_review`
- `stale_or_misleading_risk: none_detected | needs_operator_review`
- `review_notes`

The aggregate summary includes:

- `reviewable_item_count`
- `needs_operator_review_count`
- `missing_why_selected_count`
- `missing_reuse_boundary_count`
- `compact_brief_recommended`
- `large_selection_warning`
- `suggested_next_action`

## Reuse Workspace Panel

The reuse workspace at `/cockpit/perspective/memory-items/reuse` displays a
read-only deterministic quality review preview panel built with
`buildPerspectiveMemoryReuseQualityReview`.

The panel is derived from the current reuse packet context:

- selected persisted perspective-memory items
- task title and task description
- per-item `why_selected`
- per-item `reuse_boundary`
- current `codex_memory_brief_metadata`
- current reuse `packet_id`

The panel shows:

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

The panel is not dogfood evidence and is not route validation. It is only a
quality review preview state for the current operator-selected reuse context.
It uses mechanical checks only and makes no semantic truth claim.

## Authority Boundary

This is preview-only deterministic local review.

It does not:

- create persistence
- create quality review persistence
- create perspective-memory persistence writes
- persist reuse packets
- persist return bindings
- change DB schema or migrations
- create product boundary records
- write proof/evidence rows
- create memory items
- mutate memory items
- mutate Augnes state
- run provider/model calls
- call OpenAI API
- execute Codex SDK
- call MCP tools
- start the MCP bridge
- mutate GitHub
- start runtime
- create hidden background daemons
- perform automatic synthesis
- perform automatic memory creation
- grant Augnes state commit/reject authority

## Storage Decision

This preview does not justify storage. The review packet is copyable local
operator material only. A persisted quality review table should wait until
repeated dogfood shows a concrete product reason.

Boundary marker: preview-only mechanical checks only; does not claim semantic truth; no persistence, no provider/model calls, no GitHub mutation, and no quality review persistence.

## Next recommended PR

Dogfood the quality review preview with the live-data seeded reuse route output.
Only consider persistence after repeated review shows a concrete product reason.
