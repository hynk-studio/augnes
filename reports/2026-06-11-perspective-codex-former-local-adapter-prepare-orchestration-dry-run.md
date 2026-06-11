# Perspective Codex Former Local Adapter Prepare Orchestration Dry-Run

## Summary

Implemented local Codex adapter prepare orchestration dry-run mode.

Dry-run validates source input and preflight summary material, verifies hashes, validates future prepare out-dir path shape, constructs the existing capture helper prepare argv summary, and writes deterministic prepare summary JSON when requested.

The dry-run does not execute the prepare helper.

## Why Follows PR #512

PR #512 designed local Codex adapter prepare orchestration mode and recommended dry-run before execution.

This PR implements only that dry-run planning step after the manifest-to-source-input, source-input preflight, and surface snapshot states already exist.

## Implementation Scope

Changed scope is CLI/lib/docs/report/fixture/smoke/package only.

Added:

- `lib/perspective-ingest/codex-former-local-adapter-prepare-orchestration.ts`
- `scripts/perspective-codex-former-local-adapter-prepare-orchestration.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md`
- `reports/2026-06-11-perspective-codex-former-local-adapter-prepare-orchestration-dry-run.md`
- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`
- package scripts for dry-run CLI and smoke

No UI, routes, DB, network, provider/model, Codex SDK, GitHub API, capture helper behavior, or prior fixture JSON changed.

## Dry-Run Behavior

The CLI requires `--dry-run`. Without it, the command rejects with:

```text
prepare orchestration currently supports --dry-run only
```

Dry-run reads source input and preflight summary JSON, validates them, verifies exact byte hashes, optionally validates a manifest, constructs a bounded helper command summary, optionally writes a summary JSON, and prints a compact local-only summary.

It does not run the prepare helper and does not create helper outputs.

## CLI Usage

```bash
npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-dry-run --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-summary-dry-run.json
```

Supported options:

- `--dry-run`
- `--source-input <path>`
- `--preflight-summary <path>`
- `--out-dir <path>`
- `--generated-at <iso>`
- `--prepare-summary-out <path>`
- `--manifest <path>`
- `--expected-source-input-hash <sha256>`

## Input Validation

Dry-run validates:

- source input JSON and local adapter source-input shape;
- preflight summary version, mode, passed status, errors array, warning count, and source input hash;
- exact source input hash against file bytes;
- optional expected source input hash;
- optional manifest shape and manifest hash;
- unsafe/private/provider/credential marker-like material in source input, preflight summary, and optional manifest.

Errors include field paths/categories and avoid printing raw unsafe values.

## Constructed Helper Command

The dry-run summary includes argv, not a shell string:

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

The command is not executed.

## Prepare Summary Fixture

Added deterministic fixture:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-summary-dry-run.json`

The fixture uses existing committed adapter manifest, source input, and preflight summary fixtures. It records `helper_exit_status: not_run`, null helper output paths/hashes, and all authority flags false.

## Path Handling

Dry-run rejects unknown options, duplicate options, missing values, values supplied to `--dry-run`, unexpected positional arguments, existing-file `--out-dir`, directory `--prepare-summary-out`, and summary path collisions with source input or preflight summary paths.

Dry-run may create the parent directory for `--prepare-summary-out`. It does not create the prepare out-dir.

## generated_at / Hash Behavior

`--generated-at` overrides the source input timestamp for the dry-run summary and helper command argv.

`source_input_hash` hashes exact source input bytes. Optional manifest hash hashes exact manifest bytes. The preflight summary and optional expected hash must match the exact source input byte hash.

## Privacy/Redaction Handling

Dry-run records paths, hashes, status labels, caveats, and bounded command summary only.

It records no raw diff, raw log, raw transcript, raw candidate payload, provider log, credential, private account data, browser dump, screenshot, or hidden reasoning.

Public docs/reports/fixtures do not echo raw unsafe/private marker literals.

## Authority Boundary

All prepare summary authority flags are false:

- accepted state created: false
- proof/evidence/readiness created: false
- review decision created: false
- provider/model calls: false
- Codex SDK calls: false
- GitHub API calls: false
- network calls: false
- DB writes: false
- clipboard automation: false
- live Codex capture: false
- runtime fixture mutation: false
- prepare helper executed: false
- validate helper executed: false
- surface export created: false
- Core decision: false

## Verification

Passed:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-dry-run --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-summary-dry-run.json`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run`
- `git diff --check`
- `git diff --cached --check`

Attempted upstream smokes:

- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-design` failed only on its historical changed-file boundary: `prepare orchestration design changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md`.
- `npm run smoke:perspective-codex-former-local-adapter-surface-snapshots` failed only on its historical changed-file boundary: `local adapter surface snapshots changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_PREPARE_ORCHESTRATION_DRY_RUN_V0_1.md`.

Those older guards were not widened because this PR is a later dry-run implementation stage and does not change their implementation scope.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Prepare execution and validate orchestration runtime checks skipped because this PR implements dry-run only.

## Recommended Next PR

Harden local Codex adapter prepare orchestration dry-run.

## What Codex Did Not Do

Codex did not execute the existing capture helper prepare command, run the validate helper, call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decision records, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, add UI/routes/browser surfaces, automate clipboard, implement prepare execution mode, implement validate orchestration, implement surface export, modify existing UI route/component behavior, modify capture helper behavior, or modify fixture JSON from PR #500, PR #501, PR #509, PR #510, or PR #511.
