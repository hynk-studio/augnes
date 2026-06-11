# Perspective Codex Former Local Adapter Prepare Dry-Run Hardening v0.1

## Purpose

This document defines the hardening stage for local Codex adapter prepare orchestration dry-run mode after PR #513.

The goal is to make dry-run robust enough for review before a later execution PR by adding stricter output path handling, an execution-readiness contract, command argv fingerprinting, helper availability checks, manifest consistency checks, clearer diagnostics, and updated deterministic fixtures.

Dry-run does not execute helper behavior. It adds no prepare helper execution, no validate helper execution, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no proof/evidence/readiness creation, no review decision, no UI/routes/browser surface, and no surface export.

## Why Follows PR #513

PR #513 implemented dry-run-only local Codex adapter prepare orchestration. That PR proved the local source-input and preflight summary can produce a bounded prepare command plan without running the existing capture helper.

This hardening PR adds execution-readiness detail and stronger path/manifest/fingerprint checks before any future execution design is considered.

## Hardening Scope

This is still dry-run-only.

The hardening adds:

- output path hardening;
- execution-readiness fields in the dry-run summary;
- helper command argv hash;
- helper package script and helper script presence checks;
- manifest-to-source-input consistency checks;
- clearer field-path diagnostics;
- stronger smoke rejection coverage;
- deterministic fixture update.

It does not change existing capture helper behavior or run the helper.

## Output Path Hardening

Dry-run now rejects:

- `--out-dir` if it exists as a file;
- `--out-dir` if it exists as a non-empty directory;
- `--prepare-summary-out` if it is equal to `--out-dir`;
- `--prepare-summary-out` if it is inside `--out-dir`;
- `--prepare-summary-out` if it collides with source input, preflight summary, or manifest path.

Dry-run allows `--out-dir` to be absent and does not create it. Dry-run may create the parent directory for `--prepare-summary-out` only when the summary path is outside the helper out-dir.

## Execution-Readiness Contract

The dry-run summary now includes:

```json
{
  "execution_readiness": {
    "ready_for_prepare_execution": true,
    "status": "ready",
    "blockers": [],
    "warnings": [
      "execution_readiness is for future execution review only, not permission to execute automatically."
    ],
    "checked_requirements": []
  }
}
```

The committed happy-path fixture is ready for future prepare execution review, not permission to execute automatically.

execution_readiness is not permission to execute automatically.

Checked requirements include:

- `source_input_valid`
- `source_input_hash_matches_preflight`
- `preflight_summary_valid`
- `preflight_status_passed`
- `helper_package_script_present`
- `helper_script_present`
- `helper_command_argv_constructed`
- `helper_out_dir_not_created_by_dry_run`
- `helper_out_dir_not_existing_file`
- `helper_out_dir_not_non_empty_directory`
- `prepare_summary_outside_helper_out_dir`
- `no_forbidden_authority_behavior`
- `no_helper_execution`

## Command Argv Fingerprint

The summary keeps `helper_command_argv` as an array and adds `helper_command_argv_hash`.

The hash is sha256 of the stable JSON representation of `helper_command_argv`. Changing `generated_at` changes the argv and therefore changes the hash.

The argv remains a plan only:

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

## Helper Availability Checks

Dry-run may inspect local repo files and `package.json`. It does not execute the helper.

It checks:

- `package.json` defines `perspective:codex-former:capture-packet`;
- `scripts/perspective-codex-former-capture-helper.mjs` exists;
- the helper script path is a file, not a directory.

Missing helper availability fails dry-run before writing a summary.

## Manifest Consistency Checks

When `--manifest` is supplied, dry-run now requires:

- manifest validates;
- manifest hash is computed from exact manifest bytes;
- manifest `work_id` equals source input `work_id`;
- manifest `scope` equals source input `scope`;
- manifest `changed_files` match source input `changed_files` exactly and in sequence;
- manifest `source_pr_refs` match source input `source_pr_refs` exactly and in sequence.

The manifest `generated_at` may differ from `--generated-at`; this does not change `manifest_hash` because that hash is always computed from the original manifest bytes.

Dry-run does not read optional helper, returned-envelope, or validation paths from the manifest.

## Diagnostics

Diagnostics use stable field-path style messages, for example:

- `prepare.source_input_path file does not exist`
- `prepare.preflight_summary.status must be passed`
- `prepare.preflight_summary.source_input_hash does not match source input bytes`
- `prepare.out_dir must not be an existing file`
- `prepare.out_dir must not be a non-empty directory`
- `prepare.prepare_summary_out must not be inside helper out-dir`
- `prepare.helper.package_script is missing`
- `prepare.helper.script_path is missing`

Unsafe marker diagnostics report category and path without echoing full unsafe values.

## Fixture Impact

The deterministic dry-run fixture is updated:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`

The fixture now includes `execution_readiness` and `helper_command_argv_hash`.

It still keeps:

- `dry_run: true`
- `helper_exit_status: not_run`
- null helper output paths;
- null helper output hashes;
- all authority flags false.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-dry-run --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-summary-dry-run.json
```

The command writes only the requested dry-run summary and never writes helper outputs.

## Path Handling

Source input, preflight summary, and manifest paths must be files, not directories.

The prepare summary output path must be distinct from source input, preflight summary, and manifest paths. It must not be equal to or nested inside the helper out-dir.

## generated_at / Hash Behavior

`--generated-at` controls the dry-run summary timestamp and constructed helper argv timestamp.

`source_input_hash` hashes exact source input bytes. `manifest_hash` hashes exact manifest bytes. `helper_command_argv_hash` hashes stable JSON bytes for the command argv array.

## Privacy / Redaction Boundary

Dry-run records paths, hashes, statuses, readiness checks, caveats, and bounded command summary only.

It records no raw diffs, raw logs, raw transcripts, raw candidate payloads, provider logs, credentials, account data, browser dumps, screenshots, or hidden reasoning.

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

## What This Does Not Do

This hardening does not execute the existing capture helper prepare command. It does not run validate helper, produce manual copy packets, produce prompts, produce helper metadata, create PASS/BLOCKED state, export surface snapshots, or create accepted Augnes state.

It does not modify capture helper behavior, UI route/component behavior, DB schema, provider/model integration, Codex SDK integration, or GitHub mutation code.

## Future Work

- Prepare orchestration execution design
- Prepare orchestration execution implementation after design
- Prepare-output snapshots
- Validate orchestration design

## Recommended Next PR

Design local Codex adapter prepare orchestration execution mode.

## Conclusion

PASS with follow-up

Dry-run is hardened with execution-readiness and command fingerprinting. Actual prepare execution remains out of scope and requires a separate design PR.
