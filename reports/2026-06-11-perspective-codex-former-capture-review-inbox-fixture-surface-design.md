# Perspective Codex Former Capture Review Inbox Fixture Surface Design

## Summary

Added a design-only contract for the future Capture Review Inbox fixture surface.

The inbox is intended to review multiple Codex Former capture review items at a list/queue level without implying that any item is accepted Augnes state.

This PR adds no UI, route, runtime browser surface, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, Core decisions, live Codex capture, review decision records, accept/promote/reject actions, or runtime fixture mutation.

## Why Follows PR #505

PR #505 implemented the read-only Codex Session Perspective Panel fixture route:

`/cockpit/perspective/codex-former/session-perspective-panel-fixture`

That route shows perspective-formation status for one work/session. This design defines the complementary inbox that would collect multiple capture review items and help a human triage what to inspect next.

## Design Scope

Changed scope:

- design doc;
- report;
- smoke script;
- package script.

No app route, component, CSS, fixture JSON, preview data adapter behavior, projection builder behavior, capture helper behavior, DB schema, provider/model integration, Codex SDK integration, GitHub mutation code, Constellation Preview implementation, or Session Perspective Panel implementation was changed.

## Relationship to Session Panel and Constellation Preview

The Session Perspective Panel is single-work/session workflow status.

The Constellation Preview is graph/relationship inspection.

The Capture Review Inbox is multi-item triage and review queue.

The inbox may eventually link to the Session Panel or Constellation Preview as read-only navigation. It should not duplicate the full graph or full session timeline by default, and it must not implement accept/promote/reject decisions.

## Fixture Item Types

The design uses PR #501 adapted preview-data fixtures as examples:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Defined item types:

- Pending preparation: source input is not prepared, no candidate, no validation, reviewability `not_ready`.
- Waiting for returned candidate: source input and manual packet are ready, returned envelope missing, reviewability `waiting`.
- PASS with follow-up: PASS adapted fixture, review candidate exists but remains `non_committed`, reviewability `reviewable_with_follow_up`.
- BLOCKED returned material: BLOCKED adapted fixture, blocked reasons visible, no usable review candidate, reviewability `blocked`.
- Empty inbox: no capture review items, not an error, reviewability `empty`.

## Inbox Regions

Defined future inbox regions:

- Inbox Header
- Filter / Group Bar
- Review Item List
- Selected Item Summary
- Warning / Blocking Triage
- Authority Boundary Box
- Safe Next Actions
- Empty / Invalid State

Each region is design-only and has no executable behavior in this PR.

## Reviewability Taxonomy

First-pass taxonomy:

- `empty`: no items available, not error.
- `not_ready`: prerequisites are missing.
- `waiting`: source/prompt are ready but candidate is missing.
- `reviewable_with_follow_up`: candidate exists, direct validation allows review-compatible material, and caveats remain.
- `blocked`: validation blocks usable review material.
- `invalid_data`: fixture or surface data cannot be trusted.

## PASS with follow-up Inbox Behavior

PASS with follow-up should show:

- card status `PASS with follow-up`;
- reviewability `reviewable_with_follow_up`;
- needs_review / pointer warning pressure caveat;
- `non_committed` and `review_only` authority;
- Session Panel inspection available;
- Constellation Preview read-only inspection available;
- safe next action to inspect Session Panel or Constellation Preview, then human review;
- no accepted state and no approve/promote control.

## BLOCKED Inbox Behavior

BLOCKED should show:

- card status `BLOCKED`;
- reviewability `blocked`;
- blocked reasons prominent;
- no usable review candidate;
- safe next action to correct provenance/candidate count or rerun capture path;
- Session Panel status inspection available;
- Constellation Preview not available as usable candidate graph;
- no accepted state and no usable-candidate implication.

## Pending / Waiting Inbox Behavior

Pending preparation should show missing source input / prepare packet as `not_ready`, with guidance to create bounded source input and run the prepare helper.

Waiting for candidate should show source input and packet ready, returned candidate missing, reviewability `waiting`, and guidance to return exactly one candidate envelope.

Both states may allow Session Panel status inspection in a future implementation, but Constellation Preview is not ready.

## Empty Inbox Behavior

Empty inbox should show no items yet, not an error.

The safe next action is to prepare bounded source input or run the capture helper. No warnings appear unless the source is invalid. No accepted state exists.

## Accessibility and Browser Validation Plan

The design defines keyboard traversal through Inbox Header, Filter / Group Bar, Review Item List, Selected Item Summary, Warning / Blocking Triage, Authority Boundary Box, Safe Next Actions, and Empty / Invalid State when present.

List items must be reachable by keyboard, selected item state must be visible, statuses must not rely on color alone, screen-reader labels should include item title/status/reviewability/caveat/next safe action, collapsed regions must expose expanded/collapsed state, and no information should be hover-only.

Browser/computer-use validation is skipped for this PR because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Future browser validation should cover Empty inbox, Pending preparation, Waiting, PASS with follow-up, BLOCKED, filters, selected PASS/BLOCKED items, Session Panel link affordance, PASS-only Constellation Preview handoff, blocked/pending/waiting no-usable-handoff behavior, at-most-two badges, non-color warning/blocked indicators, no accepted-state implication, no approve/promote/reject controls, no executable prepare/validate/Codex/GitHub/DB controls, no raw unsafe/private markers, no external network/provider/Codex/GitHub/DB traffic, mobile/narrow layout, and keyboard traversal.

## Privacy/Redaction Handling

The inbox must use bounded summaries only.

It must not show raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs and reports must not echo raw unsafe/private marker literals.

## Authority Boundary

The design creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, review decision records, accept/promote/reject actions, runtime fixture mutation, or live Codex capture.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-capture-review-inbox-fixture-surface-design`
- `git diff --check`
- `git diff --cached --check`

Relevant upstream smokes were run and failed only on older strict changed-file guards:

- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-design` failed with `session panel fixture surface design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-implementation` failed with `session panel fixture implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation` failed with `fixture surface implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_CAPTURE_REVIEW_INBOX_FIXTURE_SURFACE_DESIGN_V0_1.md`.

Those prior-stage guards were not widened because this PR is the next design stage, and the requested scope said not to spend time making unrelated historical changed-file guards accept this design PR unless they are clearly intended to track this exact stage.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

No provider/model, Codex SDK, DB, GitHub mutation, live capture, runtime fixture mutation, review decision, accept, promote, or reject checks were added beyond smoke/source boundary checks because those surfaces are intentionally absent.

## Recommended Next PR

Add read-only Capture Review Inbox fixture implementation.

## What Codex Did Not Do

Codex did not implement UI, add a route, add a runtime browser surface, call Codex, integrate Codex SDK, call provider/model APIs, add DB persistence, mutate GitHub, automate clipboard use, create accepted Augnes state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, mutate fixtures, modify capture helpers, modify projection builders, modify preview data adapters, modify the PR #503 Constellation Preview implementation, or modify the PR #505 Session Perspective Panel implementation.
