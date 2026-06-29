# Dogfooding Research Record Runtime v0.1

Slice name: `dogfooding_record_runtime_store_route_v0_1`

## Purpose

Dogfooding Research Record Runtime preserves operator-supplied PR, Codex, CI,
smoke, validation, warning, skipped-check, not-done, and expected/observed delta
material as candidate-only review input for later ChatGPT/Codex workflows.

This is the first post-#870 non-UI Phase 1 core implementation slice. PR #868 is
treated as the frozen web baseline:

```text
/ = public Augnes surface
/perspective = Perspective detail
/workbench = cockpit/workbench
```

PR #870 selected `dogfooding_record_runtime_store_route_v0_1` as the next
non-UI implementation slice. This slice follows that selection and keeps the
current direction: Core first, Handoff first, Conversation first, Web last.

## Scope

In scope:

- `types/dogfooding-research-record-runtime-contract.ts`
- `lib/dogfooding/dogfooding-record-store.ts`
- `app/api/dogfooding/research-records/route.ts`
- `fixtures/dogfooding-research-record-runtime.sample.v0.1.json`
- `scripts/smoke-dogfooding-research-record-runtime-v0-1.mjs`
- `docs/DOGFOODING_RESEARCH_RECORD_RUNTIME_V0_1.md`
- `package.json`
- `docs/00_INDEX_LATEST.md`

The runtime supports bounded candidate-only record kinds:

- `pr_body_summary`
- `codex_result_report`
- `changed_files_summary`
- `validation_command_report`
- `smoke_failure_report`
- `skipped_check_report`
- `known_warning_report`
- `not_done_report`
- `expected_observed_delta_report`
- `operator_review_note`
- `merge_closeout_summary`

## Runtime Boundary

The store uses caller-injected SQLite handles only.

The route is:

```text
POST /api/dogfooding/research-records
GET /api/dogfooding/research-records
```

POST requires a same-origin boundary, a JSON object body, `action: "create"`
when action is supplied, a safe local `db_path`, and a public-safe
dogfooding research record input. The route validates the candidate record
before opening the write DB handle.

Safe route DB paths are limited to:

```text
.tmp/dogfooding-research-records/
tmp/dogfooding-research-records/
```

GET is read-only. GET opens the caller-provided DB with read-only,
file-must-exist behavior. GET does not create directories. GET does not ensure
tables. GET does not trigger writes.

Read-by-id is implemented as the store helper and as `record_id` query support
on the list route. A separate
`/api/dogfooding/research-records/[record_id]` detail route remains incomplete.

## Preserved Candidate Material

Stored records preserve public-safe bounded summaries for:

- source refs
- PR refs
- branch refs
- commit refs
- changed file refs
- validation refs
- skipped check refs
- known warning refs
- not-done refs
- expected/observed delta refs
- normalized summary
- review cues
- privacy report
- authority boundary
- reason codes
- lifecycle state

Codex result report input can be aligned through the existing
`codex_result_report_ingestion_v0_1` normalizer. That alignment only converts
caller-provided public-safe report fields into candidate review refs. It does
not execute Codex, run validation, call GitHub, query providers, fetch sources,
or write product state.

## Privacy Boundary

Privacy Redaction Runtime Guard v0.1 conventions are applied without raw value
echo.

Private/raw/provider/runtime/local/credential/hidden-reasoning markers are
blocked before storage. Blocked responses include public-safe findings, paths,
and reason codes only. Original unsafe values are not included.

Public-safe refs must be symbolic refs or bounded summaries. Live URLs, local
private paths, token-like values, raw provider output, raw retrieval output,
raw terminal logs, raw GitHub payloads, raw conversations, hidden reasoning,
telemetry dumps, actual prompts, and provider responses are not stored.

## Authority Boundary

Dogfooding research record is candidate-only review material.

PR body is not truth.

Changed files are not proof.

Validation pass is not approval.

Validation failure is not automatic rejection.

Smoke pass is not evidence.

Smoke failure is diagnostic, not automatic rejection.

CI pass is not authority.

CI failure is diagnostic, not automatic rejection.

Codex result is not execution approval.

Git refs are references only.

GitHub PR refs are references only.

Dogfooding record is not Review Memory write.

Dogfooding record is not promotion.

Dogfooding record is not Formation Receipt.

Dogfooding record is not durable Perspective state.

Dogfooding record is not product-write.

Product-write remains parked by #686.

Forbidden positive authority string shortcuts are blocked for validation
pass/failure, smoke pass/failure, CI pass/failure, Codex result, PR body,
changed files, dogfooding record, provider output, retrieval score, feedback,
layout coordinate, and salience score boundaries.

## Forbidden Capabilities

This slice adds no UI.

This slice adds no components.

This slice changes no Cockpit files.

This slice changes no public surface files.

This slice changes no route model for `/`, `/perspective`, or `/workbench`.

This slice adds no browser-validation-only work.

This slice adds no provider/OpenAI calls.

This slice sends no prompts.

This slice fetches no sources.

This slice executes no retrieval.

This slice writes no retrieval index.

This slice creates no proof/evidence.

This slice writes no claim/evidence records.

This slice executes no promotion.

This slice creates no promotion decision from Codex, CI, smoke, or validation.

This slice writes no Formation Receipt.

This slice applies no durable Perspective state.

This slice product-writes nothing and allocates no product IDs.

This slice executes no Codex from Augnes runtime.

This slice calls no GitHub API from Augnes runtime.

This slice creates no Git branch, commit, PR, merge, tag, release, deploy, or
publish action from Augnes runtime.

## Store Behavior

The store creates `dogfooding_research_records` only inside a caller-injected
local DB handle. No repository migration file is added.

Create is deterministic. The same candidate input produces the same fingerprint.
Creating the same record id with the same fingerprint returns
`duplicate_record` with `idempotent_replay: true`. Creating the same record id
with different content returns `conflicting_record`.

List and read helpers are read-only against the supplied DB handle.

## Verification Expectations

The focused smoke verifies:

- valid create
- valid list
- valid read helper and route query read
- invalid shape rejection
- same-origin POST refusal
- unsafe DB path and missing DB behavior
- private/raw marker blocking without unsafe echo
- forbidden authority claim refusal
- skipped checks preservation
- known warnings preservation
- not-done items preservation
- expected/observed delta preservation
- validation pass/fail not treated as approval/rejection
- duplicate idempotency behavior
- no product/promotion/proof/durable/GitHub/provider/retrieval/source-fetch or
  release execution flags

## Next Recommended Slice

`codex_result_report_to_dogfooding_record_binding_v0_1`
