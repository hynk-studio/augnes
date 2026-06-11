# Perspective Codex Former Local Adapter Manifest-to-Source-Input

## Summary

Implemented the first narrow local Codex adapter mode: Manifest-to-source-input.

The adapter reads a bounded local adapter manifest JSON and writes deterministic source input JSON for the existing Codex Former capture helper `--source-input` path.

## Why Follows PR #508

PR #508 designed the local Codex integration adapter and recommended the next PR: add local Codex adapter manifest-to-source-input implementation.

This PR implements only that first local-only mode.

## Implementation Scope

Changed scope:

- `lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input.ts`
- `scripts/perspective-codex-former-local-adapter-manifest-to-source-input.mjs`
- `scripts/smoke-perspective-codex-former-local-adapter-manifest-to-source-input.mjs`
- docs/report
- deterministic fixtures
- package scripts

No app route, component, CSS, existing capture helper behavior, fixture JSON from PR #500 or PR #501, preview data adapter behavior, projection builder behavior, DB schema, provider/model integration, Codex SDK integration, or GitHub mutation code was changed.

## Manifest-to-source-input Behavior

The adapter validates a versioned manifest, converts it into helper-compatible source input JSON, and writes adapter metadata JSON.

Manifest check statuses `passed` and `failed` remain in `tests_checks_run`. Manifest statuses `blocked`, `skipped`, and `not_run` are normalized into `skipped_checks` for helper compatibility.

## Fixture Manifest

Fixture manifest:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json`

It uses bounded local implementation-scope material, generated timestamp `2026-06-11T00:00:00.000Z`, scope `project:augnes`, work id `AG-codex-former-local-adapter-manifest-to-source-input`, source PR ref `pr:hynk-studio/augnes#508`, typecheck/smoke check examples, browser validation skip reason, unresolved gaps, and review-only readiness.

## Source Input Output

Expected emitted fixture:

- `reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json`

The source input includes generated timestamp, scope, work id, source PR refs, changed files, changed file summary, helper-compatible checks, skipped checks, unresolved gaps, readiness, redaction notes, and authority boundaries.

## Adapter Metadata

The CLI writes metadata JSON with:

- metadata version and source kind;
- generated timestamp;
- manifest/source input paths;
- manifest hash;
- source input hash;
- manifest and source input work id/scope;
- omitted optional fields;
- normalized check status notes;
- false authority flags.

## generated_at / Hash Behavior

When `--generated-at` is supplied, source input and metadata use the override.

`manifest_hash` remains the hash of the manifest file bytes as supplied. `source_input_hash` is the hash of the emitted source input bytes.

When `--generated-at` is omitted, source input and metadata use `manifest.generated_at`.

## Validation and Rejection Coverage

Smoke coverage verifies rejection for missing manifest file, invalid JSON, non-object JSON, unsupported manifest version, unsupported source kind, missing scope, missing work id, missing changed files, empty changed files, no verification material, unsupported check status, missing check field, missing skipped-check reason, missing unresolved-gap summary, unsupported readiness status, unsafe marker categories, and unsafe changed file paths.

Smoke also verifies benign bounded words such as tokenizer, tokenization, secretariat, check:browser-computer-use, no browser-visible surface, and local docs report smoke work do not reject.

## Privacy/Redaction Handling

The adapter emits bounded summaries only.

It does not include raw diffs, raw logs, raw transcripts, raw provider logs, raw candidate payloads outside the returned-envelope path concept, private account material, credentials, screenshots, browser dumps, or omitted unsafe fields.

Public docs and reports do not echo raw unsafe/private marker literals.

## Authority Boundary

The implementation is local-only, deterministic, review-only, and non-authorizing.

It does not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, run prepare or validate helpers as normal CLI behavior, add UI/routes/browser surface, automate clipboard, approve, merge, deploy, make Core decisions, capture live Codex sessions, or mutate runtime fixtures.

## Verification

Passed verification:

- `npm run typecheck`
- `npm run perspective:codex-former:local-adapter:source-input -- --manifest reports/fixtures/2026-06-11-codex-former-local-adapter-manifest-valid.json --out-dir /tmp/augnes-codex-former-local-adapter --generated-at 2026-06-11T00:00:00.000Z`
- `npm run smoke:perspective-codex-former-local-adapter-manifest-to-source-input`
- `npm run perspective:codex-former:capture-packet -- --out-dir /tmp/augnes-codex-former-local-adapter-capture-packet --source-input /tmp/augnes-codex-former-local-adapter/codex-former-local-adapter-source-input.json --generated-at 2026-06-11T00:00:00.000Z`
- `git diff --check`
- `git diff --cached --check`

Known verification failure:

- `npm run smoke:perspective-codex-former-capture-helper` failed with `Perspective Codex former capture helper changed an out-of-scope file: docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_MANIFEST_TO_SOURCE_INPUT_V0_1.md`.

That older helper guard was not widened because this PR adds the local adapter slice and does not change capture helper behavior.

## Skipped Checks With Reasons

Browser/computer-use validation skipped: no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.

No provider/model, Codex SDK, DB, GitHub API, network, live capture, runtime fixture mutation, review decision, accept, promote, or reject checks were added beyond smoke/source boundary checks because those surfaces are intentionally absent.

## Recommended Next PR

Add local Codex adapter source-input preflight hardening.

## What Codex Did Not Do

Codex did not call Codex, integrate Codex SDK, call provider/model APIs, call GitHub APIs, call network, write DB records, persist accepted state, create proof/evidence/readiness records, create review decisions, add accept/promote/reject actions, approve, merge, deploy, make Core decisions, capture live Codex sessions, mutate runtime fixtures, modify existing fixture JSON, modify existing capture helper behavior, implement prepare orchestration, implement validate orchestration, implement surface export, or modify existing UI routes/components.
