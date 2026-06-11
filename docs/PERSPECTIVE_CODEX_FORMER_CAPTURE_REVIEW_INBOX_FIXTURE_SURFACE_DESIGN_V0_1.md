# Perspective Codex Former Capture Review Inbox Fixture Surface Design v0.1

Conclusion: PASS with follow-up

## Purpose

This design defines the future Capture Review Inbox fixture surface for Codex Former capture review.

The Capture Review Inbox is the future surface where a user reviews captured Codex Former perspective candidates across work/session outcomes. It is not the Codex session-side panel and not the constellation graph. It is a triage and review list for candidate review states.

This PR is design-only. It implements no UI, adds no route, adds no runtime browser surface, and creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, live Codex capture, or runtime fixture mutation.

Boundary summary: design-only; no UI implemented; no route; no runtime browser surface; no accepted Augnes state; no proof/evidence/readiness creation; no provider/model calls; no Codex SDK calls; no DB writes; no GitHub mutation; no clipboard automation; no approval/merge/deploy/Core decision; no live Codex capture; no runtime fixture mutation.

## Why Follows PR #505

PR #505 implemented the read-only Codex Session Perspective Panel fixture surface:

`/cockpit/perspective/codex-former/session-perspective-panel-fixture`

That surface shows perspective-formation state for one work/session. It answers what is prepared, waiting, reviewable, blocked, or available for graph inspection for one session-side context.

This design defines the complementary Capture Review Inbox. The inbox would collect multiple capture review items and help a human triage what to inspect next.

Reference implementation context:

- `docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_SESSION_PERSPECTIVE_PANEL_FIXTURE_SURFACE_IMPLEMENTATION_V0_1.md`
- `components/codex-former-constellation-preview-fixture.tsx`
- `components/codex-former-session-perspective-panel-fixture.tsx`
- `lib/perspective-ingest/codex-former-constellation-preview-fixture-surface.ts`
- `lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts`

## Product Thesis

The Capture Review Inbox should make Codex Former perspective candidates reviewable at a list/queue level without implying that any item is accepted Augnes state.

It should show:

- item status;
- source work/session reference;
- validation conclusion;
- reviewability;
- warning / blocked reason summary;
- authority boundary;
- safe next action;
- whether Session Panel inspection is available;
- whether Constellation Preview inspection is available;
- whether a candidate is unavailable, pending, reviewable, blocked, or ready for human review.

The inbox should help a human decide what to inspect next. It should not decide, accept, promote, reject, approve, merge, deploy, publish, or create Core state.

## Relationship To Existing Surfaces

The Session Perspective Panel is single-work/session workflow status.

The Constellation Preview is graph/relationship inspection.

The Capture Review Inbox is multi-item triage and review queue.

The inbox may link to the Session Perspective Panel or Constellation Preview as read-only navigation. It must not duplicate the full graph or full session timeline by default. It should show enough status to help a human choose which item to inspect next.

The inbox must not implement accept, promote, or reject decisions in this design. Future review decisions require a separate design and authority gate.

## Fixture Inputs And Review Item Scenarios

Design examples use PR #501 adapted preview-data fixtures:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Design examples also reuse the PR #505 local scenario concepts:

- Not prepared
- Waiting for candidate
- PASS with follow-up
- BLOCKED

### Item A: Pending preparation

State:

- source input is not prepared;
- no prompt/manual copy packet exists;
- no candidate exists;
- no validation exists;
- reviewability is `not_ready`;
- no graph inspection is available.

Safe next action:

- create bounded source input and run the prepare helper.

The item is pending, not failed, unless the future data source itself is invalid.

### Item B: Waiting for returned candidate

State:

- source input is prepared;
- prompt/manual copy packet is prepared;
- returned envelope is missing;
- validation has not run;
- reviewability is `waiting`;
- no graph inspection is available.

Safe next action:

- return exactly one candidate envelope.

The item must not imply that Augnes calls Codex, provider/model APIs, or Codex SDK.

### Item C: Reviewable PASS with follow-up

State uses:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`

Expected review item:

- validation conclusion is PASS with follow-up;
- review candidate exists but remains `non_committed`;
- warning pressure is visible;
- reviewability is `reviewable_with_follow_up`;
- safe next action is to inspect Session Panel or Constellation Preview, then human review;
- no accepted state exists.

### Item D: BLOCKED returned material

State uses:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Expected review item:

- validation conclusion is BLOCKED;
- blocked reasons are visible;
- no usable review candidate exists;
- reviewability is `blocked`;
- safe next action is to correct provenance/candidate count or rerun the capture path;
- no usable graph handoff exists.

### Item E: Empty inbox

State:

- no capture review items are available;
- reviewability is `empty`;
- no graph inspection is available.

Safe next action:

- prepare bounded source input or run the capture helper.

Empty inbox is not an error unless the future data source is invalid.

### Optional Group F: Needs attention group

Needs attention is a grouping or filter rule, not a separate item type.

It may group warnings, blocked items, or missing prerequisites. It must keep PASS with follow-up warning pressure distinct from BLOCKED review stoppage.

## Inbox Regions

### Inbox Header

Purpose:

- show inbox title;
- show read-only / review-only boundary;
- show item counts by status;
- show accepted-state false;
- show no decision authority.

The header must not imply accepted state or decision authority.

### Filter / Group Bar

Purpose:

- filter or group by `all`;
- filter or group by `not_ready`;
- filter or group by `waiting`;
- filter or group by `reviewable`;
- filter or group by `needs_review`;
- filter or group by `blocked`.

This is design-only. Future filters must not persist automatically and must not create saved filter state.

### Review Item List

Purpose:

- show each review item as a compact card or row;
- show item title / source work / session label;
- show primary status;
- show reviewability;
- show warning count / blocked count;
- show candidate count;
- show `metadata_match` when available;
- show authority badges with max density;
- avoid full graph or full transcript.

Default item rows should show at most two badges.

### Selected Item Summary

Purpose:

- show selected item's key status;
- show caveat;
- show next safe action;
- show review-only / accepted-state false;
- show links or affordances to Session Panel or Constellation Preview only when appropriate.

Links are read-only navigation only. They are not persistence, promotion, acceptance, approval, or review decision behavior.

### Warning / Blocking Triage

Purpose:

- group warning pressure and blocked reasons across items;
- make BLOCKED items prominent;
- keep PASS with follow-up warnings visible but not red/emergency;
- show pending prerequisites as pending, not failure.

Critical caveats must not be hidden. Bounded examples are enough for the inbox.

### Authority Boundary Box

Purpose:

- show compact authority facts:
  - `review_only`;
  - `non_committed` where applicable;
  - `advisory_only` where applicable;
  - `no_accepted_state`;
  - `no_db_write`;
  - `no_provider_call`;
  - `no_codex_sdk_call`;
  - `no_github_mutation`;
  - `no_core_decision`.

This box may be collapsed or compact by default. It must not include accept, promote, or reject controls.

### Safe Next Actions

Purpose:

- show non-executable guidance;
- include guidance such as create source input, return candidate envelope, inspect session panel, inspect constellation preview, or correct provenance/candidate count.

There are no prepare, validate, Codex, GitHub, DB execution buttons. There is no clipboard automation. Copyable commands require a separate PR.

### Empty / Invalid State

Purpose:

- show empty inbox as not an error;
- show invalid fixture data as an error;
- show blocked item as a valid review result, not a system failure;
- treat unsupported fixture version as invalid data;
- keep privacy omissions bounded without revealing raw values.

## Display Density Policy

The inbox default view should fit multiple review items.

Each item should show at most:

- primary status;
- one caveat;
- reviewability;
- warning/blocked count;
- two badges;
- one next safe action summary.

Detail expansion can show hashes, `metadata_match`, `candidate_count`, and authority facts.

The inbox must not show full transcript, raw diff, raw candidate, raw provider payload, or the full constellation graph.

## Reviewability Taxonomy

First-pass reviewability taxonomy:

- `empty`
- `not_ready`
- `waiting`
- `reviewable_with_follow_up`
- `blocked`
- `invalid_data`

Definitions:

- `empty`: no items available; this is not an error.
- `not_ready`: prerequisites are missing.
- `waiting`: source/prompt are ready but candidate is missing.
- `reviewable_with_follow_up`: candidate exists, direct validation allows review-compatible material, and caveats remain.
- `blocked`: validation blocks usable review material.
- `invalid_data`: fixture or surface data cannot be trusted.

## PASS with follow-up Inbox Behavior

PASS with follow-up item behavior:

- card status: PASS with follow-up;
- reviewability: `reviewable_with_follow_up`;
- caveat: needs_review / pointer warning pressure;
- authority: `non_committed`, `review_only`;
- safe next action: inspect Session Panel or Constellation Preview, then human review;
- Session Panel link: available;
- Constellation Preview link: available read-only;
- no accepted state;
- no approve/promote control.

PASS with follow-up is reviewable, not accepted.

## BLOCKED Inbox Behavior

BLOCKED item behavior:

- card status: BLOCKED;
- reviewability: `blocked`;
- blocked reasons are prominent;
- no usable review candidate exists;
- safe next action: correct provenance/candidate count or rerun capture path;
- Session Panel link: available for status inspection;
- Constellation Preview link: not available as usable candidate graph, or shown disabled/pending according to future implementation;
- no accepted state;
- no usable-candidate implication.

BLOCKED is a stopped review result, not a system failure.

## Pending / Waiting Inbox Behavior

Pending preparation behavior:

- source input / prepare packet are not ready;
- reviewability is `not_ready`;
- safe next action is to create bounded source input and run the prepare helper;
- Session Panel link may be available for status inspection in future fixture implementation;
- Constellation Preview is not ready.

Waiting for candidate behavior:

- source input / prepare packet are ready;
- returned candidate is missing;
- reviewability is `waiting`;
- safe next action is to return exactly one candidate envelope;
- Session Panel link may be available;
- Constellation Preview is not ready.

Pending and waiting states must not imply accepted state or Codex/provider automation by Augnes.

## Empty Inbox Behavior

Empty inbox behavior:

- show no items yet;
- not an error;
- safe next action: prepare bounded source input or run capture helper;
- no warnings unless source is invalid;
- no accepted state.

## Accessibility And Keyboard Plan

Design-only keyboard traversal:

1. Inbox Header
2. Filter / Group Bar
3. Review Item List
4. Selected Item Summary
5. Warning / Blocking Triage
6. Authority Boundary Box
7. Safe Next Actions
8. Empty / Invalid State if present

List items must be reachable by keyboard. Selected item state must be visible.

Statuses must not rely on color alone. Screen-reader labels should include item title, status, reviewability, caveat, and next safe action. No information should be hover-only. Collapsed regions must expose expanded/collapsed state.

## Browser/Computer-Use Validation Plan

This PR is design-only and adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture, so browser/computer-use validation is skipped.

Future implementation browser/computer-use validation must cover:

- render Empty inbox;
- render Pending preparation item;
- render Waiting item;
- render PASS with follow-up item;
- render BLOCKED item;
- switch/filter between all, reviewable, blocked, waiting, and not_ready;
- select PASS item;
- select BLOCKED item;
- verify Session Panel link affordance;
- verify Constellation Preview handoff for PASS only;
- verify no usable Constellation handoff for BLOCKED, Pending, or Waiting;
- verify max two badges per item;
- verify non-color warning/blocked indicators;
- verify no accepted-state implication;
- verify no approve/promote/reject controls;
- verify no executable prepare/validate/Codex/GitHub/DB controls;
- verify no raw unsafe/private markers;
- verify no external network/provider/Codex/GitHub/DB traffic;
- verify mobile/narrow layout;
- verify keyboard traversal.

## Privacy And Redaction

The inbox must use bounded summaries only.

It must not show raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Omitted unsafe fields must stay omitted. Public docs and reports must not echo raw unsafe/private marker literals.

## Authority Boundary

This design creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, review decision records, accept/promote/reject actions, runtime fixture mutation, or live Codex capture.

It does not add review decision record creation. It does not add accept, promote, reject, approval, merge, deploy, GitHub mutation, provider/model, Codex SDK, DB, persistence, or Core decision authority.

## Future Implementation Sequence

Recommended sequence:

1. Add read-only Capture Review Inbox fixture implementation.
2. Browser/computer-use validation for Capture Review Inbox.
3. Design local Codex integration adapter.
4. Design review decision layer separately.
5. Only later consider live/runtime capture and persistence with explicit authority gates.

Immediate next PR:

Add read-only Capture Review Inbox fixture implementation.

## Conclusion

PASS with follow-up.

Meaning:

- Capture Review Inbox fixture design is defined;
- no UI has been implemented;
- future implementation must be read-only, fixture-backed, and browser-validated;
- accepted-state automation and review decisions remain out of scope.
