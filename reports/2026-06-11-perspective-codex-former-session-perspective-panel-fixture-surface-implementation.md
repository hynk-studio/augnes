# Perspective Codex Former Session Perspective Panel Fixture Surface Implementation

## Summary

Implemented the first read-only, fixture-backed Codex Session Perspective Panel fixture surface.

The route renders four deterministic scenarios: Not prepared, Waiting for candidate, PASS with follow-up, and BLOCKED.

## Why Follows PR #504

PR #504 added the design-only Codex Session Perspective Panel fixture surface contract and recommended implementing the read-only fixture surface next.

This PR follows that design without adding live Codex capture, provider/model calls, Codex SDK calls, DB writes, GitHub mutation, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.

## Implementation Scope

Changed scope:

- route file
- client component
- read-only helper and local scenario builder
- scoped CSS
- implementation doc
- implementation report
- browser validation report
- smoke scripts
- package scripts

No DB schema, provider/model integration, Codex SDK integration, GitHub mutation code, capture helper behavior, projection builder behavior, preview data adapter behavior, fixture JSON, or Constellation Preview behavior was changed.

## Route / Surface Path

Route:

`/cockpit/perspective/codex-former/session-perspective-panel-fixture`

## Fixture Inputs And Local Scenarios

PASS with follow-up and BLOCKED use:

- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json`
- `reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json`

Not prepared and Waiting for candidate are deterministic local in-code scenarios in:

- `lib/perspective-ingest/codex-former-session-perspective-panel-fixture-surface.ts`

## Not Prepared Surface Result

Not prepared shows source input, prepare packet, Codex session, returned candidate, validation, review candidate, and Constellation handoff as not started.

The status card says `Not prepared`, the caveat says `Source input and prepare packet are not ready.`, and the handoff state says `Not ready`.

Missing prerequisites are pending, not failure.

## Waiting For Candidate Surface Result

Waiting for candidate shows source input and prepare packet complete, separate Codex session waiting, returned candidate waiting, validation not started, review candidate unavailable, and no graph handoff.

The status card says `Waiting for candidate`, the caveat says `Returned Codex candidate envelope is missing.`, and the handoff state says `Not ready`.

The surface does not imply Augnes calls Codex, providers, models, or Codex SDK.

## PASS with follow-up Surface Result

PASS with follow-up uses the adapted PASS fixture.

It shows validation complete with follow-up, warning pressure visible, review candidate available but `non_committed`, accepted-state false, and Constellation Preview available for read-only graph inspection.

The handoff is a normal read-only navigation link only.

## BLOCKED Surface Result

BLOCKED uses the adapted BLOCKED fixture.

It shows blocked validation, provenance/candidate-count caveats, blocked reasons open/prominent by default, no usable review candidate, accepted-state false, and no usable Constellation handoff.

BLOCKED is rendered as a valid stopped review result, not a system failure.

## Accessibility Notes

The surface includes semantic headings, keyboard-accessible scenario tabs, native keyboard-accessible `details` sections, visible focus states, non-color warning/blocked labels, and no hover-only information.

The Session Header aria label includes status, caveat, review-only boundary, and next safe action without dumping every authority flag.

## Browser/Computer-Use Validation

Browser validation was performed against:

`http://127.0.0.1:3000/cockpit/perspective/codex-former/session-perspective-panel-fixture`

Setup command:

`npm run dev -- -H 127.0.0.1 -p 3000`

Covered observations are recorded in:

- `reports/browser/2026-06-11-perspective-codex-former-session-perspective-panel-fixture-surface.md`

## Privacy/Redaction Handling

The surface renders bounded summaries only.

It does not render raw transcript, raw diff, raw candidate payload, raw provider logs, raw private/source/provider material, or omitted unsafe fields.

Public docs, reports, and source do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation is read-only, fixture-backed, local/static/deterministic, non-persistent, and non-authorizing.

It creates no accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, clipboard automation, approvals, merges, deploys, Core decisions, live Codex session capture, runtime fixture mutation, localStorage, sessionStorage, or indexedDB usage.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run build`
- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-implementation`
- `npm run browser:perspective-codex-former-session-perspective-panel-fixture-surface`

Browser validation:

- `npm run dev -- -H 127.0.0.1 -p 3000`
- visited `/cockpit/perspective/codex-former/session-perspective-panel-fixture`
- validated all four scenarios, switching behavior, required regions, PASS read-only handoff, BLOCKED no-usable-handoff state, Not prepared / Waiting not-ready handoff states, no accepted-state implication, no executable prepare/validate/Codex/GitHub/DB controls, non-color warning/blocked indicators, 390px no-overflow layout, no raw unsafe/private markers, no console warnings/errors, no external provider/model/GitHub/Codex/OpenAI traffic, and no localStorage/sessionStorage/clipboard path exercised.

Known verification failures:

- `npm run smoke:perspective-codex-former-session-perspective-panel-fixture-surface-design` failed with `session panel fixture surface design changed an out-of-scope file: app/cockpit/perspective/codex-former/session-perspective-panel-fixture/page.tsx`.

This was not widened because the command is the previous design-only guard and this PR intentionally adds the implementation route/component/helper/CSS.

Optional adjacent checks:

- `npm run dogfood:perspective-codex-former-constellation-fixture-preview` passed and left no tracked diff.
- `npm run dogfood:perspective-codex-former-constellation-preview-data-adapter` passed and left no tracked diff.
- `npm run smoke:perspective-codex-former-constellation-preview-fixture-surface-implementation` failed with `fixture surface implementation changed an out-of-scope file: app/cockpit/perspective/codex-former/session-perspective-panel-fixture/page.tsx`.

The adjacent Constellation implementation guard was not widened because it tracks the PR #503 surface, not this session panel implementation.

Pending final workspace checks before PR open:

- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Reasons

No required implementation check was intentionally skipped.

Browser validation caveat: direct sequential Tab-key probing in the in-app browser stayed on the current native `summary` control after focus changed. Keyboard/focus evidence is therefore based on semantic focus targets, native button/summary controls, visible focus styles, and bounded DOM inspection rather than a complete sequential Tab walk.

## Recommended Next PR

Design Capture Review Inbox fixture surface.

## What Codex Did Not Do

Codex did not call Codex, integrate Codex SDK, call provider/model APIs, mutate GitHub, automate clipboard use, write a DB, add persistence, create accepted Augnes state, create proof/evidence/readiness records, approve, merge, deploy, make Core decisions, mutate fixtures, modify capture helpers, modify projection builders, modify the preview data adapter, or modify the PR #503 Constellation Preview behavior.
