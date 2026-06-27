# Research Candidate Review Memory DB Routes Runtime Completion v0.1

Slice name: `research_candidate_review_memory_db_routes_runtime_completion_v0_1`

## Purpose

This slice closes the original Phase 2.3 DB-backed route gap. It adds
same-origin Next.js route handlers for Review Memory create, list, detail,
activity, and discard operations backed by the caller-selected allowlisted
SQLite DB store from the DB store runtime completion.

The earlier JSON local-store route remains legacy/compatible but is not the
DB-backed route completion.

## Relationship to docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md

The integrated roadmap guide names Phase 2.3 as
`research_candidate_review_memory_routes_v0_1` and lists DB-backed route files
for review records, detail reads, activity, and discard. This runtime completion
implements those original route requirements without narrowing them into a
route-boundary-only JSON helper. The roadmap guide is not SSOT.

## Relationship to earlier route-boundary-only JSON route

`app/api/research-candidate/review-memory/route.ts` remains the legacy
route-boundary-only JSON local-store route. It keeps compatibility with earlier
route and UI smokes. It does not satisfy the DB-backed Phase 2.3 route
acceptance criteria by itself.

## Relationship to DB store runtime completion

The routes call `lib/research-candidate-review/review-memory-db-store.ts` for
all persistence behavior. The route layer validates same-origin and DB path
boundaries, opens allowlisted local SQLite files, ensures schema only on POST
writes, and maps store results into bounded public-safe route responses.

## Route list

- `POST /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records/[review_record_id]`
- `GET /api/research-candidate-review/review-records/[review_record_id]/activity`
- `POST /api/research-candidate-review/review-records/[review_record_id]/activity`
- `POST /api/research-candidate-review/review-records/[review_record_id]/discard`

## Request/response shape

Requests resolve `route_version`, `scope`, `db_path`, `action`, and payload from
the route path, query string, or JSON body. POST bodies are JSON objects.

Responses use:

- `route_version: research_candidate_review_memory_db_routes.v0.1`
- `scope: project:augnes`
- `status: ok | error`
- bounded `error_code`
- store `result` when a store operation was executed
- route `authority_boundary`
- public-safe boundary notes

Route responses do not echo raw unsafe request payloads or unsafe DB paths.

## DB path policy

DB paths must be relative paths under one of:

- `tmp/research-candidate-review-memory/`
- `.tmp/research-candidate-review-memory/`

DB paths must end in `.sqlite` or `.db`. The policy rejects absolute paths,
`..`, backslashes, null bytes, URLs, private/local user paths, token/secret-like
paths, and unsafe/private/raw markers. Invalid DB paths return bounded
`invalid_db_path` without echoing the submitted path.

## Same-origin policy

Routes reject cross-site `Origin` or `Sec-Fetch-Site` headers with
`same_origin_required`. Local/test requests without an `Origin` are allowed only
when the `Host` is local.

## GET no-create policy

GET routes do not create DB files or schema. They open DB files read-only with
`fileMustExist`. Missing DB files return bounded `db_missing`. DB files without
the Review Memory DB schema return bounded `schema_missing`.

## POST write policy

POST routes may ensure schema and write only review memory records, activity
rows, and discard lifecycle transitions. POST create calls
`createResearchCandidateReviewRecordV01`. POST activity calls
`appendResearchCandidateReviewRecordActivityV01`. POST discard calls
`discardResearchCandidateReviewRecordV01`.

Discard is lifecycle transition, not delete.

## Error mapping policy

Store `not_found` maps to route `not_found` with HTTP 404.
`conflict_existing_record` maps to HTTP 409.
`blocked_forbidden_authority` maps to HTTP 403.
`blocked_private_or_raw_payload`, `blocked_invalid_input`, and `rejected` map to
HTTP 400. Route-only failures use bounded public-safe codes such as
`invalid_json_body`, `invalid_json_object`, `invalid_route_request`,
`invalid_db_path`, `db_missing`, `schema_missing`, `invalid_review_record_id`,
`invalid_activity_input`, and `invalid_discard_reason`.

## Privacy/redaction policy

The route layer stores only what the DB store accepts: public-safe summaries and
symbolic refs. Source refs are lineage pointers, not proof. Candidate refs are
not facts. Review memory is not truth. Review memory is not proof. Review
memory is not accepted evidence. Review memory is not durable Perspective
state. Unsafe/raw/private payloads are blocked without raw echo.

## Authority boundary

Allowed true fields:

- `review_memory_db_routes_now`
- `same_origin_required`
- `db_backed_review_memory_routes_now`
- `explicit_operator_route_action_only`
- `db_query_or_write_now`
- `db_schema_ensure_on_write_now`

Forbidden false fields include UI, provider/OpenAI calls, prompts, source fetch,
retrieval/RAG, proof/evidence writes, claim/evidence writes, Perspective
promotion, durable Perspective state write/apply, Formation Receipt writes,
Git Ledger export runtime, Git/GitHub execution, Codex execution, file
export/import, product-write, product-write runtime, product-write authority,
product persistence, product ID allocation, truth/proof/evidence/state claims,
discard-as-delete claims, and smoke/CI-as-truth claims.

This slice does not add UI. This slice does not call providers. This slice does
not send prompts. This slice does not fetch sources. This slice does not
execute retrieval/RAG. This slice does not create proof/evidence. This slice
does not write claim/evidence records. This slice does not promote Perspective.
This slice does not write/apply durable Perspective state. This slice does not
write Formation Receipts. This slice does not execute Git Ledger export
runtime. This slice does not execute Git or call GitHub. This slice does not
execute Codex. This slice does not export/import files. This slice does not
product-write. This slice does not allocate product IDs. Product-write remains
parked by #686. Smoke/CI pass is not truth.

## Fixture policy

`fixtures/research-candidate-review.memory-db-routes-runtime.sample.v0.1.json`
uses public-safe symbolic refs and allowlisted relative DB path examples only.
Safe blocked-example markers appear only inside blocked examples.

## Verification expectations

Use:

- `node --check scripts/smoke-research-candidate-review-memory-db-routes-runtime-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1`
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

## Deferred UI binding

Follow-up UI completion should bind to these DB-backed routes. It should not
bind only to the legacy JSON local-store helper if the roadmap slice requires
DB-backed runtime behavior.
