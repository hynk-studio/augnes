# Perspective Codex Former Session Perspective Panel Fixture Surface Design v0.1

Conclusion: PASS with follow-up

## Purpose

This design defines the future Codex Session Perspective Panel fixture surface for Codex Former capture review.

The panel is the future surface that sits inside, beside, or near a Codex work session and makes perspective formation status legible before a user inspects candidate material in the Constellation Preview.

This PR is design-only. It implements no UI, does not implement UI, adds no route, adds no runtime browser surface, adds no DB persistence, and creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, or Core decisions.

Boundary summary: does not implement UI; adds no route; no runtime browser surface; no DB persistence; no provider/model calls; no Codex SDK calls; no GitHub mutation; no clipboard automation.

## Why Follows PR #503

PR #503 implemented the first read-only, fixture-backed Constellation Preview route:

`/cockpit/perspective/codex-former/constellation-preview-fixture`

That route shows the graph-level view of adapted Codex Former perspective candidates. It answers where a candidate sits in the graph.

This design defines the complementary session-side panel. The Codex Session Perspective Panel answers what the current perspective-formation status is during or after a Codex work session, what is missing, what warnings remain, and what is safe to do next before graph inspection.

Reference implementation context:

- `docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`
- `components/codex-former-constellation-preview-fixture.tsx`
- `app/cockpit/perspective/codex-former/constellation-preview-fixture/page.tsx`

## Product Thesis

The Codex Session Perspective Panel should make perspective formation legible inside or beside a Codex work session, without implying that Codex output is accepted Augnes state.

It should show:

- capture readiness;
- source input status;
- prompt / manual copy packet status;
- returned candidate status;
- validation status;
- warnings and blocked reasons;
- authority boundary;
- safe next action;
- link or handoff intent to Constellation Preview.

The panel is workflow/status oriented. It should help a user understand whether bounded work material exists, whether a manual packet exists, whether a returned candidate was captured, whether validation passed with follow-up or blocked, and whether graph inspection is safe.

## Relationship to Constellation Preview

The Codex Session Perspective Panel is workflow/status oriented.

The Constellation Preview is graph/relationship oriented.

The Session Panel may link to or hand off to the Constellation Preview. It should not duplicate the full graph. It should summarize enough to let the user know whether a candidate is ready to inspect in the graph.

The Constellation Preview remains read-only and fixture-backed in the current implementation from PR #503. Any future handoff remains local/read-only until a later PR explicitly scopes persistence or runtime integration.

## Fixture Inputs And Scenarios

Design input examples use the same adapted preview-data fixtures from PR #501:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

### Scenario A: Not prepared

State:

- no source input is prepared;
- no prompt/manual copy packet exists;
- no returned candidate exists;
- no validation exists;
- no graph handoff is available.

Safe next action:

- create bounded source input JSON using the source input template;
- then run the prepare helper.

Missing prerequisites should read as pending, not failure. No warnings are required unless the future fixture explicitly models prerequisite caveats.

### Scenario B: Prepared, waiting for returned Codex candidate

State:

- source input exists;
- prompt/manual copy packet exists;
- separate Codex session is waiting for human paste or returned material;
- returned candidate is missing;
- validation has not run;
- no graph handoff is available yet.

Safe next action:

- paste the copy packet into a separate user-started Codex session;
- return exactly one candidate envelope for validation.

The panel must not imply that Augnes calls Codex, calls a provider/model, or uses Codex SDK.

### Scenario C: PASS with follow-up

State uses:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`

Expected status:

- validation status is PASS with follow-up;
- `needs_review` / pointer warning pressure remains visible;
- `review_candidate` exists but is `non_committed`;
- safe next action is to inspect in Constellation Preview, then human review;
- accepted Augnes state remains false.

### Scenario D: BLOCKED

State uses:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Expected status:

- validation status is BLOCKED;
- provenance, multiple candidate, or blocked-reason caveats are visible;
- no usable review candidate exists;
- safe next action is to correct the returned envelope or rerun prepare/validate;
- no graph handoff is available as usable candidate material.

## Panel Regions

### Session Header

Purpose:

- show work/session label;
- show fixture scenario label;
- show read-only / review-only boundary;
- show current high-level status.

The header must not imply accepted state. BLOCKED may use stopped-result language. PASS with follow-up may use review-result language.

### Formation Timeline

Purpose:

- show step sequence:
  - bounded source input;
  - prepare packet;
  - separate Codex session;
  - returned candidate;
  - validation;
  - review candidate;
  - constellation handoff.

Each step should have one status:

- `not_started`
- `ready`
- `waiting`
- `complete`
- `needs_review`
- `blocked`

No step should imply accepted Augnes state. A completed validation step means validation ran; it does not mean the material was accepted.

### Status Card

Purpose:

- show primary status label:
  - Not prepared
  - Waiting for candidate
  - PASS with follow-up
  - BLOCKED
- show caveat label;
- show next safe action;
- show review-only and accepted-state false.

The next safe action is advisory copy. It is not a command, approval, execution, or acceptance control.

### Evidence / Provenance Strip

Purpose:

- show `source_input_hash`;
- show `source_prompt_hash`;
- show `metadata_match`;
- show `candidate_count`;
- show source fixture path;
- show optional PR refs.

The strip stays bounded. It must not show raw payloads, raw transcripts, raw candidate envelopes, raw diffs, raw provider logs, or private source material.

### Warning / Blocking Summary

Purpose:

- group pointer warnings, general warnings, and blocked reasons;
- show PASS with follow-up warning pressure without making the state look blocked;
- show BLOCKED reasons prominently;
- show not prepared / waiting missing items as pending prerequisites rather than failure.

Warning examples remain bounded and summarized.

### Authority Boundary Box

Purpose:

- show compact authority facts:
  - `review_only`;
  - `non_committed` when applicable;
  - `advisory_only` when applicable;
  - `no_accepted_state`;
  - `no_db_write`;
  - `no_provider_call`;
  - `no_codex_sdk_call`;
  - `no_github_mutation`;
  - `no_core_decision`.

The default panel should not dump all authority flags everywhere. This box may be collapsed or compact by default.

### Action Guidance

Purpose:

- show safe next action copy;
- keep actions as guidance only in this design;
- avoid executable buttons for prepare, validate, Codex, GitHub, DB, approval, merge, or deploy.

A future implementation may provide copyable commands only if separately scoped. This design includes no clipboard automation.

### Constellation Handoff Preview

Purpose:

- show whether Constellation Preview inspection is available;
- PASS with follow-up: "Available for read-only graph inspection";
- BLOCKED: "Not available as usable review candidate";
- Not prepared / waiting: "Not ready".

The handoff is a future navigation affordance only. It is not persistence, acceptance, promotion, proof, evidence, readiness, approval, or Core decision behavior.

## Display Density Policy

The panel must remain compact enough to sit beside a Codex session.

Default view should show at most:

- one primary status;
- one caveat;
- one next safe action;
- compact timeline;
- warning count / blocked count;
- authority summary.

Detail expansion can show hashes and full authority flags. The panel should not show full transcript, raw payload, raw candidate, raw diff, or large unbounded rows.

## PASS with follow-up Panel Behavior

Header:

- PASS with follow-up;
- review-only.

Timeline:

- bounded source input: complete;
- prepare packet: complete;
- separate Codex session: complete;
- returned candidate: complete;
- validation: complete with follow-up;
- review candidate: available but non_committed;
- constellation handoff: available for read-only graph inspection.

Status Card:

- primary status: PASS with follow-up;
- caveat: needs_review / pointer warning pressure;
- next safe action: inspect read-only graph, then human review;
- accepted-state false.

Warning Summary:

- collapsed or compact by default;
- warning pressure remains visible.

Authority:

- `review_only` and `non_committed` visible;
- advisory guidance remains advisory-only;
- no accepted state.

The panel must not look like approval, command authority, accepted memory, or a completed Core decision.

## BLOCKED Panel Behavior

Header:

- BLOCKED;
- stopped review result.

Timeline:

- bounded source input: complete or blocked according to fixture;
- prepare packet: complete;
- separate Codex session: complete;
- returned candidate: complete;
- validation: blocked;
- review candidate: unavailable;
- constellation handoff: unavailable as usable material.

Status Card:

- primary status: BLOCKED;
- caveat: blocked validation;
- next safe action: correct provenance/candidate count or rerun capture path.

Warning Summary:

- open or prominent by default;
- blocked reasons visible.

Authority:

- `blocked`, `review_only`, and `no_accepted_state` visible.

The panel must not imply there is a usable review candidate.

## Not Prepared Panel Behavior

Status:

- Not prepared.

Timeline:

- bounded source input: not_started;
- prepare packet: not_started;
- separate Codex session: not_started;
- returned candidate: not_started;
- validation: not_started;
- review candidate: not_started;
- constellation handoff: not ready.

Guidance:

- create bounded source input JSON using the template;
- then run the prepare helper.

Missing prerequisites are pending, not warnings. No graph handoff is available.

## Waiting For Candidate Panel Behavior

Status:

- Waiting for returned candidate.

Timeline:

- bounded source input: complete;
- prepare packet: complete;
- separate Codex session: waiting;
- returned candidate: waiting;
- validation: not_started;
- review candidate: not_started;
- constellation handoff: not ready.

Guidance:

- paste the copy packet into a separate user-started Codex session;
- return exactly one candidate envelope.

The panel must show no accepted state and no graph handoff yet.

## Accessibility And Keyboard Plan

Future keyboard traversal order:

1. Session Header
2. Formation Timeline
3. Status Card
4. Evidence / Provenance Strip
5. Warning / Blocking Summary
6. Authority Boundary Box
7. Action Guidance
8. Constellation Handoff Preview

Status and caveats must not rely on color alone. Screen reader labels should include status, caveat, review-only boundary, and next safe action. Collapsed details must expose expanded/collapsed state. No information should require hover-only disclosure.

## Browser/Computer-Use Validation Plan

This PR is design-only and adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture, so browser/computer-use validation is skipped.

Future implementation browser/computer-use validation must verify:

- Not prepared scenario renders;
- Waiting for candidate scenario renders;
- PASS with follow-up scenario renders;
- BLOCKED scenario renders;
- compact side-panel density at desktop width;
- mobile/narrow layout;
- keyboard traversal;
- warning/blocked indicators are not color-only;
- no accepted-state implication;
- Constellation handoff copy/state;
- no raw unsafe/private markers;
- no external network/provider/Codex/GitHub/DB traffic.

## Privacy And Redaction

The panel must use bounded summaries only.

It must not show:

- raw transcript;
- raw diff;
- raw candidate payload;
- raw provider logs;
- raw private/source/provider material;
- omitted unsafe fields.

Omitted unsafe fields must stay omitted. Public docs and reports must not echo raw unsafe/private marker literals.

## Authority Boundary

This design does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, runtime fixture mutation, or live session capture.

It does not call Codex, integrate Codex SDK, add provider/model calls, add DB persistence, mutate GitHub, automate clipboard use, create accepted state, or modify the Constellation Preview implementation.

## Future Implementation Sequence

Recommended sequence:

1. Add read-only Codex Session Perspective Panel fixture implementation.
2. Browser/computer-use validation for the panel.
3. Design Capture Review Inbox fixture surface.
4. Implement Capture Review Inbox fixture surface.
5. Design local Codex integration adapter.
6. Only later consider live/runtime integration.

Immediate next PR:

Add read-only Codex Session Perspective Panel fixture implementation.

## Conclusion

PASS with follow-up.

Meaning:

- session panel fixture design is defined;
- no UI has been implemented;
- future implementation must be read-only, fixture-backed, and browser-validated;
- accepted-state automation remains out of scope.
