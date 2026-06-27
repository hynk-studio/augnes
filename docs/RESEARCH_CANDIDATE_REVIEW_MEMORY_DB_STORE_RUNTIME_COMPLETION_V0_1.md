# Research Candidate Review Memory DB Store Runtime Completion v0.1

Slice name: `research_candidate_review_memory_db_store_runtime_completion_v0_1`

## Purpose

This slice closes the DB-backed Phase 2.2 store gap that the earlier
local-store-only implementation did not fully cover. It adds caller-injected
SQLite persistence for bounded Research Candidate Review Memory records,
candidate links, source links, and activity rows.

Review memory is not truth. Review memory is not proof. Review memory is not
accepted evidence. Review memory is not durable Perspective state.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` lists Phase 2.2
DB table candidates and helper requirements for
`research_candidate_review_memory_store_v0_1`:

- `research_candidate_review_records`
- `research_candidate_review_record_candidates`
- `research_candidate_review_record_sources`
- `research_candidate_review_record_activity`
- create/read/list/activity/discard helpers using caller-injected DB.

This runtime completion implements those DB-backed requirements for the
original Phase 2.2 intent. The roadmap guide is not SSOT.

## Relationship to PR #770 local-store-only implementation

PR #770 implemented `research_candidate_review_memory_store_v0_1` as a
local-store-only JSON snapshot helper with caller-provided file read/write
helpers. That helper remains valid and unchanged for local JSON snapshots, but
it does not satisfy the original Phase 2.2 DB-backed store acceptance criteria.

This slice closes the gap left by the earlier local-store-only JSON helper
implementation. The JSON helper is not a DB runtime escape hatch.

## Relationship to Review Memory Contract v0.1

The DB store persists bounded fields from
`docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_CONTRACT_V0_1.md`:

- review record ID, scope, versions, lifecycle state, record kind, review
  decision, optional review action, reviewer actor, timestamps, bounded summary,
  candidate refs, source refs, boundary acknowledgements, privacy report,
  authority boundary, reason codes, discard reason, supersede links, and related
  record refs.

Source refs are lineage pointers, not proof. Candidate refs are not facts.
Candidate refs are review refs only.

## Relationship to Review Memory Routes/UI follow-up completion

This slice does not add routes. This slice does not add UI. Follow-up route/UI
completion should bind to this DB-backed store rather than only the JSON
local-store helper.

## Schema

`lib/db/schema.sql` and
`lib/research-candidate-review/review-memory-db-store.ts` define:

- `research_candidate_review_records`
- `research_candidate_review_record_candidates`
- `research_candidate_review_record_sources`
- `research_candidate_review_record_activity`

The schema stores JSON only for bounded metadata fields such as privacy report,
authority boundary, reason codes, boundary acknowledgements, and related record
refs. It does not store raw source bodies, raw provider outputs, raw retrieval
outputs, raw conversations, hidden reasoning, telemetry dumps, raw DB rows, raw
diffs, private URLs, local private paths, secrets, provider IDs, connector IDs,
or uploaded-file IDs.

## Store helper API

`lib/research-candidate-review/review-memory-db-store.ts` exports:

- `ensureResearchCandidateReviewMemoryDbSchemaV01(db)`
- `researchCandidateReviewMemoryDbSchemaExistsV01(db)`
- `createResearchCandidateReviewRecordV01(input, db)`
- `readResearchCandidateReviewRecordV01(reviewRecordId, db)`
- `listResearchCandidateReviewRecordsV01(filters, db)`
- `appendResearchCandidateReviewRecordActivityV01(input, db)`
- `discardResearchCandidateReviewRecordV01(reviewRecordId, reason, db)`
- `supersedeResearchCandidateReviewRecordV01(input, db)`
- `createResearchCandidateReviewMemoryDbAuthorityBoundaryV01()`

This slice uses caller-injected DB only. This slice uses temp DB smoke only.
This slice may query/write DB only for review memory records, link rows, and
activity rows.

## Create/read/list/activity/discard behavior

Create validates scope, versions, required IDs, timestamps, lifecycle state,
record kind, review decision, candidate refs, source refs, privacy report,
authority boundary, reason codes, and public-safety markers before opening a
write transaction. It inserts the record, candidate link rows, source link rows,
and a creation activity atomically.

Read returns a bounded `not_found` status when a record is absent. Read returns
candidate refs, source refs, activity history, lifecycle state, review decision,
privacy report, and authority boundary for existing records.

List supports `lifecycle_state`, `review_decision`, `candidate_ref`,
`source_ref`, `include_discarded`, and `limit`. List order is deterministic:
`updated_at DESC, review_record_id ASC`.

Activity append requires an existing `review_record_id`; orphan activity is
rejected without creating activity rows. Activity summaries must be bounded and
public-safe.

Discard sets lifecycle state to `discarded`, sets review decision to `discard`,
records `discard_reason`, appends discard activity, and preserves candidate and
source links.

## Idempotency policy

Duplicate candidate/source refs are deduped before persistence. Creating the
exact same normalized record twice returns `idempotent_existing` and does not
duplicate candidate, source, or activity rows.

## Conflict policy

Creating the same `review_record_id` with a different normalized payload returns
`conflict_existing_record` before link or activity rows are written. Failed
create/link/activity transactions roll back and return bounded rejection status
without echoing raw errors.

## Discard lifecycle policy

Discard is lifecycle transition, not delete. Discard is not delete. Repeated
discard is idempotent and preserves the first persisted discard transition and
links.

## Supersede lineage policy

Supersede preserves lineage. The old record is marked `superseded`, the new
record is preserved, `supersedes_record_ref` and `superseded_by_record_ref`
links are retained, self-supersede is rejected, and no record is hard deleted.

## Privacy/redaction policy

Only public-safe summaries and symbolic refs are stored. Recursive validation
blocks private/raw markers and forbidden authority grants before DB writes.
Blocked inputs return bounded statuses without echoing unsafe strings.

## Authority boundary

Allowed true fields:

- `review_memory_db_store_now`
- `caller_injected_db_only`
- `explicit_operator_review_memory_write_only`
- `db_query_or_write_now`
- `review_record_persistence_now`
- `review_record_activity_persistence_now`

Forbidden false fields include route/UI, provider calls, prompt sending, source
fetch, retrieval/RAG, proof/evidence, claim/evidence writes, Perspective
promotion, durable state write/apply, Formation Receipt writes, Git Ledger
export runtime, Git/GitHub, Codex execution, file export/import, product-write,
product runtime writes, product persistence, product ID allocation, and truth or
proof authority grants.

This slice does not call providers. This slice does not send prompts. This
slice does not fetch sources. This slice does not execute retrieval/RAG. This
slice does not create proof/evidence. This slice does not write claim/evidence
records. This slice does not promote Perspective. This slice does not
write/apply durable Perspective state. This slice does not write Formation
Receipts. This slice does not execute Git Ledger export runtime. This slice
does not execute Git or call GitHub. This slice does not execute Codex. This
slice does not export/import files. This slice does not product-write. This
slice does not allocate product IDs. Product-write remains parked by #686.

Review memory is not truth. Review memory is not proof. Review memory is not
accepted evidence. Review memory is not durable Perspective state. Candidate
refs are not facts. Source refs are lineage pointers, not proof. Smoke/CI pass
is not truth.

## Fixture policy

`fixtures/research-candidate-review.memory-db-store-runtime.sample.v0.1.json`
contains public-safe symbolic refs only. Safe blocked-example placeholders appear
only inside blocked examples and are expected to be rejected.

## Verification expectations

Expected checks:

- `node --check scripts/smoke-research-candidate-review-memory-db-store-runtime-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-store-v0-1`
- `npm run smoke:research-candidate-review-memory-routes-v0-1`
- `npm run smoke:research-candidate-review-memory-ui-v0-1`
- `npm run smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1`
- `npm run smoke:authority-boundary-regression-v0-1`
- `npm run smoke:privacy-redaction-guard-v0-1`
- `npm run smoke:formal-invariant-checks-narrow-scope-v0-1`
- `npm run smoke:empirical-calibration-dataset-v0-1`
- `npm run smoke:product-write-target-contract-v0-1`
- `npm run typecheck`
- `git diff --check`
- `git diff --cached --check`
- `npm run smoke:release-postmerge-observer-notes-v0-1`
- `npm run smoke:release-readiness-matrix-v0-1`

Smoke/CI pass is not truth.

## Deferred work

Deferred work:

- Review Memory DB-backed routes.
- Review Memory UI binding to DB-backed store.
- Foundation/Lifecycle/Review Memory read-only UI binding to DB-backed store.
- Source intake runtime.
- Provider extraction runtime.
- Retrieval/RAG runtime.
- Promotion execution.
- Durable Perspective state apply.
- Formation Receipt write integration.
- Git Ledger export runtime.
- Product-write reentry.
