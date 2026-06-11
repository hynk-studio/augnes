# Perspective Codex Former Local Adapter Prepare Execution v0.1

## Purpose

This document records the first implementation of local Codex adapter prepare orchestration execution mode.

Prepare execution performs one local operation: it runs the existing capture helper prepare path after proving that the command matches a reviewed prepare dry-run summary. It writes a bounded execution summary describing local helper outputs, hashes, sizes, and authority boundaries.

## Why Follows PR #515

PR #515 designed execution as a strict bridge from reviewed dry-run readiness to one helper-only local prepare run. That design depended on PR #514 hardening: `execution_readiness`, command argv hashing, helper availability checks, manifest consistency checks, and output path hardening.

This implementation follows because the adapter can now compare current inputs against a dry-run summary before any execution occurs.

## Implementation Scope

The implementation changes only CLI/library/docs/report/fixture/smoke/package surfaces.

It adds:

- explicit `--execute` mode to the existing `perspective:codex-former:local-adapter:prepare` command;
- dry-run to execution equivalence validation;
- safe output directory reservation;
- helper-only local prepare invocation;
- bounded stdout/stderr summaries;
- helper output discovery;
- deterministic execution summary JSON;
- smoke coverage for success, rejection, authority, and boundary behavior.

## Execution Mode Scope

Execution mode runs only the existing capture helper prepare path:

This means execution runs only existing capture helper prepare path behavior and no other local command.

```bash
npm run perspective:codex-former:capture-packet -- --out-dir <out-dir> --source-input <source-input-path> --generated-at <generated-at>
```

It does not call Codex, run the validate helper, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, automate clipboard, create review decisions, export surfaces, mutate runtime fixtures, or add UI/routes/browser surfaces.

## Required Inputs

Required for `--execute`:

- `--source-input <path>`
- `--preflight-summary <path>`
- `--dry-run-summary <path>`
- `--out-dir <path>`

Optional:

- `--manifest <path>`
- `--generated-at <iso>`
- `--expected-source-input-hash <sha256>`
- `--expected-helper-command-argv-hash <sha256>`
- `--prepare-execution-summary-out <path>`
- `--bounded-log-lines <integer>`

`--dry-run` and `--execute` are mutually exclusive. Supplying neither is rejected. `--execute` is explicit and does not accept a value.

## Dry-Run Equivalence Gate

Execution validates all local inputs before creating the helper output directory.

The adapter:

- reads source input bytes and validates source input shape;
- computes source input hash from exact bytes;
- validates preflight summary version, mode, status, empty errors, warning count, and source input hash;
- reads the dry-run summary and requires `mode: prepare-orchestration-dry-run`, `dry_run: true`, `helper_exit_status: not_run`, and ready `execution_readiness`;
- reconstructs helper argv from current source input path, out-dir, and generated_at;
- stable-stringifies argv and computes SHA-256;
- compares reconstructed argv and hash to the reviewed dry-run summary;
- compares current source input hash to both preflight and dry-run summaries;
- validates expected hashes when supplied;
- validates manifest/source-input consistency when a manifest is supplied.

Path equivalence policy is exact string equality for source input path, preflight summary path, manifest path, and helper out-dir. This matches committed fixture mode and avoids silently accepting unrelated paths.

## CLI Usage

Dry-run remains compatible:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-execution --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json
```

Execution:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --dry-run-summary /tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-execution --generated-at 2026-06-11T00:00:00.000Z --prepare-execution-summary-out /tmp/augnes-codex-former-local-adapter-prepare-execution-summary.json
```

Unknown options, duplicate options, missing values, positional arguments, arbitrary command overrides, provider/GitHub/network/DB-style options, and boolean values for `--execute` or `--dry-run` are rejected.

## Output Directory Policy

Execution requires an explicit helper out-dir.

The adapter rejects:

- existing files;
- non-empty directories;
- execution summary output inside or equal to the helper out-dir;
- summary path collisions with source input, preflight summary, dry-run summary, or manifest.

Absent directories and existing empty directories are allowed. The directory is created immediately before helper execution. Failed helper output is preserved for operator inspection.

## Helper Invocation

Execution uses an execFile-style process invocation with fixed command kind `existing_capture_helper_prepare`.

The adapter does not read or run a caller-provided command. It invokes `npm` with a fixed argv array derived from the reviewed dry-run command. It does not run the validate helper.

## Bounded stdout/stderr Policy

The execution summary includes bounded stdout/stderr summaries:

- total line count;
- included line count;
- truncation flag;
- omitted line count;
- bounded lines;
- unsafe marker omission flag;
- max line and character limits.

Default bounds are 40 lines and 4000 characters. `--bounded-log-lines` may reduce or raise the line limit within the documented CLI range.

Lines containing unsafe/private marker categories are omitted from the summary and recorded with `unsafe_marker_omitted: true`. Raw packet contents, raw source input, and raw prompt text are not dumped into public reports or fixtures.

## Helper Output Discovery

After helper execution, the adapter discovers:

- `codex-former-capture-metadata.json`;
- `codex-former-copyable-prompt.txt`;
- `codex-former-capture-return-envelope-template.txt`.

Metadata is preferred for output paths and bounded refs. Known filenames are fallback candidates.

The execution summary records:

- manual copy packet ref when metadata supplies it;
- former input packet ref when metadata supplies it;
- prompt path;
- return envelope template path;
- helper metadata path;
- SHA-256 hashes for actual files;
- file sizes for actual files.

Manual copy packet and former input packet paths remain null because the existing helper supplies bounded refs, not standalone packet files.

## Execution Summary Contract

Summary version:

```text
codex_former_local_adapter_prepare_execution_summary.v0.1
```

Mode:

```text
prepare-orchestration-execution
```

The summary includes generated_at, source/preflight/dry-run paths and hashes, optional manifest path/hash, helper out-dir, helper command argv/hash, helper exit status/code, bounded logs, output paths/refs/hashes/sizes, discovery status, next safe action, caveats, execution readiness snapshot, failure kind, and authority flags.

Authority flags remain non-authorizing. `prepare_helper_executed: true` is operational provenance only. It is not accepted state, validation, readiness, a review decision, or authority.

## Success Behavior

If helper exits zero and output discovery is complete:

- `helper_exit_status` is `success`;
- `helper_exit_code` is `0`;
- `output_discovery_status` is `complete`;
- `prepare_helper_executed` is `true`;
- `validate_helper_executed` is `false`;
- next safe action is to use the generated manual copy packet / prompt in a separate user-started Codex session, then return exactly one candidate envelope for validation.

There is no Constellation handoff, PASS/BLOCKED state, accepted state, or review decision.

## Failure Behavior

If helper exits non-zero:

- the out-dir is preserved;
- a bounded execution summary is written when a safe summary path is supplied;
- `helper_exit_status` is `failed`;
- `failure_kind` is `helper_exit_nonzero`;
- no retry or cleanup occurs.

If helper exits zero but output discovery is incomplete:

- helper exit remains `success`;
- `output_discovery_status` is `incomplete`;
- `failure_kind` is `output_discovery_incomplete`;
- files are preserved;
- no accepted state is implied.

If summary writing fails after helper success, the CLI reports failure and leaves helper outputs intact.

## Deterministic Fixture

Committed fixture:

```text
reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json
```

It is generated from the committed source input, preflight summary, manifest, a matching dry-run summary, deterministic generated_at `2026-06-11T00:00:00.000Z`, and helper out-dir `/tmp/augnes-codex-former-local-adapter-prepare-execution`.

Only the execution summary fixture is committed. Helper output files remain local `/tmp` artifacts.

## State Mapping to Surfaces

Prepare execution success maps to prepared / waiting-for-separate-Codex-return semantics for future Session Panel and Inbox snapshots.

This PR does not implement those snapshots, mutate existing fixtures, export surfaces, add routes, or change browser-visible behavior.

## Privacy / Redaction Boundary

The implementation uses paths, hashes, sizes, bounded refs, and bounded logs. It avoids raw prompt dumps, raw source material dumps, raw returned material, screenshots, browser dumps, provider material, credentials, and private account material in public artifacts.

## Authority Boundary

This implementation explicitly preserves:

- no Codex call;
- no validate helper;
- no provider/model API;
- no GitHub API;
- no network;
- no DB;
- no persistence;
- no clipboard automation;
- no accepted state;
- no proof/evidence/readiness record;
- no review decision;
- no accept/promote/reject action;
- no approval/merge/deploy/Core decision;
- no live Codex capture;
- no runtime fixture mutation;
- no surface export;
- no UI/routes/browser surface.

## What This Does Not Do

This does not validate returned material, integrate Codex SDK, capture live sessions, write DB records, persist state, create evidence/proof/readiness, make review decisions, export product surfaces, or modify capture helper behavior.

## Future Work

- Prepare execution hardening.
- Prepare-output snapshots for Session Panel and Inbox.
- Validate orchestration design.
- PASS/BLOCKED validate-summary modeling.

## Recommended Next PR

Harden local Codex adapter prepare execution.

## Conclusion

PASS with follow-up

Prepare execution is implemented as a local-only, helper-only, review-only, non-authorizing step from a reviewed dry-run summary to bounded helper output metadata.
