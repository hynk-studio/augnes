# Codex Result To Dogfooding Record Binding v0.1

Slice name: `codex_result_report_to_dogfooding_record_binding_v0_1`

## Purpose

This slice connects the existing Codex result report ingestion normalizer to the
dogfooding research record input contract from PR #871.

PR #868 is treated as the frozen web baseline.

```text
/ = public Augnes surface
/perspective = Perspective detail
/workbench = Cockpit/workbench
```

PR #871 provides the dogfooding research record runtime used by this binding.
This slice adds no UI. Codex reports become candidate-only dogfooding research
record input.

## Scope

In scope:

- `lib/dogfooding/codex-result-to-dogfooding-record.ts`
- `fixtures/codex-result-to-dogfooding-record.sample.v0.1.json`
- `scripts/smoke-codex-result-to-dogfooding-record-v0-1.mjs`
- `docs/CODEX_RESULT_TO_DOGFOODING_RECORD_BINDING_V0_1.md`
- `package.json`
- `docs/00_INDEX_LATEST.md`

The helper converts a normalized Codex result report into
`DogfoodingResearchRecordInput`. The raw-input wrapper invokes the existing
`codex_result_report_ingestion_v0_1` normalizer first and returns no dogfooding
input when that normalizer blocks or rejects the caller payload.

No route is added. No DB schema or migration is added. Optional DB smoke
coverage uses the existing caller-injected dogfooding research record store
helpers from PR #871.

## Preserved Candidate Material

The binding preserves public-safe candidate material for:

- PR refs
- branch refs
- commit refs
- changed file refs
- validation command and observed check refs
- skipped check refs
- known warning refs
- not-done refs
- expected/observed delta refs
- source refs
- normalized summary
- review cue refs
- boundary notes
- authority boundary
- report fingerprint and deterministic idempotency key
- report reason codes as candidate source refs

Expected/observed deltas remain separate candidate material. They are not
converted into validation approval or rejection.

## Authority Boundary

Codex report to dogfooding record is not proof.

Codex report to dogfooding record is not accepted evidence.

Codex report to dogfooding record is not Review Memory write.

Codex report to dogfooding record is not promotion.

Codex report to dogfooding record is not Formation Receipt.

Codex report to dogfooding record is not durable Perspective state.

Codex report to dogfooding record is not product-write.

Codex report is not execution approval.

PR body is not truth.

Changed files are not proof.

Validation pass is not approval.

Validation failure is not automatic rejection.

Smoke pass is not evidence.

Smoke failure is diagnostic, not automatic rejection.

CI pass is not authority.

CI failure is diagnostic, not automatic rejection.

Git refs and GitHub PR refs are references only.

Dogfooding records remain candidate-only review material.

Product-write remains parked by #686.

## Forbidden Capabilities

This slice adds no UI.

This slice adds no components.

This slice changes no Cockpit files.

This slice changes no public surface files.

This slice changes no route model for `/`, `/perspective`, or `/workbench`.

This slice adds no browser-validation-only work.

This slice adds no new API route.

This slice adds no DB migration.

This slice calls no provider or OpenAI API.

This slice sends no prompts.

This slice fetches no sources.

This slice executes no retrieval and writes no retrieval index.

This slice creates no proof/evidence.

This slice writes no claim/evidence records.

This slice writes no Review Memory.

This slice executes no promotion and creates no promotion decision from Codex,
CI, smoke, or validation.

This slice writes no Formation Receipt.

This slice applies no durable Perspective state.

This slice product-writes nothing and allocates no product IDs.

This slice executes no Codex from Augnes runtime.

This slice calls no GitHub API from Augnes runtime.

This slice creates no Git branch, commit, PR, merge, tag, release, deploy, or
publish action from Augnes runtime.

## Verification Expectations

The focused smoke verifies:

- valid normalized Codex report to dogfooding research record input conversion
- valid raw caller-provided report through the existing normalizer
- deterministic record id and idempotency key
- preservation of PR refs, branch refs, commit refs, changed files, validation
  commands, skipped checks, known warnings, not-done items, expected/observed
  deltas, source refs, review cues, boundary notes, and report reason codes
- expected/observed delta separation from validation approval/rejection
- validation pass is not approval
- validation failure is not automatic rejection
- CI pass is not authority
- CI failure is diagnostic only
- Codex report is not execution approval
- PR body is not truth
- changed files are not proof
- private/raw marker blocking without unsafe echo
- forbidden positive authority string claim blocking through the existing
  dogfooding research record builder
- no product/promotion/proof/durable/Review Memory/GitHub/provider/retrieval/
  source-fetch/release execution flags
- caller-injected DB integration through existing dogfooding research record
  store helpers

## Next Recommended Slice

`conversation_handoff_packet_builder_v0_2`
