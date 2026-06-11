# Perspective Codex Former Local Adapter Prepare Execution Hardening v0.1

## Purpose

This document records the hardening pass for local Codex adapter prepare execution. The adapter still has one executable responsibility: run the existing capture helper prepare path after a reviewed dry-run equivalence gate has passed, then summarize what happened in a bounded, deterministic JSON record.

## Why Follows PR #516

PR #516 added explicit `--execute` mode for local prepare orchestration. It validated current inputs against the dry-run plan, reserved the helper output directory, executed only the existing prepare helper, discovered helper outputs, and wrote a deterministic execution summary.

This follow-up tightens that path without expanding authority. It makes execution outcome semantics easier to read, separates attempted invocation from a process that actually ran, normalizes bounded logs, and adds richer output discovery diagnostics.

## Hardening Scope

The hardening scope is CLI/lib/docs/report/fixture/smoke/package only.

It includes:

- explicit execution result modeling;
- helper invocation provenance fields;
- bounded log classification and normalization;
- helper metadata checks for source hash, timestamp, and prompt hash comparability;
- output discovery caveats;
- pure-function failure and incomplete-discovery coverage;
- stale dry-run and equivalence rejection coverage;
- deterministic success fixture schema update.

## Execution Outcome Semantics

The execution summary now exposes direct outcome fields:

- `helper_invocation_attempted`: the adapter attempted to spawn the helper process.
- `helper_process_started`: the process started enough to return normal process output or status.
- `helper_exit_status`: `success` or `failed`.
- `helper_exit_code`: the helper process status when available.
- `output_discovery_status`: `complete`, `incomplete`, `failed`, or `not_run`.
- `execution_result`: `success`, `helper_failed`, `output_incomplete`, or `invocation_failed`.
- `failure_kind`: `null`, `helper_exit_nonzero`, `output_discovery_incomplete`, `helper_spawn_failed`, or `summary_write_failed`.

For the deterministic happy path, invocation is attempted, the helper process starts, the helper exits with code `0`, output discovery is complete, `execution_result` is `success`, and `failure_kind` is `null`.

## Helper Invocation Provenance

`helper_invocation_attempted` and `helper_process_started` are operational provenance fields. They are not acceptance, validation, readiness, or review decisions.

`prepare_helper_executed true` is operational provenance only. It means the existing prepare helper process actually ran. It is not accepted state. It is not validation. It is not readiness. It is not a review decision. It is not authority.

If the adapter attempts to spawn the helper but the process does not start, `helper_invocation_attempted` is true, `helper_process_started` is false, `prepare_helper_executed` is false, and `execution_result` is `invocation_failed`.

## Bounded Log Normalization

The execution summary keeps bounded stdout/stderr lines and adds normalized review fields:

- `normalized_lines`: stable review categories such as npm wrapper, helper key/value, blank, omitted unsafe, or other.
- `line_events`: per-line classification events.
- `npm_wrapper_line_count`: count of wrapper noise lines.
- `helper_kv_line_count`: count of helper key/value lines.

The adapter still enforces line and character bounds. If an unsafe/private marker category appears in a log line, the line is omitted from the bounded public summary and `unsafe_marker_omitted` is true. Raw prompt text, raw source input, and private marker values are not echoed into the public execution summary.

## Output Discovery Hardening

Output discovery is complete only when the helper metadata, copyable prompt, and return envelope template are present and hashable.

The execution summary now includes `helper_metadata_checks`:

- `metadata_parse_status`: `parsed`, `missing`, or `invalid_json`.
- `source_input_hash_match`: `true`, `false`, or `not_present`.
- `generated_at_match`: `true`, `false`, or `not_present`.
- `metadata_source_prompt_hash`: bounded metadata prompt hash when present.
- `prompt_file_sha256`: SHA-256 of the prompt file when present.
- `prompt_hash_match`: `true`, `false`, `not_comparable`, or `not_present`.

The current helper metadata exposes a compact prompt hash rather than a SHA-256 prompt file hash, so the success fixture records both values and marks the prompt comparison `not_comparable`.

`output_discovery_caveats` records bounded diagnostic notes for missing metadata, missing prompt, missing return envelope template, invalid metadata JSON, inconsistent source hash, inconsistent timestamp, or non-authorizing metadata drift.

Manual copy packet and former input packet references remain bounded refs. They are not treated as helper output files unless actual files are present.

## Dry-Run Equivalence Hardening

Execution still requires a reviewed dry-run summary. Before running the helper, the adapter reconstructs the helper command from current inputs and compares both the argv array and stable argv hash to the dry-run summary.

The hardening smoke also verifies rejection for stale or incompatible dry-run summaries:

- `dry_run` false;
- helper exit status not `not_run`;
- execution readiness false;
- source input path mismatch;
- preflight summary path mismatch;
- manifest path mismatch when a manifest is supplied;
- generated timestamp mismatch;
- helper argv hash mismatch;
- source input hash mismatch;
- preflight source input hash mismatch.

No execution happens before this gate passes.

## Summary Write and Failure Behavior

For the happy path, the adapter writes the execution summary after helper execution and output discovery.

If the helper exits non-zero after the process starts, the adapter can still write a bounded failure summary when a safe summary path was supplied. If output discovery is incomplete after a zero exit, the summary records `execution_result` as `output_incomplete` and `failure_kind` as `output_discovery_incomplete`.

If summary writing fails after helper success, the CLI reports the failure and leaves helper outputs intact. That filesystem edge is documented but not forced through permissions tricks in smoke.

## CLI and Mode Hardening

The existing command remains:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input <path> --preflight-summary <path> --dry-run-summary <path> --out-dir <path>
```

`--dry-run` and `--execute` remain mutually exclusive. Supplying neither mode rejects. Unknown provider, GitHub, network, DB, validate, or command override style options reject as unknown options.

`--bounded-log-lines` accepts integers from `1` through `200`. Small bounds deterministically reduce included log lines while preserving total line counts and truncation metadata.

`--prepare-execution-summary-out` remains optional. If omitted, execution still runs and prints the concise CLI summary; no execution summary file is written.

## Fixture Impact

The deterministic success fixture is updated for the hardened schema:

`reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json`

It keeps:

- `generated_at` as `2026-06-11T00:00:00.000Z`;
- helper out-dir as `/tmp/augnes-codex-former-local-adapter-prepare-execution`;
- committed source input, preflight summary, and manifest fixtures.

No helper output files are committed.

## Privacy / Redaction Boundary

The public summary, docs, report, and fixtures do not include raw prompt contents, raw source input contents, raw packet contents, transcript-like payload dumps, or private marker literals.

Logs are summarized with bounded line and character limits. Unsafe/private marker categories are omitted from public log summaries.

## Authority Boundary

This hardening pass has no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, no surface export, and no UI/routes/browser surface.

Authority flags remain false for accepted state, proof/evidence/readiness records, review decisions, provider/model calls, Codex SDK calls, GitHub calls, network calls, DB writes, clipboard automation, live Codex capture, runtime fixture mutation, validate helper execution, surface export, and Core decisions.

## What This Does Not Do

This does not validate a returned envelope. It does not call Codex. It does not capture a live Codex session. It does not accept, promote, reject, merge, deploy, or make Core decisions. It does not create UI, routes, browser surfaces, DB records, proof records, evidence records, readiness records, review decisions, or accepted state.

## Future Work

- Prepare-output snapshots for Session Panel and Inbox.
- Validate orchestration design.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Add prepare-output snapshots for Session Panel and Inbox states.

The execution path now has enough hardened local provenance to model what operators should see after prepare execution, while still keeping validation and acceptance out of scope.

## Conclusion

PASS with follow-up.
