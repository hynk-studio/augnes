# Perspective Codex Former Constellation Preview Fixture Surface Design

Conclusion: PASS with follow-up.

## Summary

This report records the design-only surface contract for a future read-only Constellation Preview over the PR #501 adapted fixture data.

## Why Follows PR #501

PR #501 produced UI-ready but non-UI preview data with display policy, graph display nodes and edges, summary panel, warning panel, Authority Lens, detail drawers, legend, privacy, and authority flags. This PR defines how those adapted fixtures should be arranged in a future surface without rendering UI.

## Surface Design Scope

The scope is docs/report/smoke/package only. It defines future presentation behavior for a read-only fixture-backed Constellation Preview. It does not implement UI, routes, runtime browser surfaces, persistence, provider calls, Codex SDK calls, GitHub mutations, clipboard automation, accepted state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.

## Input Fixture Dependencies

- `lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`
- `reports/2026-06-10-perspective-codex-former-constellation-preview-data-adapter.md`

## Surface Regions

The design defines six regions:

- Summary Strip
- Graph Canvas
- Warning Panel
- Authority Lens
- Detail Drawer
- Legend

Default view should emphasize graph comprehension, the current status, and minimal badges. Detail Drawer and Authority Lens handle deeper inspection.

## PASS with follow-up Surface Behavior

The PASS with follow-up fixture should show PASS with follow-up in the Summary Strip, expose needs_review / pointer warning caveat text, show source input through next action in the Graph Canvas, keep warning pressure visible but collapsed by default, and make Authority Lens available but disabled.

The graph should include review candidate, worker guidance, and next action nodes as review-only/advisory material. No accepted-state wording should appear.

## BLOCKED Surface Behavior

The BLOCKED fixture should show BLOCKED in the Summary Strip, render the blocked validation path, omit review candidate, worker guidance, and next action nodes, keep blocking reasons open or prominent by default, and map blocked edges to blocked style.

The surface should not imply usable candidate material.

## Progressive Disclosure

The display hierarchy is:

- default view: graph plus summary strip plus minimal badges
- hover/focus: compact summary and primary caveat
- click/select: detail drawer
- Authority Lens toggle: expert authority inspection
- warning panel: grouped caveats and blocking reasons

## Accessibility and Browser Validation Plan

Accessibility planning covers keyboard traversal through Summary Strip, Graph Canvas nodes and edges, Warning Panel, Authority Lens, Detail Drawer, and Legend. Warning and blocked states require non-color indicators, and screen-reader labels must avoid dumping every authority flag by default.

Future browser/computer-use validation should verify PASS and BLOCKED fixture screenshots, badge density, blocked path rendering, warning panel behavior, Authority Lens default collapsed state, detail drawer coverage, keyboard traversal, and absence of accepted-state implication.

## Privacy/Redaction Handling

Public docs and reports must not echo raw unsafe/private marker literals. The future surface must never render raw private/source/provider payloads or omitted unsafe fields as raw values. Adapted fixtures are bounded summaries only.

## Authority Boundary

This design creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutation, UI implementation, approval, merge, deploy, or Core decision.

## Verification

The smoke verifies the design doc, report, package script, required surface regions, fixture-specific behavior, progressive disclosure, badge/tone policy, empty/error states, accessibility plan, future browser/computer-use validation plan, privacy/redaction boundary, authority boundary, changed-file scope, and absence of forbidden implementation surfaces.

## Skipped Checks With Reasons

- Browser/computer-use validation: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.
- Runtime UI validation: not applicable because this PR is design-only docs/report/smoke/package work.
- Provider/model, Codex SDK, DB, and GitHub mutation checks: not applicable because this PR adds no such behavior.

## Recommended Next PR

Add read-only Constellation Preview fixture surface implementation.

The implementation must remain read-only, fixture-backed, and browser-validated.

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.
