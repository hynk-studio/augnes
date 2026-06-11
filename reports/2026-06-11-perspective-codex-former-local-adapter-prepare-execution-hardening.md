# Perspective Codex Former Local Adapter Prepare Execution Hardening Report

## Summary

This PR hardens local Codex adapter prepare execution without expanding authority. The adapter still executes only the existing capture helper prepare path after a reviewed dry-run equivalence gate passes.

The hardened summary now separates attempted invocation from a helper process that actually ran, records a direct `execution_result`, adds bounded log normalization, and reports structured helper metadata checks.

## Why Follows PR #516

PR #516 implemented explicit `--execute` mode for prepare orchestration. It validated current inputs against a dry-run plan, ran the existing helper prepare command, discovered outputs, wrote a deterministic execution summary, and kept validate/Codex/provider/GitHub/network/DB/UI/clipboard/accepted-state/review-decision work out of scope.

This PR is the next hardening pass over that execution path.

## Hardening Scope

Changed scope is limited to lib, CLI script, smoke scripts, docs, report, success fixture, and package script registration.

The hardening covers:

- execution outcome semantics;
- helper invocation provenance;
- bounded log normalization and classification;
- helper output discovery diagnostics;
- pure-function failure and incomplete-discovery modeling;
- stale dry-run and equivalence rejection coverage;
- deterministic success fixture update.

## Execution Outcome Semantics

The execution summary now includes:

- `helper_invocation_attempted`;
- `helper_process_started`;
- `execution_result`;
- `failure_kind`;
- `helper_exit_status`;
- `helper_exit_code`;
- `output_discovery_status`.

Happy path semantics are now explicit: invocation attempted, process started, helper exited with `0`, discovery complete, `execution_result` `success`, `failure_kind` `null`, `prepare_helper_executed` true, and `validate_helper_executed` false.

Synthetic smoke coverage also verifies spawn failure, non-zero helper exit, and incomplete output discovery through pure functions rather than arbitrary command execution.

## Helper Invocation Provenance

`helper_invocation_attempted` means the adapter attempted to spawn the helper. `helper_process_started` means the child process started enough to report normal status or output. `prepare_helper_executed true` means the helper process actually ran.

Those fields are operational provenance only. They are not accepted state, validation, readiness, review decision, or authority.

## Bounded Log Normalization

Bounded stdout/stderr summaries now include:

- raw bounded `lines`;
- `normalized_lines`;
- `line_events`;
- `npm_wrapper_line_count`;
- `helper_kv_line_count`;
- truncation and omission counts.

Unsafe/private marker category lines are omitted from public log summaries and set `unsafe_marker_omitted` true. The deterministic fixture keeps wrapper output bounded and classified rather than treating it as semantic helper output.

## Output Discovery Hardening

Output discovery now reports structured metadata checks:

- metadata parse status;
- source input hash match;
- generated timestamp match;
- metadata prompt hash;
- prompt file SHA-256;
- prompt hash comparability.

The current helper metadata uses a compact prompt hash, so the success fixture records the metadata prompt hash and prompt file SHA-256 with `prompt_hash_match` set to `not_comparable`.

Smoke covers complete discovery, missing metadata, missing prompt, invalid metadata JSON, and source hash mismatch with synthetic local snapshots.

## Dry-Run Equivalence Hardening

Execution still reconstructs helper argv from current inputs and compares both the argv array and stable argv hash to the reviewed dry-run summary before the helper can run.

New hardening coverage rejects dry-run summaries with:

- `dry_run` false;
- helper exit status drift;
- execution readiness false;
- source input path drift;
- preflight summary path drift;
- manifest path drift;
- generated timestamp drift.

Existing execution smoke still covers stale out-dir, argv hash mismatch, source hash mismatch, preflight hash mismatch, expected hash mismatch, and output path safety.

## Summary Write and Failure Behavior

Happy-path summary writing happens after helper execution and output discovery.

When helper failure or incomplete output discovery is modeled, the summary result is still bounded and explicit. Helper outputs are preserved after execution. Summary paths inside the helper out-dir and path collisions reject before helper execution.

The summary-write-fails-after-helper-success edge is documented but not forced in smoke because doing so portably would require filesystem permission tricks. The CLI leaves helper outputs intact if summary writing fails.

## CLI and Mode Hardening

The existing CLI command remains unchanged:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input <path> --preflight-summary <path> --dry-run-summary <path> --out-dir <path>
```

Mode checks remain explicit: `--dry-run` and `--execute` cannot be combined, and one mode is required.

Hardening smoke verifies arbitrary command override, validate, network, provider/model, GitHub, and DB-style options reject as unknown options. It also verifies invalid `--bounded-log-lines` bounds reject, small log bounds change included line counts, and omitting `--prepare-execution-summary-out` runs without writing the deterministic summary path.

## Fixture Impact

The deterministic success fixture was updated:

`reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json`

It uses:

- `generated_at` `2026-06-11T00:00:00.000Z`;
- helper out-dir `/tmp/augnes-codex-former-local-adapter-prepare-execution`;
- committed source input, preflight summary, and manifest fixtures.

No helper output files were committed.

## Privacy/Redaction Handling

The execution summary remains bounded and public-review safe. It records hashes, sizes, refs, and paths, not raw prompt contents, raw source input contents, raw packet contents, or private marker values.

Docs, reports, and fixtures avoid echoing raw unsafe/private marker literals.

## Authority Boundary

This PR keeps no validate helper, no Codex call, no Codex SDK, no provider/model API, no GitHub API, no network, no DB, no persistence, no clipboard automation, no accepted state, no review decision, no surface export, and no UI/routes/browser surface.

Authority flags remain false for accepted state, proof/evidence/readiness creation, review decision creation, provider/model calls, Codex SDK calls, GitHub calls, network calls, DB writes, clipboard automation, live Codex capture, runtime fixture mutation, validate helper execution, surface export, and Core decisions.

## Verification

Verification commands run for this PR:

- PASS: `npm run typecheck`
- PASS: deterministic prepare dry-run to `/tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json`
- PASS: deterministic prepare execution to `/tmp/augnes-codex-former-local-adapter-prepare-execution-summary.json`
- PASS: generated execution summary matched the committed success fixture byte-for-byte
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-execution`
- PASS: `npm run smoke:perspective-codex-former-local-adapter-prepare-execution-hardening`
- PASS: `git diff --check`
- PASS: `git diff --cached --check`

The deterministic execution summary path was `/tmp/augnes-codex-former-local-adapter-prepare-execution-summary.json`.

## Skipped Checks With Reasons

Browser/computer-use validation is skipped because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

The summary-write-failure edge is documented but not forced in smoke because portable reproduction would rely on filesystem permission behavior rather than adapter logic.

`npm run smoke:perspective-codex-former-local-adapter-prepare-execution-design` was attempted and rejected solely on its design-only changed-file guard:

`prepare execution design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_HARDENING_V0_1.md`

That guard was not widened because this PR is an implementation hardening slice, not the original design-only PR.

## Recommended Next PR

Add prepare-output snapshots for Session Panel and Inbox states.

This path now has hardened local execution provenance; the next useful product-facing step is a read-only snapshot surface model for prepare outputs, still without acceptance or validation authority.

## What Codex Did Not Do

Codex did not call Codex, the Codex SDK, provider/model APIs, GitHub APIs, network services, databases, validate helper, clipboard automation, UI routes, browser surfaces, surface export, accepted-state creation, proof/evidence/readiness creation, review-decision creation, or Core decision paths.
