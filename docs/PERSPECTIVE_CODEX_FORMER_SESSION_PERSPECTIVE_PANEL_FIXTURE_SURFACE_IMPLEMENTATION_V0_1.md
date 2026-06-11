# Perspective Codex Former Session Perspective Panel Fixture Surface Implementation v0.1

Conclusion: PASS with follow-up

## Purpose

This document records the first read-only, fixture-backed Codex Session Perspective Panel fixture surface implementation.

The surface renders a future session-side panel for Codex Former perspective formation status. It shows whether bounded work material exists, whether source input and a manual packet are prepared, whether a returned candidate exists, whether validation passed with follow-up or blocked, and whether read-only Constellation Preview inspection is available.

## Why Follows PR #504

PR #504 defined the design-only Codex Session Perspective Panel fixture surface contract and recommended the next PR: add the read-only fixture implementation.

This implementation follows that contract without adding live Codex integration, persistence, clipboard automation, GitHub mutation, provider/model calls, Codex SDK calls, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.

## Surface Is Read-Only

The panel is a local static fixture surface.

It is read-only, fixture-backed, deterministic, non-persistent, and non-authorizing. It has no executable prepare, validate, Codex, GitHub, DB, approval, merge, deploy, or Core decision controls.

Scenario selection and expanded/collapsed details are local React state only. The implementation does not use localStorage, sessionStorage, indexedDB, clipboard automation, external network calls, runtime fixture mutation, DB writes, provider/model APIs, GitHub APIs, Codex SDK, or live Codex session capture.

## Fixture Inputs And Local Scenarios

The PASS with follow-up and BLOCKED scenarios use the PR #501 adapted preview-data fixtures:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

The Not prepared and Waiting for candidate scenarios are deterministic local in-code fixtures built by:

- `lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts`

Those local scenarios contain bounded summaries only. They do not create records or runtime state.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/session-perspective-panel-fixture`

Files:

- `app/cockpit/perspective/codex-former/session-perspective-panel-fixture/page.tsx`
- `components/codex-former-session-perspective-panel-fixture.tsx`
- `lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts`

## Session Header Implementation

The Session Header renders the work/session label, fixture scenario label, read-only/review-only boundary, current high-level status, and accepted-state false indicator.

The header uses non-color text labels for status and authority boundary. BLOCKED uses stopped-result visual treatment without implying system failure.

## Formation Timeline Implementation

The Formation Timeline renders seven steps:

1. bounded source input
2. prepare packet
3. separate Codex session
4. returned candidate
5. validation
6. review candidate
7. constellation handoff

Statuses are limited to `not_started`, `ready`, `waiting`, `complete`, `needs_review`, and `blocked`.

Completed validation means validation ran. It does not mean accepted Augnes state.

## Status Card Implementation

The Status Card renders the primary status label, caveat label, next safe action, review-only true, and accepted-state false.

The next safe action is advisory copy only. It is not styled or implemented as an execution, approval, or decision control.

## Evidence / Provenance Strip Implementation

The Evidence / Provenance Strip renders bounded values when available:

- `source_input_hash`
- `source_prompt_hash`
- `metadata_match`
- `candidate_count`
- fixture path
- PR refs

It does not render raw transcript, raw candidate envelope, raw diff, provider logs, private source material, or unbounded payload rows.

## Warning / Blocking Summary Implementation

The Warning / Blocking Summary renders pointer warning counts, general warning pressure, blocked reasons, and pending prerequisites.

Not prepared and Waiting for candidate show missing prerequisites as pending. PASS with follow-up shows warning pressure without blocked treatment. BLOCKED opens the summary by default and shows blocked reasons prominently.

Warning examples are bounded.

## Authority Boundary Box Implementation

The Authority Boundary Box is collapsed by default and expands through a native keyboard-accessible `details` element.

It shows compact authority tags and facts:

- `review_only`
- `non_committed` where applicable
- `advisory_only`
- `no_accepted_state`
- `no_db_write`
- `no_provider_call`
- `no_codex_sdk_call`
- `no_github_mutation`
- `no_core_decision`

These facts are inspection-only and do not grant decision authority.

## Action Guidance Implementation

Action Guidance renders the safe next action as guidance copy.

The region has no executable prepare, validate, Codex, GitHub, DB, approval, merge, deploy, or Core decision button. It has no clipboard automation.

## Constellation Handoff Preview Implementation

The handoff region renders scenario-specific handoff state:

- PASS with follow-up: `Available for read-only graph inspection`
- BLOCKED: `Not available as usable review candidate`
- Not prepared: `Not ready`
- Waiting for candidate: `Not ready`

PASS with follow-up includes a normal read-only navigation link to `/cockpit/perspective/codex-former/constellation-preview-fixture`.

The link does not persist, promote, approve, or accept material.

## Not Prepared Behavior

Not prepared renders:

- primary status: `Not prepared`
- caveat: `Source input and prepare packet are not ready.`
- next safe action: `Create bounded source input JSON using the template, then run the prepare helper.`
- timeline with all steps not started
- pending prerequisites
- no graph handoff
- accepted-state false

Missing prerequisites are pending, not red/error treatment.

## Waiting For Candidate Behavior

Waiting for candidate renders:

- primary status: `Waiting for candidate`
- caveat: `Returned Codex candidate envelope is missing.`
- next safe action: `Paste the copy packet into a separate user-started Codex session and return exactly one candidate envelope.`
- source input and prepare packet complete
- Codex session and returned candidate waiting
- validation not started
- no graph handoff yet
- accepted-state false

The panel does not imply Augnes calls Codex, provider/model APIs, or Codex SDK.

## PASS with follow-up Behavior

PASS with follow-up renders:

- primary status: `PASS with follow-up`
- caveat: `needs_review / pointer warning pressure`
- next safe action: `Inspect read-only graph, then human review.`
- timeline complete through returned candidate and validation with follow-up
- review candidate available but `non_committed`
- read-only Constellation Preview handoff available
- review-only and accepted-state false

It has no accepted-state, approval, or command-looking action.

## BLOCKED Behavior

BLOCKED renders:

- primary status: `BLOCKED`
- caveat: `blocked validation / provenance or candidate-count issue`
- next safe action: `Correct provenance/candidate count or rerun the bounded capture path.`
- validation blocked
- review candidate unavailable
- Constellation handoff unavailable as usable material
- blocked reasons open/prominent by default
- accepted-state false

The blocked scenario is a valid review result, not a system failure.

## Accessibility Notes

The implementation includes semantic headings, keyboard-accessible scenario tabs, keyboard-accessible native `details` sections, visible focus states, non-color blocked/warning indicators, and no hover-only information.

The Session Header aria label includes status, caveat, review-only boundary, and next safe action without dumping every authority flag.

## Browser/Computer-Use Validation

Browser validation was run against the local route with:

`npm run dev -- -H 127.0.0.1 -p 3000`

Validation covered opening the route, all four scenarios, switching behavior, required regions, PASS read-only handoff, BLOCKED no-usable-handoff state, Not prepared and Waiting not-ready handoff states, no accepted-state implication, no executable prepare/validate/Codex/GitHub/DB controls, non-color warning/blocked indicators, keyboard/focus basics, 390px responsive layout with no horizontal overflow, no raw unsafe/private marker text, no console warnings/errors, no external provider/model/GitHub/Codex/OpenAI traffic, and no localStorage/sessionStorage/clipboard path exercised.

Browser caveat: direct sequential Tab-key probing in the in-app browser stayed on the current native `summary` control after focus changed. The browser report therefore uses semantic focus-target validation, native control checks, visible focus styles, and bounded DOM inspection as keyboard/focus evidence rather than claiming a complete sequential Tab walk.

The committed browser report is:

- `reports/browser/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface.md`

## Privacy Boundary

The surface uses bounded summaries only.

It does not render raw transcripts, raw diffs, raw candidate payloads, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs, reports, and source do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, live Codex session capture, runtime fixture mutation, localStorage, sessionStorage, or indexedDB usage.

## Known Caveats

This is a fixture route for local inspection. Not prepared and Waiting for candidate are local deterministic in-code scenarios, not runtime session capture.

The PASS handoff is a normal read-only navigation link to the existing Constellation Preview fixture route. It is not persistence, promotion, approval, or acceptance.

The in-app browser did not provide a reliable direct sequential Tab traversal trace during validation; see the browser report for the exact keyboard/focus caveat.

## Recommended Next PR

Design Capture Review Inbox fixture surface.

## Conclusion

PASS with follow-up.
