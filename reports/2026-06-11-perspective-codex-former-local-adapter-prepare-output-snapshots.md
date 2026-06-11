# Perspective Codex Former Local Adapter Prepare Output Snapshots Report

## Summary

This PR adds local-only prepare-output snapshots for the Codex Session Perspective Panel and Capture Review Inbox. The new state is `prepared_waiting_for_codex_return`: prepare execution succeeded and helper outputs were discovered, but no returned Codex candidate exists.

The work extends the existing snapshot builder and CLI to consume a hardened prepare execution summary as read-only input. It adds deterministic prepared fixtures and smoke coverage for success, rejection, shape compatibility, privacy, and authority boundaries.

## Why Follows PR #517

PR #517 hardened prepare execution summaries with direct execution result fields, helper invocation/process-start provenance, bounded log normalization/classification, metadata/output discovery checks, and deterministic success fixture updates.

Those fields provide enough local provenance to project a prepared product state without validation, acceptance, or UI wiring.

## Implementation Scope

Scope is CLI/lib/docs/report/fixture/smoke/package only.

Changed behavior:

- snapshot builder accepts optional prepare execution summary input;
- snapshot CLI accepts `--prepare-execution-summary`;
- prepared Session Panel and Inbox item fixtures are generated deterministically;
- snapshot summary records prepare execution provenance;
- smoke validates prepared output and rejection behavior.

## Snapshot State

The new state is:

`prepared_waiting_for_codex_return`

It means the generated prompt/manual copy packet and return envelope template are available from the prepare helper, and the operator is waiting for a human-started separate Codex session to return exactly one candidate envelope.

It is not PASS, BLOCKED, Constellation handoff, accepted state, review decision, live Codex integration, or UI wiring.

## Inputs

Prepared snapshots require:

- manifest fixture;
- source input fixture;
- passed preflight summary fixture;
- successful prepare execution summary fixture.

The builder records bounded provenance: manifest/source/preflight/prepare summary hashes, helper output refs/hashes/sizes, helper out-dir, helper argv hash, output discovery status, execution result, prepare helper execution provenance, and validate helper false.

## Prepare Execution Summary Validation

Prepared snapshot generation validates:

- summary version and mode;
- success exit status and exit code `0`;
- output discovery complete;
- execution result success;
- failure kind null;
- authority flags remain non-authorizing;
- source/preflight/manifest hashes match current input bytes;
- helper output paths, refs, hashes, and sizes are present and bounded;
- helper metadata checks are parsed and consistent;
- unsafe/private marker categories reject without echoing raw values.

Failed or incomplete prepare execution summaries reject. No prepared snapshot is emitted from failed or incomplete prepare execution.

## Session Panel Prepared Snapshot

Added fixture:

`reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json`

It records scenario `prepared-waiting-for-codex-return`, status `Prepared, waiting for Codex return`, review-only true, accepted state false, prepare execution complete, manual copy packet/prompt available, separate Codex session waiting, returned candidate waiting, validation not started, review candidate unavailable, and Constellation handoff unavailable.

## Inbox Prepared Snapshot

Added fixture:

`reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json`

It records item `local-adapter-prepared-waiting-for-codex-return`, title/status `Prepared, waiting for Codex return`, reviewability `waiting`, stage `prepared_waiting_for_codex_return`, candidate count `0`, metadata match `not_run`, blocked reason count `0`, badges `prepared` and `waiting`, and bounded prepare execution evidence.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --prepare-execution-summary reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-output-snapshots --generated-at 2026-06-11T00:00:00.000Z
```

Existing manifest-only and waiting snapshot generation remain compatible.

## Compatibility With Existing Surfaces

The prepared snapshots are local adapter data fixtures only. They are not wired into UI routes or browser-visible product surfaces.

The Session Panel snapshot uses a new local adapter scenario id. The Inbox item remains `waiting`, not reviewable. No review candidate, worker guidance, validation next action, PASS/BLOCKED state, or usable Constellation handoff is implied.

## Rejection Coverage

Smoke covers:

- missing and invalid prepare execution summary;
- wrong version/mode;
- failed helper status;
- nonzero helper exit;
- incomplete output discovery;
- non-success execution result;
- non-null failure kind;
- prepare helper false;
- validate helper true;
- accepted state true;
- review decision true;
- source/preflight/manifest hash mismatch;
- missing helper output hash;
- missing helper output size;
- metadata not parsed;
- metadata source hash mismatch;
- unsafe marker category rejection without raw value echo;
- output path collisions.

## Deterministic Fixtures

Added fixtures:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-output-snapshot-summary.json`

Generated with `generated_at` `2026-06-11T00:00:00.000Z` and out-dir `/tmp/augnes-codex-former-local-adapter-prepare-output-snapshots`.

No helper output files were committed.

## Privacy/Redaction Handling

Prepared snapshots include bounded paths, refs, hashes, sizes, statuses, and authority flags. They do not include raw prompt text, raw source input dumps, raw packet content, returned candidate content, transcript content, or private marker values.

Public docs/reports/fixtures are smoke-checked for raw unsafe/private marker literals.

## Authority Boundary

This PR keeps no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, no surface export, and no UI/routes/browser surface.

`prepare_helper_executed true` is operational provenance only. The prepared snapshot is still waiting for human-started Codex return.

## Verification

Verification commands run for this PR:

- PASS: `npm run typecheck`
- PASS: deterministic prepare-output snapshot generation to `/tmp/augnes-codex-former-local-adapter-prepare-output-snapshots`
- PASS: generated prepared session, inbox, and summary JSON matched committed fixtures byte-for-byte
- PASS: `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-execution`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-execution-hardening`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-output-snapshots`

Whitespace checks are reported in the PR body after staging.

## Skipped Checks With Reasons

Browser/computer-use validation is skipped because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

`npm run smoke:perspective-codex-former-local-adapter-prepare-execution-design` was attempted and failed only on its design-only changed-file guard:

`prepare execution design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_OUTPUT_SNAPSHOTS_V0_1.md`

That historical guard was not widened because this PR is a prepare-output snapshot implementation slice, not the original execution-design slice.

## Recommended Next PR

Design read-only adapter snapshot surface integration.

## What Codex Did Not Do

Codex did not run validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surface, automate clipboard, implement validate orchestration, implement surface export, or modify existing UI route/component behavior.
