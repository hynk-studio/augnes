# Perspective Codex Former Local Adapter Surface Snapshots

## Summary

Added a local-only snapshot builder for Codex Former local adapter Session Panel and Capture Review Inbox item states.

The implementation emits deterministic JSON snapshots for not_ready and waiting states only.

## Why Follows PR #510

PR #510 hardened source-input preflight validation.

This PR uses that hardened preflight result to generate local fixture snapshots that can later feed read-only surface integration work.

## Snapshot Scope

Implemented only:

- Session Panel not-ready snapshot
- Session Panel waiting snapshot
- Capture Review Inbox item not_ready snapshot
- Capture Review Inbox item waiting snapshot

PASS with follow-up and BLOCKED adapter snapshots remain future work after validate summary modeling.

## Snapshot Inputs

Allowed inputs:

- bounded adapter manifest JSON;
- adapter-emitted source input JSON;
- source-input preflight summary JSON;
- optional generated timestamp override;
- optional explicit output paths.

The builder exposes optional helper metadata / returned envelope / validation summary paths only as bounded path-presence signals.

## Snapshot States

`not_ready` is emitted for manifest-only input, missing source input, missing passed preflight, failed preflight, or explicit manifest not_ready readiness.

`waiting` is emitted when manifest, source input, and passed preflight summary are present.

## Session Panel Snapshot

Session snapshots include scenario id, primary status, caveat, advisory next safe action, review-only and accepted-state false flags, timeline, evidence, warnings, authority facts, no Constellation handoff, and privacy boundary.

## Inbox Item Snapshot

Inbox item snapshots include reviewability, status, caveat, advisory next action, candidate count 0, metadata match not run, max two badges, authority facts, no usable Constellation handoff, and privacy boundary.

## Fixture Outputs

Committed deterministic fixtures:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-not-ready.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-waiting.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-not-ready.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-waiting.json`

No PR #500 or PR #501 fixture JSON was modified.

## Snapshot Summary

Each CLI run writes a deterministic summary with mode, generated timestamp, snapshot state, manifest path/hash, optional source input path/hash, optional preflight summary path/status, output paths, and false authority flags.

## Compatibility With Existing Surfaces

Smoke validates that Session Panel snapshots use `not-prepared` and `waiting-for-candidate` scenario ids accepted by the existing Session Panel helper.

Smoke validates that Inbox item snapshots use `not_ready` and `waiting` reviewability values accepted by the existing Capture Review Inbox helper.

This PR does not wire snapshots into UI.

## Validation and Rejection Coverage

Smoke covers missing option values, unknown options, duplicate options, output path collisions, invalid manifest, invalid source input, invalid preflight summary JSON, unsupported preflight mode, preflight hash mismatch, unsafe marker rejection, deterministic fixture generation, hash checks, shape checks, and changed-file boundaries.

## Privacy/Redaction Handling

Snapshots use bounded summaries only.

They do not include raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs, reports, and fixtures do not echo raw unsafe/private marker literals.

## Authority Boundary

This implementation does not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surface, automate clipboard, implement prepare orchestration, implement validate orchestration, implement Constellation Preview surface export, modify existing UI route/component behavior, or modify capture helper behavior.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshots-not-ready --generated-at 2026-06-11T00:00:00.000Z`
- `npm run perspective:codex-former:local-adapter:source-input -- --preflight-source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --summary-out /tmp/augnes-codex-former-local-adapter-source-input-preflight-summary.json`
- `npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary /tmp/augnes-codex-former-local-adapter-source-input-preflight-summary.json --out-dir /tmp/augnes-codex-former-local-adapter-snapshots-waiting --generated-at 2026-06-11T00:00:00.000Z`
- `npm run smoke:perspective-codex-former-local-adapter-source-input-preflight-hardening`
- `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Prepare/validate orchestration checks were skipped because this PR does not implement prepare orchestration or validate orchestration.

Optional `npm run smoke:perspective-codex-former-local-adapter-manifest-to-source-input` failed only on its older changed-file guard for `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOTS_V0_1.md`. That guard was not widened because this PR adds the later snapshot stage and the required snapshot/preflight smokes already enforce the current changed-file boundary.

## Recommended Next PR

Design local Codex adapter prepare orchestration mode.

## What Codex Did Not Do

Codex did not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surface, automate clipboard, implement prepare orchestration, implement validate orchestration, implement Constellation Preview surface export, modify existing UI route/component behavior, modify existing PR #500 or PR #501 fixture JSON, or modify capture helper behavior.
