# Perspective Codex Former Local Adapter Prepare Orchestration Dry-Run v0.1

## Purpose

This document defines the first implementation of local Codex adapter prepare orchestration: dry-run mode only.

The dry-run validates adapter source input and source-input preflight summary material, verifies hashes, validates the prepare output directory path shape, constructs the existing capture helper prepare command as an argv summary, and optionally writes a deterministic local prepare summary JSON.

Dry-run does not execute helper behavior. It adds no prepare helper execution, no validate helper execution, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no proof/evidence/readiness creation, no review decision, no UI/routes/browser surface, and no surface export.

## Why Follows PR #512

PR #512 designed local Codex adapter prepare orchestration mode and recommended dry-run before execution.

This implementation follows that design by adding only the safe local planning step. It proves what command would be used for the existing capture helper prepare path without invoking the helper.

## Dry-Run Scope

Dry-run mode:

- requires `--dry-run`;
- reads source input JSON;
- validates source input with `validateCodexFormerLocalAdapterSourceInput`;
- reads and validates a source-input preflight summary;
- verifies `source_input_hash` against exact source input bytes;
- optionally validates a manifest and records its hash;
- validates that `--out-dir` is not an existing file;
- builds an execFile-style argv summary for the existing capture helper prepare command;
- optionally writes a deterministic prepare summary JSON.

Dry-run mode does not create prepare helper outputs and does not create the prepare out-dir.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-dry-run --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-summary-dry-run.json
```

If `--dry-run` is absent, the CLI rejects with:

```text
prepare orchestration currently supports --dry-run only
```

## Required Inputs

Required CLI inputs:

- `--dry-run`
- `--source-input <path>`
- `--preflight-summary <path>`
- `--out-dir <path>`

The source input and preflight summary paths must point to existing JSON files. The out-dir is validated as a future helper output directory path but is not created by dry-run.

## Optional Inputs

Optional CLI inputs:

- `--generated-at <iso>`
- `--prepare-summary-out <path>`
- `--manifest <path>`
- `--expected-source-input-hash <sha256>`

When `--manifest` is supplied, the manifest is validated and hashed for provenance. Optional helper, returned-envelope, or validation paths in the manifest are not read.

## Input Validation

Dry-run validates:

- source input JSON parses as an object;
- source input matches the local adapter source-input preflight contract;
- source input contains no unsafe/private/provider/credential marker-like material;
- preflight summary version is `codex_former_local_adapter_source_input_preflight_summary.v0.1`;
- preflight summary mode is `source-input-preflight`;
- preflight summary status is `passed`;
- preflight summary `source_input_hash` matches exact source input bytes;
- preflight summary contains no unsafe marker-like material;
- optional expected source input hash matches exact source input bytes;
- optional manifest parses, validates, hashes, and contains no unsafe marker-like material.

Invalid material is reported with field-path/category diagnostics without printing raw unsafe values.

## Constructed Helper Command

Dry-run constructs this command as an argv array:

```json
[
  "npm",
  "run",
  "perspective:codex-former:capture-packet",
  "--",
  "--out-dir",
  "<out-dir>",
  "--source-input",
  "<source-input-path>",
  "--generated-at",
  "<generated-at>"
]
```

The command is not executed. The argv form is intended for a future execFile-style implementation and avoids shell interpolation.

## Prepare Dry-Run Summary Contract

The prepare summary is versioned:

```text
codex_former_local_adapter_prepare_summary.v0.1
```

The summary uses mode:

```text
prepare-orchestration-dry-run
```

The summary includes:

- `generated_at`
- `dry_run: true`
- `source_input_path`
- `source_input_hash`
- `preflight_summary_path`
- `preflight_status: passed`
- `manifest_path`
- `manifest_hash`
- `helper_out_dir`
- `helper_exit_status: not_run`
- `helper_command_kind: existing_capture_helper_prepare`
- `helper_command_argv`
- `helper_command_summary`
- null helper output paths and hashes
- next safe action
- caveats
- false authority flags

The summary is deterministic, two-space pretty JSON with a trailing newline.

## Deterministic Fixture

This PR adds:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`

The fixture is generated from:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json`
- generated_at `2026-06-11T00:00:00.000Z`
- helper out-dir `/tmp/augnes-codex-former-local-adapter-prepare-dry-run`

The fixture shows `helper_exit_status: not_run`, null helper output paths/hashes, and all authority flags false.

## Path Handling

Dry-run rejects:

- missing option values;
- unknown options;
- duplicate options;
- values supplied to `--dry-run`;
- unexpected positional arguments;
- `--out-dir` pointing to an existing file;
- `--prepare-summary-out` pointing to a directory;
- `--prepare-summary-out` colliding with source input or preflight summary path.

Dry-run may create the parent directory for `--prepare-summary-out`. It does not create the prepare out-dir and does not write helper output files.

## generated_at / Hash Behavior

If `--generated-at` is supplied, the prepare summary and constructed helper command use that timestamp.

If `--generated-at` is omitted, dry-run uses the source input `generated_at`.

`source_input_hash` is computed from exact source input bytes. The preflight summary hash and optional expected hash must match those bytes. Optional manifest hash is computed from exact manifest bytes.

## Privacy / Redaction Boundary

Dry-run records paths, hashes, statuses, and bounded command summary only.

It includes no raw diffs, raw logs, raw transcripts, raw candidate payloads, provider logs, credentials, account data, browser dumps, screenshots, or hidden reasoning.

Public docs/reports/fixtures must not echo raw unsafe/private marker literals.

## Authority Boundary

This implementation preserves:

- no prepare helper execution;
- no validate helper execution;
- no Codex call;
- no Codex SDK;
- no provider/model API;
- no GitHub API;
- no network;
- no DB;
- no persistence;
- no clipboard automation;
- no accepted state;
- no proof/evidence/readiness creation;
- no review decision;
- no accept/promote/reject action;
- no approval/merge/deploy/Core decision;
- no live Codex capture;
- no runtime fixture mutation;
- no UI/routes/browser surface;
- no surface export.

All summary authority flags are false, including `prepare_helper_executed` and `validate_helper_executed`.

## What This Does Not Do

This dry-run does not run the existing capture helper. It does not produce manual copy packets, former input packets, prompts, return envelope templates, helper metadata, PASS/BLOCKED states, review decisions, accepted state, or Constellation Preview handoff material.

It does not modify existing capture helper behavior, local adapter manifest-to-source-input behavior, source-input preflight behavior, surface snapshots, UI routes, components, or prior fixture JSON.

## Future Work

- Prepare orchestration execution implementation
- Prepare-output snapshots for Session Panel and Inbox states
- Validate orchestration design
- PASS/BLOCKED validate-summary modeling

## Recommended Next PR

Harden local Codex adapter prepare orchestration dry-run.

## Conclusion

PASS with follow-up

The dry-run prepare orchestration path is implemented as local-only planning and validation. Helper execution, validate orchestration, surface export, live integration, and accepted-state automation remain out of scope.
