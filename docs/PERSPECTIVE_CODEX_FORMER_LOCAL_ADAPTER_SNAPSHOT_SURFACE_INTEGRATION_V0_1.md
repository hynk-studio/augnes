# Perspective Codex Former Local Adapter Snapshot Surface Integration v0.1

## Purpose

This document defines the non-UI readiness layer for rendering local Codex adapter snapshots in future read-only surfaces. It converts committed adapter snapshot fixtures into deterministic, UI-ready view-model fixtures for the Codex Session Perspective Panel and Capture Review Inbox.

This PR prepares the next UI implementation PR. It does not implement UI.

## Why Follows PR #518

PR #518 added local adapter snapshot fixtures for `not_ready`, `waiting`, and `prepared_waiting_for_codex_return`.

This follow-up bridges those fixtures into stable view-models so the UI implementation does not need to reread historical source files or invent labels, tones, warnings, authority copy, or browser validation expectations.

## UI Implementation Readiness Scope

Scope is lib/scripts/docs/report/fixtures/smoke/package only.

The readiness layer:

- reads existing committed adapter snapshot fixtures;
- validates that they remain read-only and non-authorizing;
- emits Session Panel surface view-models;
- emits Capture Review Inbox surface view-models;
- emits an integration readiness summary for the next UI PR.

There is no UI implementation in this PR, no routes, no components, no CSS, and no browser-visible surface.

## Inputs

The generator consumes six committed snapshot fixtures:

- Session Panel not ready;
- Session Panel waiting;
- Session Panel prepared;
- Inbox item not ready;
- Inbox item waiting;
- Inbox item prepared.

Each input path and exact-byte SHA-256 hash is recorded in the generated view-model fixtures.

## Session Panel View-Model Contract

The Session Panel view-model fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`

It contains exactly three scenarios:

- `not-prepared`;
- `waiting-for-candidate`;
- `prepared-waiting-for-codex-return`.

The default scenario is `prepared-waiting-for-codex-return`.

Each scenario includes UI-ready labels, a display tone, compact timeline, evidence cards, warning groups, authority summary, authority details, handoff status, privacy summary, source snapshot path, and source snapshot hash.

The prepared scenario must say `Prepared, waiting for Codex return`, include the caveat that manual Codex return has not been captured, and keep Constellation, validation, returned candidate, review candidate, and accepted state unavailable.

## Capture Review Inbox View-Model Contract

The Inbox view-model fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`

It contains exactly three items:

- not ready;
- waiting;
- prepared waiting for Codex return.

The default selected item is `local-adapter-prepared-waiting-for-codex-return`.

The prepared item remains `reviewability: waiting`, has stage `prepared_waiting_for_codex_return`, candidate count `0`, blocked reason count `0`, max two badges, max three compact authority tags, no review candidate, no worker guidance, no validation action, and no usable Constellation handoff.

## Integration Readiness Summary

The readiness fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

It marks status `ready_for_ui_implementation`, lists the two target surfaces, records scenario coverage, gives future route suggestions without creating routes, requires browser validation for the next UI PR, and captures copy/density and accessibility requirements.

`prepare_helper_executed true` appears only as prepared operational provenance, not authority.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:surface-integration -- --session-not-ready reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json --session-waiting reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json --session-prepared reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json --inbox-not-ready reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json --inbox-waiting reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json --inbox-prepared reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshot-surface-integration --generated-at 2026-06-11T00:00:00.000Z
```

The generator writes:

- Session Panel surface view-model JSON;
- Inbox surface view-model JSON;
- integration readiness JSON.

It does not create UI files, call helper scripts, run prepare/validate, call Codex, call network, or write runtime state.

## Copy and Density Policy

The future Session Panel UI should show one primary status, one caveat, one next safe action, compact timeline, warning count, authority summary, and no raw prompt/source/packet content.

The future Inbox list item should show title, stage/reviewability, one caveat, max two badges, max three compact authority tags, warning count, and no full evidence dump by default.

Expanded details may show hashes, helper output refs, output sizes, and authority flags.

No Accept, Approve, Promote, Reject, Validate, Run Codex, Merge, or Deploy button copy is allowed.

`Prepared` must always be paired with `waiting for Codex return` or an equivalent caveat. `Local snapshot available` must not be rendered as product approval or graph handoff. `prepare_helper_executed` must be labeled operational provenance only.

## Accessibility Plan

The next UI PR should use this keyboard order for Session Panel:

- scenario selector;
- status card;
- timeline;
- warning groups;
- evidence cards;
- authority details;
- privacy/caveat details.

The next UI PR should use this keyboard order for Inbox:

- filter bar;
- item list;
- selected item summary;
- warning/evidence details;
- authority details.

Status must not rely on color alone. Prepared/waiting must be textually distinct from approved, accepted, or reviewable. Collapsed sections must expose expanded/collapsed state. No information should be hover-only. Screen reader labels must include status, caveat, review-only boundary, and next safe action.

## Browser/Computer-Use Validation Plan For Next UI PR

Because this PR adds no UI, browser/computer-use validation is skipped here.

The next UI implementation PR must browser-validate:

- opening the future adapter snapshot route or fixture surface;
- Session Panel scenario switching for not_ready / waiting / prepared;
- Inbox filter switching for all / not_ready / waiting / prepared;
- selecting the prepared inbox item;
- prepared item is waiting, not reviewable;
- no accepted-state implication;
- no PASS/BLOCKED implication;
- no Constellation handoff for prepared;
- no Validate / Run Codex / Accept / Promote / Reject controls;
- no raw prompt/source/packet/private marker text;
- keyboard traversal basics;
- 390px no horizontal overflow;
- no console warnings/errors;
- no external provider/model/GitHub/Codex/OpenAI traffic.

## Validation and Rejection Behavior

The builder and smoke reject:

- unsupported session or inbox snapshot versions;
- missing prepared session or inbox snapshots;
- prepared session scenario mismatch;
- prepared inbox stage mismatch;
- prepared inbox reviewability other than waiting;
- candidate count other than `0`;
- accepted state true;
- review-only false;
- validate helper executed true;
- review decision true;
- accepted state true;
- surface export true;
- Constellation handoff available;
- PASS/BLOCKED text leakage;
- raw prompt/source/packet content leakage;
- badges over limit;
- compact authority tags over limit;
- missing browser validation matrix in readiness summary.

## Deterministic Fixtures

Generated fixtures:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-surface-view-models.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-snapshot-surface-integration-readiness.json`

They are generated with `2026-06-11T00:00:00.000Z` and committed local adapter snapshot fixtures.

## Privacy / Redaction Boundary

The view-models include bounded paths, hashes, refs, sizes, labels, statuses, warnings, and authority flags. They do not include raw prompt text, raw source input dumps, raw packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

This PR has no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, no surface export to runtime/product state, and no UI/routes/browser surface.

The prepared state is still waiting for human-started Codex return. `prepare_helper_executed true` is operational provenance only.

## What This Does Not Do

This does not implement UI, add routes, add React components, add CSS, add browser-visible surfaces, wire snapshots into existing routes, run browser validation, run validate helper, call Codex, integrate the Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, capture live Codex sessions, automate clipboard, implement validate orchestration, or export surfaces to runtime/product state.

## Future Work

- Implement read-only adapter snapshot fixture surface integration.
- Browser-validate adapter snapshot UI.
- Design validate orchestration mode.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Implement read-only adapter snapshot fixture surface integration.

## Conclusion

PASS with follow-up.
