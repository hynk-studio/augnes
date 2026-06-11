# Perspective Codex Former Local Adapter Snapshot Surface Integration Report

## Summary

This PR adds a non-UI readiness layer for local Codex adapter snapshots. It maps the committed `not_ready`, `waiting`, and `prepared_waiting_for_codex_return` snapshot fixtures into deterministic read-only surface view-model fixtures for the Codex Session Perspective Panel and Capture Review Inbox.

The output is ready for the next UI implementation PR, but this PR does not add UI, routes, components, CSS, or browser-visible surfaces.

## Why Follows PR #518

PR #518 added local adapter prepare-output snapshots for:

- `not_ready`
- `waiting`
- `prepared_waiting_for_codex_return`

This follow-up bridges those snapshots into UI-ready view-models so the future UI does not invent labels, action copy, authority boundaries, density rules, or browser validation expectations.

## Implementation Scope

Implemented scope:

- pure local adapter snapshot surface integration library;
- generation CLI;
- deterministic Session Panel surface view-model fixture;
- deterministic Capture Review Inbox surface view-model fixture;
- deterministic integration readiness fixture;
- docs and report;
- smoke coverage and package scripts.

The change remains lib/scripts/docs/report/fixtures/smoke/package only.

## Inputs

The generator consumes the committed local adapter snapshot fixtures:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json`

Each generated view-model records the source snapshot path and exact-byte snapshot hash.

## Session Panel Surface View-Models

The Session Panel fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`

It contains exactly three scenarios:

- `not-prepared`
- `waiting-for-candidate`
- `prepared-waiting-for-codex-return`

The default scenario is `prepared-waiting-for-codex-return`. The prepared scenario says `Prepared, waiting for Codex return`, includes the manual-return caveat, and keeps validation, returned candidate, review decision, accepted state, and Constellation handoff unavailable.

## Capture Review Inbox Surface View-Models

The Inbox fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`

It contains exactly three items:

- not ready;
- waiting;
- prepared waiting for Codex return.

The prepared item remains `reviewability: waiting`, has stage `prepared_waiting_for_codex_return`, candidate count `0`, blocked reason count `0`, no review candidate object, no worker guidance, no validation action, no accepted state, and no Constellation handoff.

## Integration Readiness Summary

The readiness fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

It marks `status: ready_for_ui_implementation`, lists the two target surfaces, records scenario coverage, provides route suggestions without creating routes, requires browser validation for the next UI PR, and defines copy/density plus accessibility requirements.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:surface-integration -- --session-not-ready reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json --session-waiting reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json --session-prepared reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json --inbox-not-ready reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json --inbox-waiting reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json --inbox-prepared reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshot-surface-integration --generated-at 2026-06-11T00:00:00.000Z
```

The CLI writes Session Panel view-model JSON, Inbox view-model JSON, and readiness JSON. It does not run prepare, run validate, call helper scripts, call Codex, call network, or write runtime state.

## Copy and Density Policy

The future Session Panel should show one primary status, one caveat, one next safe action, compact timeline, warning count, authority summary, and no raw prompt/source/packet content.

The future Inbox item should show title, stage/reviewability, one caveat, max two badges, max three compact authority tags, warning count, and no full evidence dump by default.

Expanded details may show hashes, helper output refs, output sizes, and authority flags. `Prepared` must stay paired with `waiting for Codex return` or equivalent caveat. `prepare_helper_executed` must be labeled operational provenance only.

## Accessibility Plan

The next UI PR should validate keyboard order for:

- Session Panel scenario selector, status card, timeline, warning groups, evidence cards, authority details, and privacy/caveat details;
- Inbox filter bar, item list, selected item summary, warning/evidence details, and authority details.

Status must not rely on color alone. Prepared/waiting must be textually distinct from approved, accepted, or reviewable. Collapsed sections must expose state, and information must not be hover-only.

## Browser/Computer-Use Validation Plan

Browser/computer-use validation is skipped in this PR because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

The next UI PR must browser-validate scenario switching, filter switching, prepared item selection, no accepted/reviewable/Constellation implication, no PASS/BLOCKED implication, no raw prompt/source/packet/private marker text, keyboard traversal, 390px no horizontal overflow, no console warnings/errors, and no external provider/model/GitHub/Codex/OpenAI traffic.

## Validation and Rejection Coverage

The integration library and smoke cover:

- unsupported session or inbox snapshot versions;
- missing or invalid JSON inputs;
- missing prepared snapshot path;
- prepared session scenario mismatch;
- prepared inbox stage mismatch;
- prepared inbox reviewability drift;
- candidate count drift;
- accepted state drift;
- review-only drift;
- validate helper drift;
- review decision drift;
- accepted state creation drift;
- surface export drift;
- Constellation handoff drift;
- PASS/BLOCKED leakage;
- private marker leakage;
- badge and compact authority tag limits;
- required browser validation matrix presence.

## Deterministic Fixtures

Committed deterministic outputs:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

They are generated with `2026-06-11T00:00:00.000Z`.

## Privacy/Redaction Handling

The generated view-models include bounded paths, hashes, refs, sizes, labels, statuses, warning counts, and authority flags. They do not include raw prompt text, raw source input dumps, raw packet content, transcript content, returned candidate content, or private marker values.

## Authority Boundary

This PR does not run validate helper, call Codex, use the Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, automate clipboard, create review decisions, create proof/evidence/readiness records, or export surfaces to runtime/product state.

`prepare_helper_executed true` is operational provenance only. It is not accepted state, validation, readiness, reviewability, a review decision, or authority.

## Verification

Passed:

- `npm run typecheck`
- deterministic surface integration generation command listed above
- `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-output-snapshots`
- `npm run smoke:perspective-codex-former-local-adapter-snapshot-surface-integration`
- `git diff --check`
- `git diff --cached --check`

Attempted optional upstream smokes:

- `npm run smoke:perspective-codex-former-local-adapter-prepare-execution`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-execution-hardening`

Both optional smokes completed their behavioral rejection assertions and then failed only on historical changed-file boundary guardrails that do not include this new snapshot surface integration stage. Those unrelated historical guardrails were not widened.

## Skipped Checks With Reasons

Browser/computer-use validation is skipped because this PR adds no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture.

No prepare/validate helper execution is required for this PR because it consumes already committed snapshot fixtures from PR #518.

Optional prepare-execution and prepare-execution-hardening smokes are recorded as skipped for pass/fail gating because their only failures were older changed-file boundary allowlists outside this PR's required predecessor-smoke scope.

## Recommended Next PR

Implement read-only adapter snapshot fixture surface integration.

## What Codex Did Not Do

Codex did not implement UI, add routes, add React components, add CSS, modify existing route/component behavior, run browser/computer-use validation, run validate helper, call Codex, integrate the Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, capture live Codex sessions, automate clipboard, implement validate orchestration, export surfaces to runtime/product state, approve, merge, deploy, or make Core decisions.
