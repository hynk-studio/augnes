# Perspective Codex Former Session Perspective Panel Fixture Surface Design

## Summary

Added a design-only contract for the future Codex Session Perspective Panel fixture surface.

The panel is intended to sit inside, beside, or near a Codex work session and show perspective-formation status without implying that Codex output is accepted Augnes state.

This PR adds no UI and does not implement UI, route, runtime browser surface, no DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.

Boundary summary: does not implement UI; adds no route; no runtime browser surface; no DB persistence; no provider/model calls; no Codex SDK calls; no GitHub mutation; no clipboard automation.

## Why Follows PR #503

PR #503 implemented the read-only fixture-backed Constellation Preview route:

`/cockpit/perspective/codex-former/constellation-preview-fixture`

That route answers where a Codex Former candidate sits in the graph. This design defines the complementary session-side panel that answers what formation state exists, what is missing, what caveats remain, and whether Constellation Preview inspection is safe.

## Design Scope

Changed scope:

- design doc;
- report;
- smoke script;
- package script.

No app route, component, CSS, fixture JSON, adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, GitHub mutation code, or capture helper behavior was changed.

## Relationship to Constellation Preview

The Session Perspective Panel is workflow/status oriented.

The Constellation Preview is graph/relationship oriented.

The Session Panel may eventually link to or hand off to Constellation Preview, but it should not duplicate the full graph. It should summarize enough to tell the user whether candidate material is ready for read-only graph inspection.

The current Constellation Preview implementation remains read-only and fixture-backed.

## Fixture Scenarios

The design uses PR #501 adapted preview-data fixtures as examples:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Defined scenarios:

- Not prepared: no source input, no packet, no candidate, no validation, no graph handoff.
- Waiting for returned candidate: source input and manual packet exist, but returned candidate is missing and validation has not run.
- PASS with follow-up: PASS adapted fixture, `needs_review` / pointer warning pressure visible, review candidate exists but remains `non_committed`.
- BLOCKED: BLOCKED adapted fixture, blocked validation reasons visible, no usable review candidate and no usable graph handoff.

## Panel Regions

Defined future panel regions:

- Session Header
- Formation Timeline
- Status Card
- Evidence / Provenance Strip
- Warning / Blocking Summary
- Authority Boundary Box
- Action Guidance
- Constellation Handoff Preview

Each region is design-only and has no executable behavior in this PR.

## PASS with follow-up Panel Behavior

The PASS with follow-up panel should show:

- PASS with follow-up / review-only header;
- completed formation timeline through returned candidate and validation;
- review candidate available but `non_committed`;
- Constellation Preview inspection available for read-only graph inspection;
- warning pressure visible but not blocked-looking;
- `review_only`, `non_committed`, and advisory-only boundaries;
- no accepted state and no approval-looking action.

## BLOCKED Panel Behavior

The BLOCKED panel should show:

- BLOCKED / stopped review result header;
- validation blocked;
- review candidate unavailable;
- Constellation handoff unavailable as usable material;
- blocked reasons open or prominent;
- blocked/review-only/no accepted-state authority;
- guidance to correct provenance/candidate count or rerun capture path.

## Not Prepared Panel Behavior

The Not prepared panel should show:

- source input not ready;
- prepare not run;
- no returned candidate;
- no validation;
- missing prerequisites as pending, not failure;
- guidance to create bounded source input JSON and run the prepare helper;
- no graph handoff.

## Waiting For Candidate Panel Behavior

The Waiting for candidate panel should show:

- source input complete;
- prepare packet complete;
- separate Codex session waiting;
- returned candidate missing;
- validation not run;
- guidance to paste the copy packet into a separate user-started Codex session and return exactly one candidate envelope;
- no accepted state and no graph handoff yet.

## Accessibility and Browser Validation Plan

The design defines future keyboard traversal through:

1. Session Header
2. Formation Timeline
3. Status Card
4. Evidence / Provenance Strip
5. Warning / Blocking Summary
6. Authority Boundary Box
7. Action Guidance
8. Constellation Handoff Preview

Future implementation must use non-color warning/blocked indicators, screen reader labels with status/caveat/review-only/next-safe-action context, exposed expanded/collapsed state, and no hover-only information.

Browser/computer-use validation was skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture.

Future implementation browser/computer-use validation must cover Not prepared, Waiting for candidate, PASS with follow-up, and BLOCKED scenarios; desktop side-panel density; mobile/narrow layout; keyboard traversal; non-color warning/blocked indicators; no accepted-state implication; Constellation handoff state; no raw unsafe/private markers; and no external network/provider/Codex/GitHub/DB traffic.

## Privacy/Redaction Handling

The future panel must use bounded summaries only.

It must not show raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs and reports must not echo raw unsafe/private marker literals.

## Authority Boundary

The design does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, runtime fixture mutation, or live session capture.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-design`
- `git diff --check`
- `git diff --cached --check`

Relevant upstream smokes were run and failed only on older strict changed-file guards:

- `npm run smoke:perspective-codex-former-product-surface-design` failed with `product-surface design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-design` failed with `surface design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation` failed with `fixture surface implementation changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_DESIGN_V0_1.md`.

Those prior-stage guards were not widened because this PR is the next design stage, and the requested scope said not to spend time making unrelated historical changed-file guards accept this design PR unless they are clearly intended to track this exact stage.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

No DB/provider/model/Codex SDK/GitHub mutation checks were added because those surfaces are intentionally absent.

## Recommended Next PR

Add read-only Codex Session Perspective Panel fixture implementation.

## What Codex Did Not Do

Codex did not implement UI, add a route, add a runtime browser surface, call Codex, integrate Codex SDK, call provider/model APIs, add DB persistence, mutate GitHub, automate clipboard use, create accepted Augnes state, create proof/evidence/readiness records, approve, merge, deploy, make Core decisions, mutate fixtures, or modify the PR #503 Constellation Preview implementation.
