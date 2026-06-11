# Perspective Codex Former Local Adapter Prepare Output Snapshots v0.1

## Purpose

This document defines local-only prepare-output snapshots for the Codex Session Perspective Panel and Capture Review Inbox. The snapshots represent the state after prepare execution succeeds and helper outputs are discovered, but before any returned Codex candidate exists.

The product state is prepared / waiting for separate Codex return.

## Why Follows PR #517

PR #517 hardened prepare execution summaries with explicit execution result, helper invocation/process-start provenance, bounded log normalization, metadata/output discovery checks, and deterministic success fixture updates.

This PR consumes that hardened execution summary as read-only local input and projects it into two deterministic snapshot fixtures:

- Session Panel prepared state.
- Capture Review Inbox prepared item state.

## Implementation Scope

Scope is CLI/lib/docs/report/fixture/smoke/package only.

The snapshot builder and CLI accept `--prepare-execution-summary` as optional input. Manifest-only generation keeps producing `not_ready`; manifest + source input + passed preflight keeps producing `waiting`; manifest + source input + passed preflight + successful prepare execution summary produces `prepared_waiting_for_codex_return`.

## Snapshot State

The new snapshot state is:

`prepared_waiting_for_codex_return`

It means the local prepare helper has already produced prompt/return-envelope/helper metadata outputs, and the operator is waiting for a human-started separate Codex session to return exactly one candidate envelope.

It is not validation PASS, validation BLOCKED, Constellation handoff, accepted state, review decision, live Codex integration, or UI wiring.

## Inputs

Prepared snapshots require:

- manifest JSON;
- source input JSON;
- passed source-input preflight summary JSON;
- successful prepare execution summary JSON.

The builder records bounded provenance from those inputs: manifest path/hash, source input path/hash, preflight summary path/hash, prepare execution summary path/hash, helper out-dir, helper command argv hash, helper output refs, helper output hashes, helper output sizes, output discovery status, execution result, prepare helper execution provenance, and validate helper false.

## Prepare Execution Summary Validation

When supplied, the prepare execution summary must be a JSON object with:

- `prepare_execution_summary_version` equal to `codex_former_local_adapter_prepare_execution_summary.v0.1`;
- `mode` equal to `prepare-orchestration-execution`;
- helper exit status `success`;
- helper exit code `0`;
- output discovery status `complete`;
- execution result `success`;
- `failure_kind` null;
- source input hash matching current source input bytes;
- preflight summary hash matching current preflight summary bytes;
- manifest hash matching current manifest bytes;
- bounded helper output refs;
- required prompt, return envelope template, and helper metadata paths;
- required prompt, return envelope template, and helper metadata SHA-256 hashes;
- required non-negative output sizes;
- parsed helper metadata checks;
- metadata source input hash match true;
- generated timestamp match true or not present;
- prepare helper executed true;
- validate helper executed false;
- accepted state, proof/evidence/readiness, review decision, surface export, network, provider/model, Codex SDK, GitHub, DB, and clipboard authority flags false.

Failed or incomplete prepare execution summaries reject. No prepared snapshot is emitted from incomplete or failed prepare execution.

## Session Panel Prepared Snapshot

The prepared Session Panel snapshot fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-session-panel-snapshot-prepared.json`

It uses:

- `snapshot_kind`: `session_panel`;
- `scenario_id`: `prepared-waiting-for-codex-return`;
- `primary_status_label`: `Prepared, waiting for Codex return`;
- review-only true;
- accepted state false;
- timeline entries for source input complete, preflight complete, prepare execution complete, prompt/manual copy packet available, separate Codex session waiting, returned candidate waiting, validation not started, review candidate unavailable, and Constellation handoff unavailable.

Evidence is bounded to paths, hashes, refs, sizes, and operational provenance. It does not include raw prompt text, raw source input dumps, or raw packet content.

## Inbox Prepared Snapshot

The prepared Capture Review Inbox item fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-inbox-item-prepared.json`

It uses:

- `snapshot_kind`: `capture_review_inbox_item`;
- `item_id`: `local-adapter-prepared-waiting-for-codex-return`;
- `title`: `Prepared, waiting for Codex return`;
- `reviewability`: `waiting`;
- `stage`: `prepared_waiting_for_codex_return`;
- candidate count `0`;
- metadata match `not_run`;
- blocked reason count `0`;
- badges `prepared` and `waiting`.

The inbox item remains waiting because no returned candidate exists and validation has not run.

## Snapshot Summary

The optional prepared snapshot summary fixture is:

`reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-output-snapshot-summary.json`

It records snapshot state, input paths/hashes, prepared snapshot output paths, prepare execution summary path/hash, output discovery status, execution result, prepare helper executed as operational provenance, validate helper false, and non-authorizing authority flags.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:snapshots -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --prepare-execution-summary reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-output-snapshots --generated-at 2026-06-11T00:00:00.000Z
```

`--prepare-execution-summary` is optional. If supplied, source input and passed preflight summary are also required.

The snapshot CLI does not run prepare helper, validate helper, Codex, provider/model APIs, GitHub APIs, network calls, DB writes, or clipboard automation.

## Compatibility With Existing Fixture Surfaces

The prepared snapshots are local adapter snapshot fixtures, not wired UI route scenarios.

They are shape-compatible with future read-only Session Panel and Inbox integration because they expose stable status labels, reviewability, timeline/evidence blocks, badges, authority tags, and safe-link placeholders.

They do not add review candidates, worker guidance, validation next actions, Constellation handoff, PASS state, or BLOCKED state.

## Rejection Behavior

Prepared snapshot generation rejects:

- missing or invalid prepare execution summary;
- unsupported summary version or mode;
- non-success helper status or nonzero exit;
- incomplete output discovery;
- non-success execution result;
- non-null failure kind;
- prepare helper not executed;
- validate helper executed;
- accepted state or review decision flags true;
- source, preflight, or manifest hash mismatch;
- missing helper output hash or size;
- metadata parse status not parsed;
- metadata source input hash mismatch;
- unsafe/private marker categories.

Unsafe/private marker values are not echoed.

## Deterministic Fixtures

Generated with:

- `generated_at`: `2026-06-11T00:00:00.000Z`;
- committed manifest/source/preflight/prepare execution summary fixtures;
- out-dir `/tmp/augnes-codex-former-local-adapter-prepare-output-snapshots`.

No helper output files are committed.

## Privacy / Redaction Boundary

Prepared snapshots include bounded paths, refs, hashes, sizes, status strings, and authority flags only. They do not include raw prompt text, raw source input dump, raw packet content, returned candidate content, transcript content, or private marker values.

## Authority Boundary

This PR has no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, no surface export, and no UI/routes/browser surface.

`prepare_helper_executed true` is operational provenance only. It is not acceptance, validation, readiness, review decision, or authority.

The prepared snapshot is still waiting for human-started Codex return.

## What This Does Not Do

This does not run prepare execution, run validation, call Codex, call providers, call GitHub, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, implement accept/promote/reject actions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surface, implement validate orchestration, or export surfaces.

## Future Work

- Wire adapter snapshots into read-only Session Panel / Inbox fixture surfaces.
- Design validate orchestration mode.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Design read-only adapter snapshot surface integration.

The prepared snapshot shape is now available as deterministic local fixture data; the next useful step is integration design before route/component wiring.

## Conclusion

PASS with follow-up.
