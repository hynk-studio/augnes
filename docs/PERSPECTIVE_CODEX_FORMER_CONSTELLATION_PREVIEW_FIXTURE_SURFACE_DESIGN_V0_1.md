# Perspective Codex Former Constellation Preview Fixture Surface Design v0.1

Conclusion: PASS with follow-up

## Purpose

This design defines the future read-only Constellation Preview surface for Codex Former fixture data after PR #501.

This PR is design-only. It implements no UI, adds no route, adds no runtime browser surface, and creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, approvals, merges, deploys, or Core decisions.

## Why Follows PR #501

PR #501 converted projection fixtures into preview data with `display_policy`, graph display nodes and edges, `summary_panel`, `warning_panel`, `authority_lens`, `detail_drawers`, `legend`, `privacy`, and `authority_flags`.

This design defines how that preview data should be arranged in a future read-only Constellation Preview surface. It does not render that surface.

## Surface Thesis

The Constellation Preview should let a user understand what Codex work produced, what candidate material exists, what validation concluded, what warnings remain, and why the material is review-only, without overwhelming the user with every authority flag by default.

## Input Data Dependency

The future surface depends on the PR #501 preview data adapter and fixtures:

- `lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`
- `reports/2026-06-10-perspective-codex-former-constellation-preview-data-adapter.md`

The adapted fixture data remains the input contract. This document only describes future presentation behavior.

## Surface Regions

### Summary Strip

Uses:

- `summary_panel.primary_status_label`
- `summary_panel.primary_caveat_label`
- `summary_panel.next_safe_action_label`
- `summary_panel.is_review_only`
- `summary_panel.is_accepted_state`

Rules:

- Show PASS with follow-up or BLOCKED prominently.
- Show review-only as a normal state, not as an emergency.
- Never show accepted-state wording for current fixtures.
- The next action label must be advisory, not decision authority.
- If `summary_panel.is_accepted_state` is false, the strip must not use committed-memory, saved-state, approved, ready, or accepted language.

### Graph Canvas

Uses:

- `graph.nodes`
- `graph.edges`
- `display_policy`
- `legend`

Rules:

- Default nodes show label, tone, status, and at most two badges.
- Default edges show relation label and line style.
- Warning and badged nodes remain visible but not noisy.
- The blocked graph clearly stops before `review_candidate`, `worker_guidance`, and `next_action`.
- PASS with follow-up shows `review_candidate`, `worker_guidance`, and `next_action` as review-only/advisory material.
- The default graph does not show every negative authority flag.
- The graph canvas treats `review` tone as normal inspection material, `warning` tone as review pressure, and `blocked` tone as a stopped path.

### Warning Panel

Uses:

- `warning_panel.warning_count`
- `warning_panel.pointer_warning_count`
- `warning_panel.grouped_warnings`
- `warning_panel.blocked_reasons`
- `warning_panel.has_blocking_warnings`
- `warning_panel.has_pointer_warnings`
- `warning_panel.default_collapsed`

Rules:

- PASS with follow-up should show pointer warning pressure without making the graph look blocked.
- BLOCKED should keep blocking reasons visible by default.
- If `pointer_warning_count` is zero but a non-blocked warning exists, the surface should label it as general warning pressure unless the warning group explicitly says pointer warning pressure.
- Warning panel content must not hide critical caveats.
- Warning summaries stay grouped and bounded; full details belong in the detail drawer.

### Authority Lens

Uses:

- `authority_lens.available`
- `authority_lens.default_enabled`
- `authority_lens.tags`
- `authority_lens.flags`

Rules:

- The lens is hidden or collapsed by default.
- The lens is available for expert inspection.
- The lens must not hide critical caveats.
- The lens must not grant decision authority.
- Tags such as `no_accepted_state`, `no_db_write`, `no_provider_call`, `no_codex_sdk_call`, `no_github_mutation`, and `no_core_decision` appear only in Authority Lens or detail contexts, not as default graph labels.

### Detail Drawer

Uses:

- `detail_drawers`

Rules:

- Opens for summary, warning panel, Authority Lens, node, or edge selections.
- Shows bounded rows only.
- Includes provenance refs, detail refs, source hashes, metadata match, candidate count, validation status, warning summaries, blocked reasons, privacy, and authority flags when relevant.
- Shows no raw private/source/provider payloads.
- Shows no giant rows.
- Accepted state must not appear as current state.
- Drawer rows should be easy to scan and grouped by status, source, provenance, warnings, privacy, and authority as appropriate.

### Legend

Uses:

- `legend.node_tones`
- `legend.edge_line_styles`
- `legend.badges`
- `legend.authority_lens_tags`

Rules:

- Supports explanation without exposing internal jargon as default graph clutter.
- Maps warning, blocked, and review tone in human-readable language.
- Explains dashed, dotted, solid, and blocked line styles.
- Explains badge meaning without requiring every node to repeat the same authority text.

## Fixture-Specific Surface Behavior

### PASS with follow-up Fixture

The PASS with follow-up surface should present:

- Summary strip: PASS with follow-up, needs_review / pointer warning caveat, and advisory next action.
- Graph: source input through next action visible.
- `review_candidate` node visible.
- `worker_guidance` node visible.
- `next_action` node visible.
- Warning panel collapsed by default while visibly indicating warning pressure.
- Authority Lens available but disabled.
- Detail drawer exposes `non_committed`, source hashes, metadata match, candidate count, warnings, privacy, and authority flags.
- No accepted state shown.

The graph should look reviewable and useful, but not committed or approved.

### BLOCKED Fixture

The BLOCKED surface should present:

- Summary strip: BLOCKED.
- Graph: blocked validation path visible.
- No `review_candidate` node.
- No `worker_guidance` node.
- No `next_action` node.
- Warning panel open or prominent by default.
- Blocked edges use blocked style.
- Detail drawer explains provenance mismatch, multiple candidates, and blocked validation reasons.
- No accepted state shown.
- No usable candidate implication.

The graph should clearly communicate that validation stopped review-candidate use.

## Progressive Disclosure

The future surface should use this hierarchy:

- Default view: graph plus summary strip plus minimal badges.
- Hover/focus: compact summary and primary caveat.
- Click/select: detail drawer.
- Authority Lens toggle: expert authority inspection.
- Warning panel: grouped caveats and blocking reasons.

The default view is for comprehension. The detail drawer and Authority Lens are for inspection.

## Badge And Tone Policy

Rules:

- Show at most two badges by default.
- Review-only is a normal state.
- Blocked is the only red/emergency state.
- `needs_review`, pointer warning, and general warning pressure use warning/amber treatment.
- Advisory-only should not look like a command.
- `non_committed` should not look like accepted memory.
- Default graph labels should not repeat all false authority flags.

## Empty And Error States

These are design-only states for future implementation:

- No fixture loaded: show an empty read-only preview state that says fixture preview data is not loaded yet.
- Invalid preview data: show an invalid data state and direct the user to inspect validation details; this may be a real data error.
- Missing graph nodes: show invalid graph data because the preview cannot draw nodes.
- Edge references missing node: show invalid graph data and identify the missing node id in detail context.
- Unsupported `preview_version`: show unsupported fixture version and avoid rendering assumptions.
- Blocked fixture: show a valid blocked state, not a system failure.
- Privacy/sanitization omission present: show that unsafe material was omitted and keep raw values hidden.

Only invalid data should look like system failure. A blocked fixture is a valid review result.

## Accessibility And Keyboard Plan

Future keyboard traversal order:

1. Summary strip
2. Graph nodes
3. Graph edges
4. Warning panel
5. Authority Lens
6. Detail drawer
7. Legend

Accessibility requirements:

- Selected node and edge states must have visible focus styles.
- Screen-reader labels should use node label, status, authority, and tone without dumping all authority flags.
- Blocked and warning states must have non-color indicators.
- Detail drawer rows must be readable and bounded.
- Warning panel and Authority Lens toggles must expose expanded/collapsed state.
- The graph must remain usable without hover-only disclosure.

## Browser/Computer-Use Validation Plan

This PR adds no UI, so browser/computer-use validation is skipped.

The first UI PR should validate:

- PASS fixture default graph density.
- BLOCKED fixture blocked path.
- At most two badges per node.
- Warning panel collapsed/open rules.
- Authority Lens hidden by default and accessible.
- Detail drawer opens for summary, warning panel, Authority Lens, nodes, and edges.
- No accepted-state implication.
- Keyboard traversal through summary, graph, warning panel, Authority Lens, detail drawer, and legend.
- Warning and blocked states are readable without color alone.
- Browser/computer-use screenshots against PASS and BLOCKED fixtures.

## Privacy And Redaction

Public docs and reports must not echo raw unsafe/private marker literals.

The future surface must not render raw private/source/provider payloads. Adapted fixtures are bounded summaries only. If preview data says unsafe fields were omitted, the UI surface must show that omission as a bounded status and must never render omitted unsafe fields as raw values.

## Authority Boundary

This design does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, UI implementation, approvals, merges, deploys, or Core decisions.

The future implementation must remain read-only, fixture-backed, and browser-validated unless a later PR explicitly scopes something else.

## Future Implementation Sequence

Recommended phases:

- Add read-only Constellation Preview fixture surface implementation.
- Browser/computer-use validation for fixture surface.
- Codex Session Perspective Panel fixture design.
- Capture Review Inbox fixture design.
- Codex integration adapter design.

Immediate next PR:

Add read-only Constellation Preview fixture surface implementation.

The implementation must be read-only, fixture-backed, and browser-validated.
