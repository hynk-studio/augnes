# Perspective Codex Former Constellation Preview Fixture Surface Implementation v0.1

Conclusion: PASS with follow-up

## Purpose

This document records the first read-only, fixture-backed Constellation Preview surface for Codex Former preview data.

The surface renders the adapted PR #501 preview-data fixtures through a local deterministic Next.js page. It exists so reviewers can inspect PASS with follow-up and BLOCKED fixture states before any product surface starts consuming runtime capture, provider output, GitHub data, DB state, or accepted Augnes state.

## Why Follows PR #502

PR #502 defined the design contract for the read-only Constellation Preview fixture surface. This implementation follows that contract by rendering the same regions described there:

- Summary Strip
- Graph Canvas
- Warning Panel
- Authority Lens
- Detail Drawer / Details Panel
- Legend
- empty and invalid fixture states

The implementation does not extend PR #501 adapter behavior or mutate the PR #500 / PR #501 fixtures.

## Surface Is Read-Only

The page is local/static/deterministic and fixture-backed. It imports committed JSON fixture data and renders it in React state only.

It does not add accepted Augnes state, proof/evidence/readiness record creation, provider/model calls, Codex SDK calls, GitHub mutation behavior, DB writes or migrations, clipboard automation, approval, merge, deploy, or Core decision behavior.

## Fixture Inputs

The only rendered fixture inputs are:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

The page imports those files directly from:

- `app/cockpit/perspective/codex-former/constellation-preview-fixture/page.tsx`

## Route / Surface Path

The implemented route is:

`/cockpit/perspective/codex-former/constellation-preview-fixture`

This keeps the surface under the existing Cockpit/Perspective route vocabulary while avoiding changes to the dense default Cockpit shell.

## Summary Strip Implementation

The Summary Strip renders:

- `summary_panel.primary_status_label`
- `summary_panel.primary_caveat_label`
- `summary_panel.next_safe_action_label`
- `summary_panel.is_review_only`
- `summary_panel.is_accepted_state`

PASS with follow-up uses review styling and explicitly shows that accepted Augnes state is false. BLOCKED uses the only emergency treatment in the surface and is labeled as a stopped result. The next safe action is rendered as advisory copy, not a command button.

## Graph Canvas Implementation

The Graph Canvas renders `graph.nodes` and `graph.edges` as accessible read-only buttons.

Nodes show label, status, tone, compact summary, and at most two badges. Edges show source, target, relation label, line style, and status. Selecting a node or edge only changes local React state for the Details Panel.

The PASS fixture includes:

- `node:review_candidate`
- `node:worker_guidance`
- `node:next_action:1`

The BLOCKED fixture omits those nodes and stops at validation / warning nodes.

## Warning Panel Implementation

The Warning Panel renders:

- warning count
- pointer warning count
- grouped warnings
- blocked reasons
- blocking and pointer-warning booleans
- fixture default collapsed/open state

PASS with follow-up is collapsed by default but its summary still shows warning pressure. BLOCKED is open by default and shows blocked reasons as a valid review result, not as a system failure.

If pointer warning count is zero while warnings exist, the surface labels the state as general warning pressure unless the fixture group label says otherwise.

## Authority Lens Implementation

The Authority Lens renders:

- availability
- default enabled state
- summary
- tags
- false authority flags

The lens is collapsed / disabled by default through fixture data. Expanding it is local UI state only and does not imply decision authority.

Tags such as `no_accepted_state`, `no_db_write`, `no_provider_call`, `no_codex_sdk_call`, `no_github_mutation`, and `no_core_decision` appear in the Authority Lens or details context instead of being repeated on every graph node.

## Detail Drawer / Details Panel Implementation

The Details Panel renders `detail_drawers` for:

- summary
- warning panel
- Authority Lens
- nodes
- edges

Selecting any supported region shows the matching drawer. Rows are bounded to twelve per section and displayed as readable label/value pairs. The panel includes source hashes, metadata match, candidate count, validation status, warning summaries, blocked reasons, privacy, and authority details when present in the fixture drawer.

The surface does not render private/source/provider payloads.

## Legend Implementation

The Legend renders:

- `legend.node_tones`
- `legend.edge_line_styles`
- `legend.badges`
- `legend.authority_lens_tags`

It is collapsed by default so the graph stays readable while still making tone, line style, badge, and Authority Lens tag meaning available.

## PASS with follow-up Behavior

The PASS with follow-up fixture defaults to selected.

Expected visible behavior:

- PASS with follow-up appears prominently.
- Review-only and accepted-state false are visible.
- Warning pressure is visible but the warning panel is collapsed by default.
- `review_candidate`, `worker_guidance`, and `next_action` nodes appear as review-only/advisory material.
- Authority Lens exists and is collapsed by default.
- No accepted-state wording is used for current fixture state.

## BLOCKED Behavior

The BLOCKED fixture is selectable through the fixture tabs.

Expected visible behavior:

- BLOCKED appears prominently as a stopped validation result.
- Warning Panel is open by default.
- blocked line styles and blocked text indicators are visible.
- `review_candidate`, `worker_guidance`, and `next_action` are not rendered as usable material.
- BLOCKED is treated as a valid fixture result rather than a system failure.

## Accessibility Notes

The surface includes semantic headings, keyboard-accessible fixture tabs, keyboard-accessible graph nodes and edges, keyboard-accessible `details` expand/collapse controls, visible focus states, non-color warning/blocked indicators, and accessible labels for graph nodes and edges.

No information is hover-only. The detail panel is reachable by keyboard through node, edge, summary, warning, and Authority Lens controls.

## Browser/Computer-Use Validation

Browser/computer-use validation is required for this UI PR.

Validation target:

`/cockpit/perspective/codex-former/constellation-preview-fixture`

Validation report:

`reports/browser/2026-06-11-perspective-codex-former-constellation-preview-fixture-surface.md`

The report covers PASS default view, BLOCKED view, fixture switching, Summary Strip, Graph Canvas, Warning Panel, Authority Lens collapsed and expanded states, node and edge detail selection, Legend visibility, at-most-two-badge rendering, non-color warning/blocked indicators, and absence of raw unsafe/private marker text.

## Privacy Boundary

The page renders bounded fixture summaries only. It does not call capture helpers, provider/model APIs, Codex SDK, GitHub APIs, DB APIs, runtime ingestion pipelines, external network, local storage, session storage, or clipboard automation.

## Authority Boundary

This implementation does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, approvals, merges, deploys, or Core decisions.

The Authority Lens is inspectability only.

## Known Caveats

- The graph is a simple read-only list layout, not a physics graph.
- Invalid fixture state coverage is implemented through the pure validation helper and smoke script rather than a separate public route.
- The surface is intentionally fixture-backed and does not load arbitrary preview files.

## Recommended Next PR

Design Codex Session Perspective Panel fixture surface.

## Conclusion

PASS with follow-up.
