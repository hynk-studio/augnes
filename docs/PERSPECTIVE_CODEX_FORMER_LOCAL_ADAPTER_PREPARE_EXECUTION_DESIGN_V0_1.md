# Perspective Codex Former Local Adapter Prepare Execution Design v0.1

## Purpose

This document defines future local Codex adapter prepare orchestration execution mode.

This PR is design-only. It adds no prepare execution implementation, no execution CLI behavior, no validate orchestration, no surface export, no UI, no route, no runtime browser surface, no Codex call, no Codex SDK call, no provider/model API call, no GitHub API call, no network call, no DB write, no persistence, no clipboard automation, no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no approval/merge/deploy/Core decision, no live Codex capture, no runtime fixture mutation, and no capture helper behavior modification.

Future prepare execution means one local operation: run the existing local capture helper prepare path and summarize its local outputs. It does not mean running Codex, validating answers, accepting memory, promoting material, or making a product decision.

## Why Follows PR #514

PR #514 hardened prepare dry-run with:

- `execution_readiness`;
- helper command argv hash;
- helper availability checks;
- manifest consistency checks;
- output path hardening;
- stronger rejection coverage.

This design follows because dry-run can now state what would be executed and whether local inputs are ready for human review before execution. Execution design can therefore be defined as a strict equivalence step from a reviewed dry-run summary to one helper-only local prepare run.

## Product Thesis

Prepare execution mode should make one local, review-only operation safe and legible: running the existing capture helper prepare path against a preflighted source input and recording bounded local output metadata.

It should:

- require a passed dry-run summary from the same inputs;
- verify dry-run summary hash and command argv hash;
- execute only the existing capture helper prepare command;
- write a bounded execution summary;
- discover helper output paths;
- compute hashes for helper outputs;
- move future Session Panel / Inbox snapshots from waiting to prepared / waiting-for-Codex-return;
- not call Codex;
- not validate returned material;
- not create accepted state;
- not create review decisions.

## Relationship To Existing Modes

Manifest-to-source-input mode produces source input.

Source-input preflight validates source input.

Surface snapshots show not_ready / waiting.

Prepare dry-run validates readiness and constructs command argv.

Prepare execution mode would run that exact reviewed command.

Validate orchestration remains separate future work. Prepare-output snapshots remain separate future work or a follow-up implementation. Surface integration remains separate future work. The review decision layer remains separate future work.

This design builds on:

- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DESIGN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md`
- `scripts/perspective-codex-former-capture-helper.mjs`

## Execution Prerequisites

Required future inputs:

- source input path;
- preflight summary path;
- prepare dry-run summary path;
- prepare out-dir;
- generated_at, or source input generated_at fallback.

Optional future inputs:

- manifest path;
- expected source_input_hash;
- expected_helper_command_argv_hash;
- prepare execution summary output path.

Future execution must require:

- source input validates;
- preflight summary validates;
- preflight status is passed;
- preflight summary `source_input_hash` matches source input bytes;
- dry-run summary validates;
- dry-run summary mode is `prepare-orchestration-dry-run`;
- dry-run summary `dry_run` is true;
- dry-run summary `helper_exit_status` is `not_run`;
- dry-run summary `execution_readiness.status` is `ready`;
- dry-run summary `ready_for_prepare_execution` is true;
- dry-run summary `helper_command_argv_hash` matches recomputed command argv hash;
- dry-run summary `source_input_hash` matches source input bytes;
- dry-run summary preflight path matches supplied preflight path under the future path equivalence policy;
- dry-run summary helper out-dir matches requested out-dir;
- manifest consistency passes when manifest is supplied;
- helper package script exists;
- helper script exists and is a file;
- prepare out-dir is absent or empty according to policy;
- prepare execution summary output path is outside prepare out-dir.

## Execution Stages

### Stage A. Load And Verify Inputs

Future execution should read source input, preflight summary, dry-run summary, and optional manifest files.

It should compute exact byte hashes, validate all local contracts, and verify that the dry-run summary still matches the current source input, preflight summary, manifest, generated_at, and out-dir.

If validation fails, no output directory should be created and the helper must not run.

### Stage B. Reconstruct Command Argv

Future execution should reconstruct expected helper argv from current inputs:

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

It should compare the reconstructed argv array to dry-run summary `helper_command_argv`, stable-stringify the argv, compute sha256, and compare to dry-run summary `helper_command_argv_hash`.

It must reject mismatches and must not accept a caller-supplied arbitrary command.

### Stage C. Prepare Output Directory Reservation

Future execution should require an explicit local out-dir.

It should reject file paths and non-empty directories. It should create the output directory only immediately before execution. If directory creation fails, it should abort before running the helper.

Successful helper output should not be cleaned up by default.

### Stage D. Execute Existing Helper Prepare Command

Future implementation may use execFile-style invocation.

Command kind must be `existing_capture_helper_prepare`.

The only command allowed is:

```bash
npm run perspective:codex-former:capture-packet -- --out-dir <out-dir> --source-input <source-input-path> --generated-at <generated_at>
```

The implementation should capture exit code and bounded stdout/stderr summaries only.

It must not call Codex, call provider/model APIs, call GitHub APIs, call network, run validate helper, or use clipboard automation.

### Stage E. Discover Helper Outputs

The future adapter should inspect the helper output directory after execution.

The existing helper currently writes:

- `codex-former-copyable-prompt.txt`;
- `codex-former-capture-return-envelope-template.txt`;
- `codex-former-capture-metadata.json`.

The adapter should prefer reading helper metadata first because metadata records stable output paths, source input hash, prompt hash, source manual copy packet id, source former input packet id, and authority boundary.

Discovery should identify:

- manual copy packet reference or source manual copy packet id;
- former input packet reference or source former input packet id;
- copyable prompt path and prompt hash;
- return envelope template path;
- helper metadata path;
- any helper report if present.

It should compute file hashes and file sizes. If helper exits successfully but required outputs are missing or metadata is incomplete, execution summary status should be failed or incomplete.

The adapter must not parse raw packet contents except bounded metadata needed for paths, hashes, sizes, and provenance checks. It must not alter helper outputs.

### Stage F. Write Adapter Prepare Execution Summary

Future execution should write deterministic JSON outside helper out-dir when a summary path is supplied.

The summary should include command argv/hash, helper exit status, bounded output paths/hashes/sizes, caveats, next safe action, a copied execution readiness snapshot from dry-run, and authority flags.

If the helper fails, the implementation may write a bounded failure summary when safe. The summary must not include raw packet contents.

### Stage G. Optional Future Snapshot Handoff

Prepare execution may enable future prepared / waiting-for-Codex-return snapshots.

This should not be implemented in the first execution PR unless explicitly scoped.

There is no Constellation handoff, no PASS/BLOCKED state, and no accepted state.

## Execution Summary Contract

Future execution summary version:

```text
codex_former_local_adapter_prepare_execution_summary.v0.1
```

Mode:

```text
prepare-orchestration-execution
```

Required fields:

- `generated_at`
- `dry_run_summary_path`
- `dry_run_summary_hash`
- `source_input_path`
- `source_input_hash`
- `preflight_summary_path`
- `preflight_summary_hash`
- `manifest_path`
- `manifest_hash`
- `helper_out_dir`
- `helper_command_kind: existing_capture_helper_prepare`
- `helper_command_argv`
- `helper_command_argv_hash`
- `helper_exit_status: success | failed`
- `helper_exit_code: number | null`
- `helper_stdout_summary`
- `helper_stderr_summary`
- `helper_output_paths`
- `helper_output_hashes`
- `helper_output_sizes`
- `output_discovery_status: complete | incomplete | not_run`
- `next_safe_action`
- `caveats`
- `execution_readiness_snapshot`
- `authority_flags`

`helper_output_paths` should include:

- `manual_copy_packet_path` when available from metadata, otherwise null;
- `former_input_packet_path` when available from metadata, otherwise null;
- `prompt_path`;
- `return_envelope_template_path`;
- `helper_metadata_path`.

`helper_output_hashes` should include:

- `manual_copy_packet_hash` when a file path exists;
- `former_input_packet_hash` when a file path exists;
- `prompt_hash`;
- `return_envelope_template_hash`;
- `helper_metadata_hash`.

Authority flags:

- `accepted_state_created: false`
- `proof_evidence_readiness_created: false`
- `review_decision_created: false`
- `provider_model_calls: false`
- `codex_sdk_calls: false`
- `github_api_calls: false`
- `network_calls: false`
- `db_writes: false`
- `clipboard_automation: false`
- `live_codex_capture: false`
- `runtime_fixture_mutation: false`
- `prepare_helper_executed: true` only if helper actually ran
- `validate_helper_executed: false`
- `surface_export_created: false`
- `core_decision: false`

Future prepare execution may set `prepare_helper_executed` true in execution summary only to truthfully record that the helper ran. This is operational provenance, not authority, not acceptance, and not validation. It must be visually and semantically separate from authority or decision flags.

## Dry-Run To Execution Equivalence

Future implementation must prove execution command equals the reviewed dry-run command:

- recompute helper command argv from source input, out-dir, and generated_at;
- stable-stringify argv;
- compute sha256;
- compare to dry-run summary `helper_command_argv_hash`;
- compare argv array exactly;
- reject if mismatch;
- reject if dry-run summary is stale relative to source input or preflight hashes;
- reject if generated_at mismatch is not explicitly provided and documented.

The execution path must not accept arbitrary command overrides.

## Output Discovery Policy

Required helper outputs for success:

- helper metadata file;
- copyable prompt file;
- return envelope template file;
- source prompt hash in metadata;
- source manual copy packet id or equivalent bounded metadata;
- source former input packet id or equivalent bounded metadata.

The adapter should read helper metadata first. Known filenames are fallback only:

- `codex-former-copyable-prompt.txt`
- `codex-former-capture-return-envelope-template.txt`
- `codex-former-capture-metadata.json`

Missing metadata should be a failure or strong caveat. Missing prompt or return template after helper success should mark `output_discovery_status` as `incomplete`.

## Failure Handling And Cleanup Policy

If input validation fails, there should be no output directory creation, no execution, and no summary except optional safe failure summary if explicitly requested.

If output directory creation fails, there should be no execution.

If helper exits non-zero, future execution should write a bounded failure summary if safe, preserve helper out-dir for operator inspection, and avoid automatic deletion by default.

If helper exits zero but outputs are missing, execution summary status should be failed or incomplete, files should be preserved, and no accepted state should be implied.

If summary write fails after helper success, the implementation should report failure and preserve helper output.

There should be no automatic retry. There should be no cleanup that deletes helper evidence unless a later PR explicitly scopes cleanup.

## Logging And Redaction Policy

Future execution should capture bounded stdout/stderr summaries.

It should cap length, redact unsafe marker categories, and avoid raw packet contents, raw source input dumps, or raw prompt dumps in public reports.

Summary may include first N safe helper key/value output lines or structured helper key/value output. If output exceeds bounds, record truncation count and an omitted flag.

Future smoke should verify no raw unsafe/private markers appear in public docs, reports, fixtures, or summaries.

## CLI Design

Future CLI command, design-only:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input <path> --preflight-summary <path> --dry-run-summary <path> --out-dir <path> --generated-at <iso> --prepare-execution-summary-out <path>
```

Required:

- `--execute`
- `--source-input`
- `--preflight-summary`
- `--dry-run-summary`
- `--out-dir`

Optional:

- `--manifest`
- `--generated-at`
- `--expected-source-input-hash`
- `--expected-helper-command-argv-hash`
- `--prepare-execution-summary-out`
- `--allow-existing-empty-out-dir`
- `--bounded-log-lines <n>`

`--execute` and `--dry-run` must not be allowed together. Do not allow implicit execution when neither is supplied. Do not let `--execute` call validate helper. Do not allow arbitrary command override. Do not allow network/provider/GitHub/DB flags.

## State Mapping To Surfaces

Dry-run ready, execution not run:

- Session Panel: prepare ready / waiting
- Inbox: waiting
- Constellation: no handoff

Prepare execution success:

- Session Panel: prepared, waiting for separate Codex return
- Inbox: waiting
- Constellation: no handoff
- Safe next action: use manual copy packet in separate user-started Codex session

Prepare execution failed:

- Session Panel: prepare failed / local caveat
- Inbox: not_ready or invalid_data depending on failure
- Constellation: no handoff

Prepare execution incomplete outputs:

- Session Panel: prepare incomplete
- Inbox: invalid_data or not_ready
- Constellation: no handoff

Returned candidate present is out of scope and belongs to validate orchestration design.

Validation PASS/BLOCKED is out of scope for prepare execution.

## Verification Strategy

Future implementation should verify:

- `npm run typecheck`;
- dry-run command;
- execute command against committed adapter source input fixture and temp out-dir;
- smoke for execution summary;
- helper output files exist;
- helper output hashes match exact file bytes;
- no validate helper execution;
- no Codex/SDK/provider/GitHub/network/DB calls;
- no accepted state or review decision;
- no clipboard automation;
- output discovery behavior;
- synthetic failure cases for invalid inputs and output paths;
- `git diff --check`;
- `git diff --cached --check`.

For this design-only PR, only typecheck, design smoke, and diff checks are required.

## Browser/Computer-Use Validation Plan

This PR is design-only and adds no UI, so browser validation should be skipped.

Future prepare execution implementation may be CLI-only and may skip browser validation if it does not touch UI/routes/browser-visible surfaces.

If future implementation updates Session Panel / Inbox / Constellation UI or writes UI-consumed snapshots, targeted browser validation should be considered.

## Privacy/Redaction Handling

Use paths and hashes over raw content.

Use bounded stdout/stderr.

Do not include raw diffs, raw logs beyond bounded summaries, raw transcripts, raw candidate payloads, provider logs, credentials, tokens, cookies, private account data, screenshots, or browser dumps.

Public docs/reports must not echo raw unsafe/private marker literals.

## Authority Boundary

The design preserves:

- no Codex call;
- no Codex SDK;
- no provider/model API;
- no GitHub API;
- no network;
- no DB write;
- no persistence;
- no clipboard automation;
- no accepted Augnes state;
- no proof/evidence/readiness creation;
- no review decision records;
- no accept/promote/reject actions;
- no approval/merge/deploy/Core decision;
- no live Codex capture;
- no validate orchestration;
- no surface export in this design PR;
- no UI implementation in this PR;
- no capture helper behavior modification.

Future prepare execution may set `prepare_helper_executed` true in execution summary only to truthfully record that helper ran. This is operational provenance, not authority, not acceptance, and not validation.

## Future Implementation Sequence

Recommended sequence:

- Add local Codex adapter prepare orchestration execution implementation.
- Add prepare-output snapshots for Session Panel and Inbox states.
- Design validate orchestration mode.
- Add validate-summary modeling for PASS/BLOCKED snapshots.
- Only later consider live Codex SDK / provider / GitHub / persistence integration with explicit authority gates.

## Recommended Next PR

Add local Codex adapter prepare orchestration execution implementation.

## Conclusion

PASS with follow-up

Execution mode is designed. No execution was implemented. Execution should be local-only, helper-only, review-only, bounded, and non-authorizing. Validate orchestration and accepted-state automation remain out of scope.
