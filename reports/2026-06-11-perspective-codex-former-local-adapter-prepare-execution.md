# Perspective Codex Former Local Adapter Prepare Execution

## Summary

Implemented explicit `--execute` mode for the existing local adapter prepare orchestration CLI.

Execution mode proves current inputs match a reviewed dry-run summary, reserves the helper output directory, runs only the existing capture helper prepare path, discovers helper outputs, computes hashes and sizes, and writes a deterministic execution summary JSON.

## Why Follows PR #515

PR #515 designed prepare execution as the next step after dry-run hardening. The implemented gate uses PR #514/PR #515 contracts: `execution_readiness`, helper argv fingerprinting, helper availability, manifest consistency, and output path hardening.

## Implementation Scope

Changed scope is limited to:

- orchestration library types and validation;
- existing prepare orchestration CLI;
- one execution smoke;
- docs/report;
- one execution summary fixture;
- package script registration.

No app routes, components, CSS, DB schema, provider/model integration, GitHub mutation code, Codex SDK integration, or capture helper behavior changed.

## Execution Mode Behavior

`--execute` is explicit and mutually exclusive with `--dry-run`. Supplying neither mode is rejected.

Required execution inputs:

- source input;
- preflight summary;
- dry-run summary;
- helper out-dir.

Optional execution inputs:

- manifest;
- generated_at;
- expected source input hash;
- expected helper argv hash;
- execution summary output path;
- bounded log line limit.

Unknown options, duplicate options, missing values, positional arguments, boolean flag values, arbitrary command override options, and provider/GitHub/network/DB-style options are rejected.

## Dry-Run Equivalence Gate

Before execution, the adapter:

- validates source input and preflight summary;
- validates dry-run mode, dry_run flag, not-run helper status, and ready execution_readiness;
- recomputes source input, preflight, and dry-run summary hashes from bytes;
- reconstructs helper command argv from current source path, out-dir, and generated_at;
- stable-stringifies argv and computes SHA-256;
- compares argv and hash to the dry-run summary;
- requires exact string path equality with the dry-run summary for source input, preflight summary, manifest, and helper out-dir;
- checks optional expected hashes;
- checks manifest/source-input consistency when supplied.

No output directory is created until this gate passes.

## CLI Usage

Dry-run:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --dry-run --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-execution --generated-at 2026-06-11T00:00:00.000Z --prepare-summary-out /tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json
```

Execution:

```bash
npm run perspective:codex-former:local-adapter:prepare -- --execute --source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --preflight-summary reports/fixtures/2026-06-11-codex-former-local-adapter-source-input-preflight-summary.json --dry-run-summary /tmp/augnes-codex-former-local-adapter-prepare-execution-dry-run-summary.json --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter-prepare-execution --generated-at 2026-06-11T00:00:00.000Z --prepare-execution-summary-out /tmp/augnes-codex-former-local-adapter-prepare-execution-summary.json
```

## Helper Invocation

The only executed command is:

```bash
npm run perspective:codex-former:capture-packet -- --out-dir <out-dir> --source-input <source-input-path> --generated-at <generated-at>
```

The CLI invokes this with a fixed argv array and no shell interpolation. It does not accept a caller-supplied command.

## Output Discovery

After helper execution, the adapter discovers helper metadata, copyable prompt, and return envelope template. It records actual file paths, bounded packet refs from metadata, SHA-256 file hashes, and file sizes.

The current helper emits bounded refs rather than standalone manual copy packet/former input packet files, so those path/hash/size fields remain null while the refs are populated.

## Execution Summary Fixture

Committed fixture:

```text
reports/fixtures/2026-06-11-codex-former-local-adapter-prepare-execution-summary-success.json
```

The fixture is generated with:

- out-dir `/tmp/augnes-codex-former-local-adapter-prepare-execution`;
- generated_at `2026-06-11T00:00:00.000Z`;
- committed source input, preflight summary, manifest, and matching dry-run summary.

## Success and Failure Behavior

Happy path summary:

- `helper_exit_status: success`;
- `helper_exit_code: 0`;
- `output_discovery_status: complete`;
- `prepare_helper_executed: true`;
- `validate_helper_executed: false`.

Helper non-zero exit writes a bounded failure summary when a safe summary path is supplied and preserves the out-dir. Incomplete output discovery after helper success is reported as `output_discovery_status: incomplete` with `failure_kind: output_discovery_incomplete`.

There is no automatic retry and no automatic cleanup.

## Bounded Logs / Redaction

stdout/stderr summaries include line counts, included lines, truncation state, omitted line count, unsafe marker omission state, and bounds.

Default bounds are 40 lines and 4000 characters. Lines containing unsafe/private marker categories are omitted from the summary.

## Privacy/Redaction Handling

Public artifacts use bounded paths, refs, hashes, sizes, and summaries. They do not dump raw prompt text, raw source material, raw returned material, screenshots, browser dumps, provider material, credentials, or private account material.

## Authority Boundary

Execution mode remains non-authorizing:

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

`prepare_helper_executed: true` is operational provenance only. It is not accepted state, validation, readiness, a review decision, or authority.

## Verification

Passed for this implementation:

- `npm run typecheck`
- deterministic dry-run command for `/tmp/augnes-codex-former-local-adapter-prepare-execution`
- deterministic execution command for `/tmp/augnes-codex-former-local-adapter-prepare-execution`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-orchestration-dry-run`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-dry-run-hardening`
- `npm run smoke:perspective-codex-former-local-adapter-prepare-execution`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

`npm run smoke:perspective-codex-former-local-adapter-prepare-execution-design` skipped: that smoke is design-only and its changed-file guard intentionally allows only the PR #515 design docs/report/smoke/package files, not this implementation's lib/CLI/fixture files.

## Recommended Next PR

Harden local Codex adapter prepare execution.

## What Codex Did Not Do

Codex did not call Codex, run validate orchestration, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, automate clipboard, capture live sessions, mutate runtime fixtures, export surfaces, or add UI/routes/browser behavior.
