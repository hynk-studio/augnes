# Perspective Codex Former Local Adapter Source Input Preflight Hardening

## Summary

Hardened the local Codex adapter around CLI option parsing, strict v0.1 manifest fields, local source-input preflight validation, deterministic preflight summaries, clearer diagnostics, and output path handling.

The adapter remains local-only, deterministic, review-only, and non-authorizing.

## Why Follows PR #509

PR #509 added the first narrow adapter mode: Manifest-to-source-input.

This PR hardens that path and adds source-input preflight validation before an operator uses the existing capture helper `--source-input` path.

## Hardening Scope

Changed scope:

- `lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts`
- `scripts/perspective-codex-former-local-adapter-manifest-to-source-input.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-manifest-to-source-input.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-source-input-preflight-hardening.mjs`
- docs/report
- package script

No UI, route, component, CSS, existing capture helper behavior, fixture JSON from PR #500 or PR #501, preview data adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, or GitHub mutation code was changed.

## CLI Option Value Hardening

The CLI now rejects missing values, empty values, unknown options, unexpected positional arguments, and duplicate singleton options.

Value-required flags include `--manifest`, `--out-dir`, `--generated-at`, `--source-input-out`, `--metadata-out`, `--summary-out`, and `--preflight-source-input`.

## Unknown Manifest Field Policy

The v0.1 manifest policy is strict.

Unknown top-level manifest fields reject. Unknown fields inside check runs, skipped checks, unresolved gaps, and readiness also reject with field-path diagnostics.

## Source Input Preflight

Added pure source-input preflight functions:

- `validateCodexFormerLocalAdapterSourceInput`
- `assertCodexFormerLocalAdapterSourceInput`
- `buildCodexFormerLocalAdapterSourceInputPreflightSummary`

The preflight validator checks adapter-emitted helper-compatible source input without calling the prepare helper.

The CLI supports:

```bash
npm run perspective:codex-former:local-adapter:source-input -- --preflight-source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --summary-out /tmp/augnes-codex-former-local-adapter-preflight-summary.json
```

## Preflight Summary

When `--summary-out` is supplied, preflight writes deterministic JSON with:

- preflight summary version;
- mode;
- generated timestamp from source input when present;
- source input path;
- source input hash;
- passed or failed status;
- bounded errors;
- warning count;
- false authority flags.

## Diagnostics

Diagnostics include field paths such as `manifest.extra_field`, `manifest.tests_checks_run[0].extra_field`, and `source_input.tests_checks_run[0].status`.

Unsafe marker diagnostics identify category and field path without printing full unsafe values.

## Path Handling

The CLI now rejects:

- explicit output paths that point to directories;
- source input and metadata output path collisions;
- summary output collisions with source input or metadata paths;
- preflight summary output collisions with the preflight source input path.

`--out-dir` may create a directory, and explicit output paths may create parent directories.

## generated_at / Hash Behavior

PR #509 behavior is preserved:

- `manifest_hash` hashes original manifest bytes;
- `source_input_hash` hashes emitted source input bytes;
- `--generated-at` changes emitted source input and therefore `source_input_hash`;
- `--generated-at` does not change `manifest_hash`.

Preflight mode hashes the source input file bytes exactly as supplied.

## Fixture Impact

The existing valid manifest fixture and expected source input fixture remain unchanged.

No PR #500 or PR #501 fixture JSON was modified.

## Capture Helper Compatibility

The hardening smoke still verifies the adapter-emitted source input with the existing capture helper prepare path.

That check is verification only; normal adapter CLI behavior does not run prepare or validate helpers.

## Privacy/Redaction Handling

The adapter emits bounded summaries only.

It does not include raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads outside the returned-envelope path concept, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs and reports do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation does not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, add prepare orchestration, add validate orchestration, add surface export, or modify UI routes/components.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:source-input -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter --generated-at 2026-06-11T00:00:00.000Z`
- `npm run perspective:codex-former:local-adapter:source-input -- --preflight-source-input reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json --summary-out /tmp/augnes-codex-former-local-adapter-preflight-summary.json`
- `npm run smoke:perspective-codex-former-local-adapter-manifest-to-source-input`
- `npm run smoke:perspective-codex-former-local-adapter-source-input-preflight-hardening`
- `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-local-adapter-capture-packet --source-input /tmp/augnes-codex-former-local-adapter/codex-former-local-adapter-source-input.json --generated-at 2026-06-11T00:00:00.000Z`
- `git diff --check`
- `git diff --cached --check`

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

Optional `npm run smoke:perspective-codex-former-capture-helper` was not run because the required direct capture-helper compatibility command passed and the older helper smoke's changed-file guard is not scoped to this adapter hardening stage.

No provider/model, Codex SDK, DB, GitHub API, network, live capture, runtime fixture mutation, review decision, accept, promote, or reject checks were added beyond smoke/source boundary checks because those surfaces are intentionally absent.

## Recommended Next PR

Add local Codex adapter fixture snapshots for Session Panel and Inbox states.

## What Codex Did Not Do

Codex did not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, modify existing fixture JSON, modify existing capture helper behavior, implement prepare orchestration, implement validate orchestration, implement surface export, or modify existing UI routes/components.
