# Perspective Codex Former Local Adapter Prepare Dry-Run Hardening

## Summary

Hardened local Codex adapter prepare orchestration dry-run mode.

This PR adds stricter output path handling, an execution-readiness contract, helper command argv fingerprinting, helper availability checks, manifest consistency checks, deterministic fixture updates, and stronger smoke coverage.

Dry-run remains dry-run-only.

## Why Follows PR #513

PR #513 implemented dry-run-only local Codex adapter prepare orchestration. This PR hardens that dry-run path so it can be reviewed before any later execution-mode design.

## Hardening Scope

Changed scope remains CLI/lib/docs/report/fixture/smoke/package only.

This PR updates:

- `lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts`
- `scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-prepare-dry-run-hardening.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md`
- `reports/2026-06-11-perspective-codex-former-local-adapter-prepare-dry-run-hardening.md`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`
- `package.json`

## Output Path Hardening

Dry-run now rejects:

- prepare summary output inside helper out-dir;
- prepare summary output equal to helper out-dir;
- prepare summary output colliding with source input, preflight summary, or manifest path;
- helper out-dir existing as a file;
- helper out-dir existing as a non-empty directory.

Dry-run still allows absent helper out-dir and does not create it.

## Execution-Readiness Contract

The dry-run summary now includes `execution_readiness` with:

- `ready_for_prepare_execution`;
- `status`;
- `blockers`;
- `warnings`;
- `checked_requirements`.

The committed happy-path fixture has `ready_for_prepare_execution: true` and `status: ready`.

The readiness contract is for future execution review only. It is not permission to execute automatically.

## Command Argv Fingerprint

The dry-run summary now includes `helper_command_argv_hash`, computed from the stable JSON representation of the argv array.

The command remains an argv array and not a shell string.

## Helper Availability Checks

Dry-run checks local repo availability without execution:

- package script `perspective:codex-former:capture-packet` exists;
- `scripts/perspective-codex-former-capture-helper.mjs` exists;
- helper path is a file.

Missing helper availability fails dry-run before summary write.

## Manifest Consistency Checks

When manifest is supplied, dry-run requires:

- manifest `work_id` matches source input `work_id`;
- manifest `scope` matches source input `scope`;
- manifest `changed_files` match exactly;
- manifest `source_pr_refs` match exactly.

Manifest `generated_at` can differ from the CLI override because manifest hash is computed from the manifest bytes as supplied.

## Diagnostics

Diagnostics now use field-path labels for hardening failures such as:

- `prepare.out_dir must not be a non-empty directory`
- `prepare.prepare_summary_out must not be inside helper out-dir`
- `prepare.helper.package_script is missing`
- `prepare.manifest.work_id must match source_input.work_id`

Unsafe marker diagnostics preserve category and field path without echoing full unsafe values.

## Fixture Impact

Updated:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`

The fixture now includes:

- `execution_readiness`;
- `helper_command_argv_hash`.

It still records `helper_exit_status: not_run`, `dry_run: true`, null helper output paths/hashes, and all authority flags false.

## Verification

Passed:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-dry-run --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-summary-dry-run.json`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening`
- `git diff --check`
- `git diff --cached --check`

Attempted upstream smokes:

- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-design` failed only on its historical changed-file boundary: `prepare orchestration design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md`.
- `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots` failed only on its historical changed-file boundary: `local adapter surface snapshots changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_DRY_RUN_HARDENING_V0_1.md`.

Those older guards were not widened because this PR is a later dry-run hardening stage and does not change their implementation scope.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Prepare execution and validate orchestration runtime checks skipped because this PR remains dry-run-only.

## Recommended Next PR

Design local Codex adapter prepare orchestration execution mode.

## What Codex Did Not Do

Codex did not execute the existing capture helper prepare command, run validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surfaces, automate clipboard, implement prepare execution mode, implement validate orchestration, implement surface export, modify existing UI route/component behavior, modify capture helper behavior, or modify fixture JSON from PR #500, PR #501, PR #509, PR #510, or PR #511.
