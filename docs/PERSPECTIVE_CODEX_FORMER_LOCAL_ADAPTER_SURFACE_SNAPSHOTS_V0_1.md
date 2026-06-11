# Perspective Codex Former Local Adapter Surface Snapshots v0.1

## Purpose

This document records the local Codex adapter surface snapshot contract for Session Panel and Capture Review Inbox states.

The snapshot builder turns bounded local adapter manifest/source-input/preflight status into deterministic read-only JSON snapshots. It does not wire those snapshots into UI.

## Why Follows PR #510

PR #510 hardened local adapter CLI option parsing, strict unknown-field policy, and source-input preflight validation.

This PR uses that hardened local source-input path to generate deterministic local snapshots for the two adapter states that exist before prepare/validate orchestration: not_ready and waiting.

## Snapshot Scope

This implementation emits only:

- Session Panel snapshot: not-ready
- Session Panel snapshot: waiting for returned candidate
- Capture Review Inbox item snapshot: not_ready
- Capture Review Inbox item snapshot: waiting

It does not emit PASS with follow-up or BLOCKED adapter snapshots because the local adapter does not yet model prepare helper metadata, returned candidate envelopes, validate helper output, or validation summaries.

## Snapshot Inputs

Allowed inputs are:

- bounded adapter manifest JSON;
- adapter-emitted source input JSON;
- source-input preflight summary JSON;
- optional `generated_at` override;
- optional explicit output paths.

The builder may expose manifest optional path fields only as bounded path-presence booleans. It does not read helper metadata, returned envelope, or validation summary files.

## Snapshot States

`not_ready` means source input is missing, preflight has not passed, or manifest readiness is explicitly not_ready.

`waiting` means manifest exists, source input exists, preflight status passed, and no returned candidate or validation summary has been modeled by this adapter stage.

Invalid manifest/source-input/preflight material rejects and emits no snapshots.

## Session Panel Snapshot Shape

Session Panel snapshots use:

- `snapshot_version`: `codex_former_local_adapter_session_panel_snapshot.v0.1`
- `snapshot_kind`: `session_panel`
- `scenario_id`: `not-prepared` or `waiting-for-candidate`
- status labels and advisory next safe action copy
- review-only and accepted-state false flags
- timeline steps
- bounded evidence and path-presence signals
- warnings
- authority tags/facts/flags
- not-ready Constellation handoff
- privacy boundary

## Capture Review Inbox Item Snapshot Shape

Inbox item snapshots use:

- `snapshot_version`: `codex_former_local_adapter_inbox_item_snapshot.v0.1`
- `snapshot_kind`: `capture_review_inbox_item`
- `reviewability`: `not_ready` or `waiting`
- item status, caveat, and next safe action
- review-only and accepted-state false flags
- candidate count 0
- metadata match not run
- warning and blocked-reason counts
- max two badges
- authority tags/facts/flags
- safe links with no usable Constellation handoff
- privacy boundary

## CLI Usage

Generate snapshots:

```bash
npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshots-not-ready --generated-at 2026-06-11T00:00:00.000Z
```

Waiting snapshots require source input and passed preflight summary:

```bash
npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshots-waiting --generated-at 2026-06-11T00:00:00.000Z
```

The CLI prints paths, snapshot state, hashes, and the review-only authority boundary.

## Not-ready Fixture Generation

Not-ready fixtures are generated from the manifest only.

Committed outputs:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json`

## Waiting Fixture Generation

Waiting fixtures are generated from the manifest, committed source input fixture, and committed passed preflight summary fixture.

Committed outputs:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json`

## Snapshot Summary

Each CLI run writes a deterministic snapshot summary JSON to the requested summary path or the output directory default.

The summary includes mode, timestamp, snapshot state, manifest hash, optional source input hash, optional preflight status, output paths, and false authority flags.

## Compatibility With Existing Fixture Surfaces

The snapshots align with existing fixture surface concepts without importing UI components:

- Session Panel snapshot `scenario_id` uses `not-prepared` and `waiting-for-candidate`.
- Inbox item snapshot `reviewability` uses `not_ready` and `waiting`.
- No Constellation Preview handoff is available for these states.

Smoke validates shape-level compatibility against the existing Session Panel and Capture Review Inbox helper validators.

## Validation and Rejection Behavior

The CLI rejects:

- missing manifest;
- invalid manifest;
- missing provided source input path;
- invalid source input;
- missing provided preflight summary path;
- invalid preflight summary JSON;
- unsupported preflight summary mode;
- unsupported preflight summary status;
- preflight summary source-input hash mismatch;
- unsafe marker categories in snapshot inputs;
- output path collisions;
- output path directories;
- unknown CLI options;
- missing option values;
- duplicate singleton options.

## Privacy / Redaction Boundary

Snapshots use bounded summaries only.

They do not include raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs, reports, and fixtures use sanitized descriptions rather than echoing raw unsafe/private marker literals.

## Authority Boundary

This implementation is local-only, deterministic, review-only, and non-authorizing.

It has no prepare orchestration, no validate orchestration, no surface export beyond local snapshot files, no UI/routes/browser surface, no Codex/SDK/provider/GitHub/DB/network calls, no accepted state, no proof/evidence/readiness creation, no review decisions, no persistence, no clipboard automation, no approval/merge/deploy/Core decision, no live Codex capture, and no runtime fixture mutation.

## What This Does Not Do

This implementation does not:

- call Codex;
- integrate Codex SDK;
- call provider/model APIs;
- call GitHub APIs;
- call network;
- write DB records;
- persist accepted state;
- create proof/evidence/readiness records;
- create review decisions;
- add accept/promote/reject actions;
- automate clipboard;
- add UI/routes/browser surface;
- add prepare orchestration;
- add validate orchestration;
- add surface export beyond local snapshot files;
- modify existing UI route/component behavior;
- modify existing PR #500 or PR #501 fixture JSON;
- modify capture helper behavior.

## Future Work

Future work remains separate:

- PASS/BLOCKED adapter snapshots after validate summary modeling
- prepare orchestration design
- validate orchestration design
- surface integration for adapter snapshots

## Recommended Next PR

Design local Codex adapter prepare orchestration mode.

## Conclusion

PASS with follow-up
