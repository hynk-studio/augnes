# Perspective Codex Former Capture Review Inbox Fixture Surface Implementation v0.1

Conclusion: PASS with follow-up

## Purpose

This document records the first read-only, fixture-backed Capture Review Inbox fixture surface implementation.

The surface renders a deterministic triage inbox for Codex Former capture review items. It helps a human see which items are empty, pending preparation, waiting for a returned candidate, reviewable with follow-up, or blocked.

## Why Follows PR #506

PR #506 defined the design-only Capture Review Inbox fixture surface contract and recommended the next PR: add the read-only Capture Review Inbox fixture implementation.

This implementation follows that contract without adding live Codex capture, provider/model calls, Codex SDK calls, DB writes, GitHub mutation, clipboard automation, accepted Augnes state, proof/evidence/readiness records, review decision records, accept/promote/reject actions, approvals, merges, deploys, Core decisions, runtime fixture mutation, localStorage, sessionStorage, or indexedDB.

## Surface Is Read-Only

The inbox is a local static fixture surface.

It is read-only, fixture-backed, deterministic, non-persistent, and non-authorizing. It has no executable prepare, validate, Codex, GitHub, DB, approval, merge, deploy, Core decision, accept, promote, or reject controls.

Filter selection, item selection, empty mode, and expanded authority details are local React state only. The implementation does not persist state, mutate fixtures, write a database, call external services, call provider/model APIs, call GitHub APIs, call Codex SDK, or automate the clipboard.

## Fixture Inputs And Local Items

PASS with follow-up and BLOCKED use the PR #501 adapted preview-data fixtures:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Empty inbox, Pending preparation, and Waiting for candidate are deterministic local in-code fixture states built by:

- `lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts`

Those local items contain bounded summaries only. They do not create records or runtime state.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/capture-review-inbox-fixture`

Files:

- `app/cockpit/perspective/codex-former/capture-review-inbox-fixture/page.tsx`
- `components/codex-former-capture-review-inbox-fixture.tsx`
- `lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts`

## Inbox Header Implementation

The Inbox Header renders the inbox title, read-only/review-only boundary, item counts by reviewability, accepted-state false, and no-decision-authority indicator.

The header uses explicit text labels so the authority boundary is not color-only.

## Filter / Group Bar Implementation

The Filter / Group Bar renders keyboard-accessible local controls for:

- `all`
- `not_ready`
- `waiting`
- `reviewable`
- `blocked`
- `empty`

The selected filter is visible. Filter state is not persisted and does not mutate the URL.

## Review Item List Implementation

The Review Item List renders compact item rows. Each row shows title, source/session label, primary status, reviewability, warning count, blocked count, candidate count, metadata match, and at most two default badges.

The list does not render full graphs, transcripts, raw payloads, raw diffs, or raw candidate envelopes.

## Selected Item Summary Implementation

The Selected Item Summary renders the selected item status, caveat, next safe action, review-only value, accepted-state false, and safe read-only link affordances.

The Session Panel link is available for review items that can be inspected for status. The Constellation Preview link is available only for PASS with follow-up and is labeled as read-only graph inspection.

## Warning / Blocking Triage Implementation

The Warning / Blocking Triage region groups warning pressure, blocked reasons, and pending prerequisites.

PASS with follow-up warning pressure is visible but not red/emergency. BLOCKED reasons are prominent and labeled as a stopped review result, not a system failure. Pending and waiting prerequisites are shown as pending, not failure.

Examples are bounded.

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

## Safe Next Actions Implementation

Safe Next Actions renders non-executable guidance copy only.

The region has no executable prepare, validate, Codex, GitHub, DB, approval, merge, deploy, Core decision, accept, promote, or reject button. It has no clipboard automation.

## Empty / Invalid State Implementation

Empty mode renders the Empty / Invalid State region.

Empty inbox is not an error. Invalid fixture data is an error state for unsupported or malformed fixture data. BLOCKED items are valid stopped review results, not system failures.

## Empty Inbox Behavior

Empty inbox shows no capture review items available.

Safe next action: prepare bounded source input or run the capture helper.

It has no graph inspection, no warnings, no red/error treatment, and no accepted-state implication.

## Pending Preparation Behavior

Pending preparation shows source input and prepare packet missing, no candidate, no validation, reviewability `not_ready`, and no graph inspection.

The item caveat says source input and prepare packet are missing. Missing prerequisites are pending, not failure.

## Waiting For Candidate Behavior

Waiting for candidate shows source input and manual packet prepared, returned envelope missing, validation not run, reviewability `waiting`, and no graph inspection.

The item does not imply Augnes calls Codex, provider/model APIs, or Codex SDK.

## PASS with follow-up Behavior

PASS with follow-up uses the adapted PASS fixture.

It shows reviewability `reviewable_with_follow_up`, warning pressure visible, review candidate present but `non_committed`, `review_only` visible, accepted-state false, Session Panel inspection available, and read-only Constellation Preview inspection available.

It has no accepted state, no approve/promote/reject control, and no command-looking decision action.

## BLOCKED Behavior

BLOCKED uses the adapted BLOCKED fixture.

It shows reviewability `blocked`, blocked reasons visible, no usable review candidate, Session Panel status inspection available, Constellation Preview unavailable as a usable candidate graph, accepted-state false, and no usable-candidate implication.

BLOCKED is rendered as a valid stopped review result.

## Accessibility Notes

The surface includes semantic headings, keyboard-accessible filter/group controls, keyboard-accessible review item selection, a native keyboard-accessible authority details region, visible focus states, non-color warning/blocked labels, visible selected item state, and no hover-only information.

Review item accessible labels include title, status, reviewability, caveat, and next safe action without dumping every authority flag.

## Browser/Computer-Use Validation

Browser validation was performed against:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/capture-review-inbox-fixture`

Setup command:

`npm run dev -- -H 127.0.0.1 -p 3000`

Covered observations are recorded in:

- `reports/browser/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface.md`

## Privacy Boundary

The inbox renders bounded summaries only.

It does not render raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs, reports, and source do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation creates no accepted Augnes state, proof/evidence/readiness records, review decision records, provider/model calls, Codex SDK calls, DB writes, GitHub mutation, clipboard automation, approval, merge, deploy, Core decision, accept/promote/reject action, live Codex capture, runtime fixture mutation, localStorage, sessionStorage, or indexedDB.

## Known Caveats

This is a fixture-backed implementation only. It does not connect to live capture storage, live Codex sessions, runtime ingestion, review decision state, or persistence.

The Empty / Invalid State region includes deterministic fixture examples only. Unsupported live data handling remains future work.

## Recommended Next PR

Design local Codex integration adapter.

## Conclusion

PASS with follow-up
