# Perspective Codex Former Capture Review Inbox Fixture Surface Implementation

## Summary

Implemented the first read-only, fixture-backed Capture Review Inbox fixture surface.

The route renders deterministic inbox review states: Empty inbox, Pending preparation, Waiting for candidate, PASS with follow-up, and BLOCKED.

## Why Follows PR #506

PR #506 added the design-only Capture Review Inbox fixture surface contract and recommended implementing the read-only fixture surface next.

This PR follows that design without adding live Codex capture, provider/model calls, Codex SDK calls, DB writes, GitHub mutation, clipboard automation, accepted Augnes state, proof/evidence/readiness records, review decision records, accept/promote/reject actions, approvals, merges, deploys, Core decisions, runtime fixture mutation, localStorage, sessionStorage, or indexedDB.

## Implementation Scope

Changed scope:

- route file
- client component
- read-only helper and local inbox item builder
- scoped CSS
- implementation doc
- implementation report
- browser validation report
- smoke scripts
- package scripts

No DB schema, provider/model integration, Codex SDK integration, GitHub mutation code, capture helper behavior, projection builder behavior, preview data adapter behavior, fixture JSON, Constellation Preview behavior, or Session Perspective Panel behavior was changed.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/capture-review-inbox-fixture`

## Fixture Inputs And Local Items

PASS with follow-up and BLOCKED use:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Empty inbox, Pending preparation, and Waiting for candidate are deterministic local in-code fixture states in:

- `lib/perspective-ingest/codex-former-capture-review-inbox-fixture-surface.ts`

## Empty Inbox Surface Result

Empty inbox mode shows no capture review items available.

The state is not an error. It shows the safe next action to prepare bounded source input or run the capture helper, no graph inspection, no warning/error treatment, and accepted-state false.

## Pending Preparation Surface Result

Pending preparation shows source input and prepare packet missing, no candidate, no validation, reviewability `not_ready`, Session Panel status inspection available, and Constellation Preview not ready.

Missing prerequisites are pending, not failure.

## Waiting For Candidate Surface Result

Waiting for candidate shows source input and manual packet prepared, returned envelope missing, validation not run, reviewability `waiting`, Session Panel status inspection available, and Constellation Preview not ready.

The surface does not imply Augnes calls Codex, providers, models, or Codex SDK.

## PASS with follow-up Surface Result

PASS with follow-up uses the adapted PASS fixture.

It shows reviewability `reviewable_with_follow_up`, warning pressure visible, candidate count from fixture data, `non_committed`, `review_only`, accepted-state false, Session Panel inspection available, and read-only Constellation Preview inspection available.

There is no accepted state and no approve/promote/reject control.

## BLOCKED Surface Result

BLOCKED uses the adapted BLOCKED fixture.

It shows reviewability `blocked`, blocked reasons visible, no usable review candidate, Session Panel status inspection available, Constellation Preview unavailable as usable candidate graph, accepted-state false, and no usable-candidate implication.

BLOCKED is rendered as a valid stopped review result, not a system failure.

## Filter/group Behavior

The Filter / Group Bar renders local controls for `all`, `not_ready`, `waiting`, `reviewable`, `blocked`, and `empty`.

The selected filter is visible and keyboard-accessible. Filter state is local only and does not persist.

## Selected Item Behavior

Review item rows are keyboard-accessible buttons.

Selecting an item updates the Selected Item Summary, Warning / Blocking Triage, Authority Boundary Box, and Safe Next Actions regions. The selected item state is visible.

## Accessibility Notes

The surface includes semantic headings, keyboard-accessible filter/group controls, keyboard-accessible review item selection, native keyboard-accessible authority details, visible focus states, non-color warning/blocked labels, no hover-only information, and selected item state.

Review item accessible labels include title, status, reviewability, caveat, and next safe action without dumping every authority flag.

## Browser/Computer-Use Validation

Browser validation was performed against:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/capture-review-inbox-fixture`

Setup command:

`npm run dev -- -H 127.0.0.1 -p 3000`

Covered observations are recorded in:

- `reports/browser/2026-06-11-perspective-codex-former-capture-review-inbox-fixture-surface.md`

## Privacy/Redaction Handling

The surface renders bounded summaries only.

It does not render raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs, reports, and source do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation is read-only, fixture-backed, local/static/deterministic, non-persistent, and non-authorizing.

It creates no accepted Augnes state, proof/evidence/readiness records, review decision records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, accept/promote/reject actions, live Codex session capture, runtime fixture mutation, localStorage, sessionStorage, or indexedDB usage.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:perspective-codex-former-capture-review-inbox-fixture-surface-implementation`
- `npm run browser:perspective-codex-former-capture-review-inbox-fixture-surface`
- `git diff --check`
- `git diff --cached --check`

Browser validation:

- `npm run dev -- -H 127.0.0.1 -p 3000`
- visited `/cockpit/perspective/codex-former/capture-review-inbox-fixture`
- validated Empty inbox mode, Pending preparation, Waiting for candidate, PASS with follow-up, BLOCKED, filter/group switching, selected PASS/BLOCKED/Pending/Waiting details, required regions, Session Panel affordance, PASS-only read-only Constellation handoff, no usable Constellation handoff for BLOCKED/Pending/Waiting, no accepted-state implication, no approve/promote/reject controls, no executable prepare/validate/Codex/GitHub/DB controls, at most two badges per item, non-color warning/blocked indicators, 390px no-overflow layout, no raw unsafe/private markers, no console warnings/errors, no external provider/model/GitHub/Codex/OpenAI traffic, and no localStorage/sessionStorage/clipboard path exercised.

Known verification failure:

- `npm run smoke:perspective-codex-former-capture-review-inbox-fixture-surface-design` failed with `capture review inbox fixture surface design changed an out-of-scope file: app/cockpit/perspective/codex-former/capture-review-inbox-fixture/page.tsx`.

This was not widened because the command is the previous design-only guard and this PR intentionally adds the implementation route/component/helper/CSS.

## Skipped Checks With Reasons

No required implementation check was intentionally skipped.

Browser validation caveat: direct Enter-key activation through the in-app browser keypress helper focused a filter button but did not activate the React click handler. Keyboard/focus evidence is therefore based on semantic focus targets, native button/link/summary controls, visible focus styles, structural DOM inspection, and successful mouse/locator activation rather than a complete sequential keyboard activation walk.

## Recommended Next PR

Design local Codex integration adapter.

## What Codex Did Not Do

Codex did not call Codex, integrate Codex SDK, call provider/model APIs, mutate GitHub, automate clipboard use, write a DB, add persistence, create accepted Augnes state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, mutate fixtures, modify capture helpers, modify projection builders, modify the preview data adapter, modify the PR #503 Constellation Preview behavior, or modify the PR #505 Session Perspective Panel behavior.
