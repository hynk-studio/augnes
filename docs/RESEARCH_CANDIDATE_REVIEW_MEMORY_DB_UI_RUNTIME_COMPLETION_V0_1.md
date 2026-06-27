# Research Candidate Review Memory DB UI Runtime Completion v0.1

## Purpose

This slice implements `research_candidate_review_memory_db_ui_runtime_completion_v0_1`.
It closes the original Phase 2.4 UI gap by binding the operator Review Memory UI
to DB-backed review memory routes.

This slice is a runtime completion for the earlier Review Memory UI v0.1 work.
The earlier JSON/local-store-backed UI remains legacy/compatible but is not the
DB-backed UI completion.

## Relationship To The Integrated Roadmap

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` calls for Phase 2.4
UI behavior that can save review records, add reviewer note summaries, mark
review actions, list records, open detail, view source and candidate refs, view
authority boundary, discard with reason, and copy a review packet for human
review.

The roadmap guide is not SSOT. This document records the implemented runtime
completion and its boundaries.

## Relationship To Earlier Review Memory UI v0.1

The prior UI exposed the legacy same-origin JSON/local-store route. That remains
useful compatibility coverage, but it does not satisfy the DB-backed Phase 2.4
runtime acceptance criteria after the DB store and DB routes landed.

The active operator page now renders the DB-backed panel. It does not rely on
`app/api/research-candidate/review-memory/route.ts` as its primary persistence
path.

## Relationship To DB Routes Runtime Completion

All persistence goes through DB-backed same-origin review memory routes:

- `POST /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records/[review_record_id]`
- `GET /api/research-candidate-review/review-records/[review_record_id]/activity`
- `POST /api/research-candidate-review/review-records/[review_record_id]/activity`
- `POST /api/research-candidate-review/review-records/[review_record_id]/discard`

The UI does not directly write DB. The UI does not directly write files. DB path
validation, same-origin validation, schema creation on writes, bounded errors,
and storage behavior remain route/store responsibilities.

## UI Surfaces

The active page is:

- `app/research-candidate/review-memory/page.tsx`

The DB-backed panel is:

- `components/research-candidate-review-memory-db-panel.tsx`

The panel supports:

- save review record
- list review records
- open review record detail
- view source refs and candidate refs
- add reviewer note summary through activity append
- view activity history
- discard with reason
- view UI, route, and store authority boundary
- display bounded route/store status and error codes
- copy a public-safe review packet for human review

Review action fields include defer, reject, request more evidence, duplicate,
and superseded style action values when supported by the DB store contract.

## DB Route Binding Policy

The DB-backed route prefix is the primary persistence path:

- `/api/research-candidate-review/review-records`

The legacy JSON route is not the primary persistence path:

- `/api/research-candidate/review-memory`

The UI uses same-origin relative fetch calls from explicit operator actions. It
does not write on page load, does not background poll, and does not use browser
storage for durable state.

## DB Path Policy

The default DB path is:

- `.tmp/research-candidate-review-memory/ui/review-memory.sqlite`

The UI only sends relative DB paths under:

- `tmp/research-candidate-review-memory/`
- `.tmp/research-candidate-review-memory/`

The path must end with `.sqlite` or `.db`. The UI blocks absolute paths, parent
directory traversal, URL-like paths, backslashes, null bytes, token-like values,
and private/raw markers before making route calls. The UI must not expose private
local paths and must not echo unsafe DB paths from failed responses.

The DB path field is labeled as a local/dev review memory DB path. It is not
product storage.

## Explicit Operator Action Policy

Writes happen only when the operator clicks or submits an explicit action:

- save review record
- add reviewer note summary
- discard with reason

List, detail, and activity reads happen only from explicit load/open actions.
Client state is ephemeral React state and is not durable Perspective state.

## Error Display Policy

The UI displays bounded error codes, not raw stack traces or raw rejected
payloads. Expected bounded codes include:

- `same_origin_required`
- `invalid_db_path`
- `db_missing`
- `schema_missing`
- `blocked_private_or_raw_payload`
- `blocked_forbidden_authority`
- `conflict_existing_record`
- `not_found`

Unsafe payload values are not echoed in route responses or UI fallback errors.

## Forbidden UI Controls

The DB-backed Review Memory UI does not add controls for promotion, proof,
evidence, work item creation, Codex execution, product writing, product creation,
product ID allocation, GitHub PR creation, or Git commit.

## Authority Boundary

Allowed true fields:

- `review_memory_db_ui_now`
- `db_backed_review_memory_routes_primary`
- `explicit_operator_ui_action_only`
- `same_origin_route_calls_only`
- `review_record_save_ui_now`
- `review_record_list_ui_now`
- `review_record_detail_ui_now`
- `review_record_activity_ui_now`
- `review_record_discard_ui_now`

Forbidden false fields:

- `direct_db_access_from_ui_now`
- `direct_file_write_from_ui_now`
- `legacy_json_route_primary_persistence_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `work_item_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `product_persistence_now`
- `git_ledger_export_runtime_now`
- `git_write_now`
- `github_api_call_now`
- `github_pr_create_now`
- `github_merge_now`
- `repository_file_write_now`
- `local_file_export_now`
- `local_file_import_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `review_memory_is_truth`
- `review_memory_is_proof`
- `review_memory_is_accepted_evidence`
- `review_memory_is_durable_perspective_state`
- `candidate_is_fact`
- `candidate_is_proof`
- `source_ref_is_proof`
- `discard_is_delete`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

`fixtures/research-candidate-review.memory-db-ui-runtime.sample.v0.1.json`
contains public-safe symbolic refs only. It uses allowlisted relative DB paths
and route/action examples for save, list, detail, activity append, and discard.

Safe marker placeholders may appear only inside blocked/error examples. The
fixture must not include real secrets, real provider IDs, real connector IDs,
real uploaded-file IDs, private URLs, local paths, raw source bodies, raw
provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, real GitHub payloads, real PR payloads, raw diffs,
or real terminal logs.

## Verification Expectations

Expected verification:

- `node --check scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs`
- `npm run smoke:research-candidate-review-memory-db-ui-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-ui-v0-1`
- downstream authority, privacy, formal invariant, calibration, product-write,
  typecheck, diff, and release-readiness smokes

Browser validation is expected when browser tooling is available. It should
verify that the UI loads, the 390px viewport has no horizontal overflow, user
actions call only the DB-backed review memory route path, forbidden controls are
absent, and bounded errors are displayed.

## Explicit Non-Goals

This slice does not add UI beyond the DB-backed review memory operator panel.
This slice does not directly write DB.
This slice does not directly write files.
This slice does not call providers.
This slice does not send prompts.
This slice does not fetch sources.
This slice does not execute retrieval/RAG.
This slice does not create proof/evidence.
This slice does not write claim/evidence records.
This slice does not create work items.
This slice does not promote Perspective.
This slice does not write/apply durable Perspective state.
This slice does not write Formation Receipts.
This slice does not execute Git Ledger export runtime.
This slice does not execute Git or call GitHub.
This slice does not execute Codex.
This slice does not export/import files.
This slice does not product-write.
This slice does not allocate product IDs.

Product-write remains parked by #686.
Review memory is not truth.
Review memory is not proof.
Review memory is not accepted evidence.
Review memory is not durable Perspective state.
Candidate refs are not facts.
Source refs are lineage pointers, not proof.
Discard is lifecycle transition, not delete.
Smoke/CI pass is not truth.

## Deferred Work

Follow-up foundation/lifecycle/review memory consolidated UI should use this
DB-backed UI or route binding. Broader source intake, provider extraction,
retrieval/RAG, human-reviewed promotion, Formation Receipt durable write,
durable Perspective state apply, Git Ledger export, and product-write remain
deferred.
