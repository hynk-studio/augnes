# Perspective Codex Former Constellation Preview Data Adapter v0.1

Conclusion: PASS with follow-up

## Purpose

This document defines the read-only Codex Former constellation preview data adapter. The adapter transforms a `CodexFormerConstellationProjectionV0` object into a UI-ready but non-UI preview data shape for future Constellation Preview work.

The projection contract remains the graph truth. The adapter only derives display-oriented read data: compact node labels and badges, edge labels and line-style hints, warning grouping, detail drawer payloads, Authority Lens payloads, summary panels, and legends.

## Why Follows PR #500

PR #500 added deterministic PASS with follow-up and BLOCKED projection fixture previews and recommended the next PR: Add read-only Codex Former constellation preview data adapter. This adapter follows that recommendation by adapting the committed PR #500 projection fixtures without changing the projection builder or implementing UI.

## Adapter Is Read-Only

The adapter is deterministic and read-only. It takes an existing projection object, copies it, and returns a new preview data object.

It does not mutate the projection, write persistence, create accepted Augnes state, create proof/evidence/readiness records, call providers, call the Codex SDK, mutate GitHub, automate clipboard behavior, render UI, add routes, deploy, approve, merge, or make Core decisions.

## Input Projection

The builder accepts:

- `projection: CodexFormerConstellationProjectionV0`
- optional `generated_at`
- optional `preview_context.surface_label`
- optional `preview_context.intended_surface`

Supported intended surfaces are future-facing labels such as:

- `constellation_preview`
- `codex_session_panel`
- `capture_review_inbox`

The projection remains the source of truth for nodes, edges, statuses, warnings, privacy, and false authority flags.

## Output Preview Data Shape

The adapter returns `codex_former_constellation_preview_data.v0.1` with kind `codex_former_constellation_preview_data`.

The output contains:

- `source_projection`
- `display_policy`
- `graph`
- `summary_panel`
- `warning_panel`
- `authority_lens`
- `detail_drawers`
- `legend`
- `privacy`
- `authority_flags`

This shape is a future UI read model, not a route response contract, DB schema, runtime state, or review decision.

## Display Node Model

Each display node includes:

- `id`
- `source_node_id`
- `kind`
- `label`
- `status`
- `authority`
- `badges`
- `tone`
- `compact_summary`
- `warning_count`
- `detail_drawer_id`
- `authority_lens_tags`

Rules:

- Badges are limited to at most two items.
- Labels and compact summaries are short and bounded.
- `blocked` projection nodes map to `blocked` tone.
- `needs_review` and pointer warning nodes map to `warning` tone.
- Review-only, non-committed, advisory-only, and pointer-only nodes map to review-oriented tones unless blocked or warning pressure is present.
- `future_only` is reserved for future schema values and is not emitted by current workflow fixtures.
- Accepted state is not emitted as current state.

## Display Edge Model

Each display edge includes:

- `id`
- `source_edge_id`
- `from`
- `to`
- `relation`
- `label`
- `status`
- `authority_boundary`
- `line_style`
- `tone`
- `warning_count`
- `detail_drawer_id`
- `authority_lens_tags`

Line-style rules:

- `prepared`, `returned`, `validated`, and plain `informs` map to `solid`.
- `suggests` and advisory-only edges map to `dashed`.
- `pointer_only` edges map to `dotted`.
- `blocked_by`, blocked status, and blocked authority boundaries map to `blocked`.

Edges reference display node ids and do not emit accepted, final, or committed styling for current workflow fixtures.

## Display Policy

The adapter emits a fixed display policy:

- `default_badge_limit: 2`
- `default_view_shows_full_authority_flags: false`
- `hover_view_enabled: true`
- `detail_drawer_enabled: true`
- `authority_lens_available: true`
- `red_reserved_for_blocked: true`
- `amber_reserved_for_warning_or_needs_review: true`
- `review_only_is_normal_state: true`

Default graph data stays compact. Full authority flags belong in detail drawers and Authority Lens payloads, not every default label.

## Warning Panel

The warning panel includes:

- `warning_count`
- `pointer_warning_count`
- `grouped_warnings`
- `blocked_reasons`
- `has_blocking_warnings`
- `has_pointer_warnings`
- `default_collapsed`

Duplicate or synthetic pointer warning pressure is grouped into compact warning groups. PASS with follow-up shows pointer warning pressure without making the graph blocked. BLOCKED shows blocking reasons and `has_blocking_warnings: true`.

## Authority Lens

Authority Lens is available but disabled by default. It is inspectability only, not authority.

Tags may include:

- `review_only`
- `non_committed`
- `advisory_only`
- `pointer_only`
- `blocked`
- `provenance_mismatch`
- `no_accepted_state`
- `no_db_write`
- `no_provider_call`
- `no_codex_sdk_call`
- `no_github_mutation`
- `no_core_decision`

Authority Lens must not hide critical caveats. It separates expert inspection from the default graph so normal view is not overloaded with negative authority strings.

## Detail Drawers

Detail drawers are generated for:

- summary
- warning panel
- Authority Lens
- each display node
- each display edge

Drawer rows expose bounded key/value data such as provenance refs, detail refs, source hashes, candidate count, metadata match, warning summaries, blocked reasons, authority flags, privacy status, and validation status.

Rules:

- No raw private/source/provider payloads.
- No giant rows.
- Bounded strings only.
- Accepted state must not appear as current state.

## Legend

The legend explains:

- node tones
- edge line styles
- badges
- Authority Lens tags

Future UI can use the legend to render explanations without guessing from internal strings.

## PASS with follow-up Adaptation

The PASS with follow-up adapted fixture is built from:

`reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json`

Expected qualities:

- Preview version and kind are present.
- Source projection points to the PR #499 projection version and kind.
- Graph node count matches projection node count.
- Graph edge count matches projection edge count.
- `review_candidate`, `worker_guidance`, and `next_action` display nodes exist.
- Warning panel shows pointer warning pressure.
- Summary panel is review-only and not accepted state.
- Authority Lens is available and disabled by default.
- No `future_only` tone appears in current fixtures.

## BLOCKED Adaptation

The BLOCKED adapted fixture is built from:

`reports/fixtures/2026-06-10-codex-former-constellation-blocked.json`

Expected qualities:

- Overall status is `blocked`.
- Graph includes validation summary and warning/blocking display nodes.
- Graph does not include `review_candidate`, `worker_guidance`, or `next_action` display nodes.
- Warning panel shows blocking warnings.
- Blocked edges map to `blocked` line style.
- Summary panel is review-only and not accepted state.
- Authority Lens is available and disabled by default.
- No `future_only` tone appears in current fixtures.

## Privacy Boundary

The adapter preserves projection privacy fields:

- `raw_payloads_included: false`
- `bounded_summaries_only: true`

Public docs, reports, and fixture JSON must not echo raw unsafe/private marker literals or raw private/source/provider payload examples.

## Authority Boundary

This adapter does not create accepted Augnes state, proof/evidence/readiness records, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, UI, routes, runtime browser surfaces, approvals, merges, deploys, or Core decisions.

The adapted fixture JSON is review-only preview data. It is not accepted-state automation.

## Future Relationship To Read-Only Constellation Preview

A future read-only Constellation Preview can consume this data shape to render a compact graph, summary panel, warning panel, Authority Lens, detail drawers, and legend. That future UI work still needs separate browser/computer-use validation for badge density, hover/focus summaries, detail drawer contents, blocked and needs_review states, keyboard navigation, warning readability, and Authority Lens caveat visibility.

## Recommended Next PR

Add read-only Constellation Preview fixture surface design.
