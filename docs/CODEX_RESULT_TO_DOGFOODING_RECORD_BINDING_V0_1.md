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
The implemented behavior is deterministic conversion from normalized Codex
report material into candidate-only dogfooding research record input.

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

Route and DB behavior remain with the existing dogfooding runtime. Optional DB
smoke coverage uses the existing caller-injected dogfooding research record
store helpers from PR #871.

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

The conversion output remains candidate-only review material. It does not grant
proof, accepted evidence, Review Memory, promotion, Formation Receipt, durable
Perspective state, product-write, or execution authority.

PR bodies, changed files, validation results, CI results, Git refs, and GitHub
PR refs remain review references. Product-write remains governed by
`docs/AUTHORITY_MATRIX.md` and parked by #686.

## Forbidden Capabilities

This binding only converts public-safe Codex report material into candidate
dogfooding research record input. Live authority for UI, routes, DB schema,
providers, retrieval, Review Memory, product-write, Git/GitHub, release,
deploy, and publish behavior remains in the specific runtime docs and
`docs/AUTHORITY_MATRIX.md`.

## Verification Expectations

The focused smoke verifies:

- valid normalized Codex report to dogfooding research record input conversion
- valid raw caller-provided report through the existing normalizer
- deterministic record id and idempotency key
- preservation of PR refs, branch refs, commit refs, changed files, validation
  commands, skipped checks, known warnings, not-done items, expected/observed
  deltas, source refs, review cues, boundary notes, and report reason codes
- expected/observed delta separation from validation result context
- candidate-only conversion without execution authority
- private/raw marker blocking without unsafe echo
- forbidden positive authority string claim blocking through the existing
  dogfooding research record builder
- no product/promotion/proof/durable/Review Memory/GitHub/provider/retrieval/
  source-fetch/release execution flags
- caller-injected DB integration through existing dogfooding research record
  store helpers

## Historical Follow-Up Metadata

`conversation_handoff_packet_builder_v0_2`

This ID is retained as fixture compatibility metadata. Current PR sequencing
authority comes from `docs/ACTIVE_DEVELOPMENT_COMPLETION_POSTURE_V0_1.md`.
