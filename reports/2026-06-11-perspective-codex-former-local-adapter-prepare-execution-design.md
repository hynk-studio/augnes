# Perspective Codex Former Local Adapter Prepare Execution Design

## Summary

This PR adds a design-only contract for future local Codex adapter prepare orchestration execution mode.

Execution mode is defined as one local, helper-only operation: run the existing Codex Former capture helper prepare path against a preflighted source input, then summarize bounded local outputs. It does not call Codex, validate returned material, create accepted Augnes state, create review decisions, or mutate product/runtime state.

## Why Follows PR #514

PR #514 hardened prepare dry-run with execution readiness, helper command argv fingerprinting, helper availability checks, manifest consistency checks, output path hardening, and stronger rejection coverage.

This design follows because a future execution mode should execute only the reviewed dry-run command after proving the current inputs still match that dry-run summary.

## Design Scope

The scope is docs/report/smoke/package only.

The design covers:

- execution prerequisites;
- dry-run to execution equivalence;
- command invocation;
- output directory reservation;
- helper output discovery;
- execution summary schema;
- failure handling and cleanup policy;
- logging and redaction policy;
- state mapping to Session Panel and Capture Review Inbox concepts;
- verification strategy for a later implementation.

This PR does not implement prepare execution or add execution CLI behavior.

## Product Thesis

Prepare execution mode should make one local, review-only operation safe and legible: running the existing capture helper prepare path against a preflighted source input and recording bounded local output metadata.

It should require a passed dry-run summary from the same inputs, verify the command argv hash, execute only the existing helper prepare command, write a bounded execution summary, discover helper output paths, compute hashes for helper outputs, and keep all authority and review decisions out of scope.

## Relationship to Existing Modes

Manifest-to-source-input mode produces helper-compatible source input.

Source-input preflight validates that source input locally.

Surface snapshots show not_ready and waiting states.

Prepare dry-run validates execution readiness and constructs the helper command argv.

Prepare execution mode would run that exact reviewed command. Validate orchestration, prepare-output snapshots, surface integration, and review decisions remain separate future work.

## Execution Prerequisites

Future execution should require:

- source input path;
- preflight summary path;
- prepare dry-run summary path;
- prepare out-dir;
- generated_at or source input generated_at fallback.

Optional inputs may include:

- manifest path;
- expected source input hash;
- expected helper command argv hash;
- prepare execution summary output path.

Required checks include source input validation, passed preflight status, matching source input hashes, valid dry-run summary, `helper_exit_status` still `not_run`, ready execution readiness, matching helper command argv hash, matching helper out-dir, helper script availability, and safe output path policy.

## Execution Stages

Stage A loads and verifies source input, preflight summary, dry-run summary, and optional manifest. It computes exact byte hashes and rejects stale or mismatched inputs before creating any output directory.

Stage B reconstructs the expected helper command argv, compares it to the dry-run summary argv, recomputes the argv hash, and rejects any mismatch or arbitrary command override.

Stage C reserves the prepare output directory. It rejects file paths and non-empty directories, creates the directory only immediately before execution, and does not clean up successful helper outputs by default.

Stage D executes only the existing helper prepare command with an execFile-style argv contract. It captures exit code and bounded stdout/stderr summaries. It does not call Codex, provider/model APIs, GitHub APIs, network, validate helper, or clipboard automation.

Stage E discovers helper outputs by preferring helper metadata first and falling back to known helper filenames only if metadata is absent. It records paths, hashes, and sizes without parsing raw packet content.

Stage F writes a deterministic adapter prepare execution summary outside the helper out-dir when requested. Failure summaries may be written only when safe and bounded.

Stage G allows optional future prepared/waiting-for-Codex-return snapshot handoff, but that handoff is not part of this design PR or the first execution implementation unless explicitly scoped.

## Execution Summary Contract

The future summary version is `codex_former_local_adapter_prepare_execution_summary.v0.1`.

The future mode is `prepare-orchestration-execution`.

Required fields include:

- generated_at;
- dry_run_summary_path and dry_run_summary_hash;
- source_input_path and source_input_hash;
- preflight_summary_path and preflight_summary_hash;
- optional manifest path and hash;
- helper_out_dir;
- helper_command_kind;
- helper_command_argv and helper_command_argv_hash;
- helper_exit_status and helper_exit_code;
- bounded stdout/stderr summaries;
- helper output paths, hashes, and sizes;
- output_discovery_status;
- next_safe_action;
- caveats;
- execution_readiness_snapshot copied from dry-run;
- authority flags.

The design allows `prepare_helper_executed` to be true in a future execution summary only when the helper actually ran. That is operational provenance, not acceptance, not validation, and not authority.

## Dry-Run to Execution Equivalence

Future execution must recompute helper command argv from current source input, out-dir, and generated_at. It must stable-stringify the argv, hash it, and compare both argv and hash with the reviewed dry-run summary.

Execution must reject stale dry-run summaries, source input hash mismatches, preflight hash mismatches, out-dir mismatches, generated_at mismatches unless explicitly supplied and documented, and caller-supplied arbitrary command overrides.

## Output Discovery Policy

The existing helper currently writes:

- `codex-former-copyable-prompt.txt`;
- `codex-former-capture-return-envelope-template.txt`;
- `codex-former-capture-metadata.json`.

The future adapter should read helper metadata first because it records stable output paths, source input hash, prompt hash, packet ids, and authority boundary.

Successful discovery should identify the manual copy packet reference or packet id, former input packet reference or packet id, prompt path/hash, return envelope template path, helper metadata path, and any helper report if present. Missing required outputs after a zero exit should be incomplete or failed, not accepted.

## Failure Handling and Cleanup Policy

If input validation fails, future execution should create no output directory, run no helper, and write no summary unless a safe failure summary was explicitly requested.

If output directory creation fails, execution should abort before running the helper.

If the helper exits non-zero, the adapter may write a bounded failure summary and should preserve the helper output directory for operator inspection.

If the helper exits zero but outputs are missing, the execution summary should record failed or incomplete output discovery and preserve files.

If summary writing fails after helper success, the helper output should remain intact.

There should be no automatic retry and no automatic deletion of helper output evidence unless a later PR explicitly scopes cleanup.

## Logging and Redaction Policy

Future execution should capture bounded stdout/stderr summaries only.

It should cap length, redact unsafe markers, avoid raw packet contents, avoid raw source input dumps, avoid raw prompt dumps in public reports, record truncation when needed, and prefer structured helper key/value output where available.

## CLI Design

Future CLI, design-only:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input <path> --preflight-summary <path> --dry-run-summary <path> --out-dir <path> --generated-at <iso> --prepare-execution-summary-out <path>
```

Required options should include `--execute`, `--source-input`, `--preflight-summary`, `--dry-run-summary`, and `--out-dir`.

Optional options may include `--manifest`, `--generated-at`, `--expected-source-input-hash`, `--expected-helper-command-argv-hash`, `--prepare-execution-summary-out`, `--allow-existing-empty-out-dir`, and `--bounded-log-lines`.

The design requires that `--execute` and `--dry-run` must not be allowed together. Execution must not be implicit when neither is supplied. The adapter must not allow arbitrary command override or network/provider/GitHub/DB flags.

## State Mapping to Surfaces

Dry-run ready, execution not run maps to Session Panel prepare ready / waiting and Inbox waiting. Constellation has no handoff.

Prepare execution success maps to Session Panel prepared / waiting for separate Codex return and Inbox waiting. Constellation still has no handoff.

Prepare execution failure maps to Session Panel prepare failed / local caveat and Inbox not_ready or invalid_data depending on failure cause.

Incomplete helper outputs map to Session Panel prepare incomplete and Inbox invalid_data or not_ready.

Returned candidate and validation PASS/BLOCKED remain out of scope for prepare execution.

## Verification Strategy

A future implementation should run typecheck, dry-run, execution against committed adapter source input fixtures and a temp out-dir, execution summary smoke, helper output existence checks, output hash checks, negative cases, and diff checks.

It should verify no validate helper execution, no Codex/SDK/provider/GitHub/network/DB calls, no accepted state, no review decision, no clipboard automation, and complete output discovery.

This PR requires only the design smoke.

## Browser/Computer-Use Validation Plan

Browser/computer-use validation is skipped for this design-only PR because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Future prepare execution implementation may remain CLI-only and may skip browser validation if it does not touch UI/routes/browser-visible surfaces. If future work updates Session Panel, Inbox, Constellation UI, or UI-consumed snapshots, targeted browser validation should be considered.

## Privacy/Redaction Handling

The design prefers paths and hashes over raw content.

It forbids raw diffs, raw logs beyond bounded summaries, raw transcripts, raw candidate payloads, provider logs, credentials, tokens, cookies, private account data, screenshots, and browser dumps in public docs/reports.

Public docs/reports must not echo raw unsafe/private marker literals.

## Authority Boundary

The design preserves no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB write, no persistence, no clipboard automation, no accepted Augnes state, no proof/evidence/readiness creation, no review decision records, no accept/promote/reject actions, no approval/merge/deploy/Core decision, no live Codex capture, no validate orchestration, no surface export in this design PR, no UI implementation, and no capture helper behavior modification.

Future `prepare_helper_executed` truthfully records local helper execution only. It is operational provenance, not authority, not acceptance, and not validation.

## Verification

Passed:

- `npm run typecheck`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-execution-design`
- `git diff --check`
- `git diff --cached --check`

Attempted upstream smokes:

- `npm run smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening` ran its rejection coverage and then failed only on its historical changed-file boundary: `prepare dry-run hardening changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_DESIGN_V0_1.md`.
- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run` ran its rejection coverage and then failed only on its historical changed-file boundary: `prepare orchestration dry-run changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_DESIGN_V0_1.md`.

## Skipped Checks With Reasons

Browser/computer-use validation is skipped because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

No prepare execution check is run because this PR is design-only and adds no execution implementation.

No validate helper, Codex, provider/model, GitHub, network, DB, or clipboard check is run because those surfaces are explicitly out of scope and not introduced.

## Recommended Next PR

Add local Codex adapter prepare orchestration execution implementation.

## What Codex Did Not Do

Codex did not implement prepare execution, add execution CLI behavior, run the prepare helper from normal adapter code, run validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve/merge/deploy/make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surfaces, automate clipboard, implement validate orchestration, implement surface export, modify UI behavior, modify capture helper behavior, or modify existing fixture JSON.
