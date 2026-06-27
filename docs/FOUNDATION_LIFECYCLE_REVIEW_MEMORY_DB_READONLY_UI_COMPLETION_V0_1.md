# Foundation/Lifecycle/Review Memory DB Readonly UI Completion v0.1

## Purpose

This slice implements
`foundation_lifecycle_review_memory_db_readonly_ui_completion_v0_1`.

This slice closes the original Phase 2.5 read-only UI gap by binding review
memory visibility to DB-backed GET routes. The earlier read-only UI remains
useful orientation but did not include DB-backed review memory reads.

This UI is read-only. Read-only means no mutation, not no runtime data.

## Relationship To The Integrated Roadmap

`docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` calls for Phase 2.5
to show Foundation completion summary, rail status matrix, runtime readiness
matrix, forbidden capability matrix, product-write parked status, next runtime
slice pointer, lifecycle summary, review records list/detail, operator decision
queue, and known warnings/skipped checks while preserving layer separation.

The roadmap guide is not SSOT. This document records the implemented DB-backed
read-only UI completion and its authority boundary.

## Relationship To Earlier Read-only UI

The earlier Foundation/Lifecycle/Review Memory read-only UI v0.1 displayed
orientation and fixture-backed review-memory summaries. It used the legacy JSON
route only as an optional GET source.

This completion leaves that legacy client available for compatibility but binds
the active page to a DB-backed read-only panel.

## Relationship To DB Store/Routes/UI Runtime Completions

This completion follows the Review Memory DB Store, DB Routes, and DB UI runtime
completions. It reads the same bounded review memory records through same-origin
GET routes and does not use write routes.

The primary review-memory source is:

- `GET /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records/[review_record_id]`
- `GET /api/research-candidate-review/review-records/[review_record_id]/activity`

The legacy JSON route is not the primary review-memory source:

- `/api/research-candidate/review-memory`

## Read-only UI Surfaces

The active page is:

- `app/research-candidate/foundation-lifecycle-review-memory/page.tsx`

The DB-backed read-only panel is:

- `components/foundation-lifecycle-review-memory-db-readonly-panel.tsx`

The panel renders:

- Foundation completion summary
- Rail status matrix
- Runtime readiness matrix
- Forbidden capability matrix
- Product-write parked status
- Next runtime slice pointer
- Lifecycle summary
- Review records list/detail
- Activity history
- Operator decision queue
- Known warnings/skipped checks
- Authority boundary

## DB-backed GET Route Binding Policy

The UI calls only same-origin DB-backed GET routes for review memory visibility.
This UI does not call POST routes. This UI does not create, update, discard, or
supersede review records.

The UI does not directly write DB. The UI does not directly write files. GET
routes do not create DB files or schema. Route error codes are bounded.

## DB Path Policy

The default DB path is:

- `.tmp/research-candidate-review-memory/ui/review-memory.sqlite`

Allowed DB paths are relative paths under:

- `tmp/research-candidate-review-memory/`
- `.tmp/research-candidate-review-memory/`

Paths must end with `.sqlite` or `.db`. The UI blocks absolute paths, parent
directory traversal, URLs, backslashes, null bytes, token-like values, and
private/raw markers. The UI must not expose private local paths and must not
echo unsafe DB paths from failed responses.

## Layer Separation Policy

Foundation status is orientation, not runtime completion.
Lifecycle is next review cue, not execution authority.
Review memory is explicit user-action record, not truth, proof, accepted
evidence, or durable Perspective state.
DB-backed review memory is not durable Perspective state.
Candidate refs are not facts.
Source refs are lineage pointers, not proof.
Smoke/CI pass is not truth.

None of the read-only views can promote, write, prove, create work items, or
product-write.

## Error Display Policy

The UI displays bounded route error codes only. Expected codes include:

- `invalid_db_path`
- `db_missing`
- `schema_missing`
- `blocked_private_or_raw_payload`
- `blocked_forbidden_authority`
- `not_found`
- `same_origin_required`

The UI does not display raw stack traces, raw rejected payloads, unsafe DB
paths, raw provider output, raw source bodies, raw conversations, raw DB rows,
hidden reasoning, private URLs, local paths, or token-like values.

## Forbidden Controls

This read-only surface does not include controls for review memory creation,
reviewer note append, update, discard, supersede, promotion, proof creation,
evidence creation, work item creation, Codex execution, product writing, product
creation, product ID allocation, GitHub PR creation, or Git commit.

## Authority Boundary

Allowed true fields:

- `foundation_lifecycle_review_memory_db_readonly_ui_now`
- `readonly_ui_only`
- `db_backed_review_memory_get_routes_primary`
- `same_origin_route_calls_only`
- `foundation_status_orientation_now`
- `lifecycle_summary_review_cue_now`
- `review_memory_record_read_now`
- `review_memory_activity_read_now`
- `product_write_parked_status_visible`

Forbidden false fields:

- `review_memory_write_ui_now`
- `review_memory_discard_ui_now`
- `direct_db_access_from_ui_now`
- `direct_file_write_from_ui_now`
- `legacy_json_route_primary_persistence_now`
- `post_route_call_now`
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
- `foundation_status_is_runtime_completion`
- `lifecycle_cue_is_execution_authority`
- `review_memory_is_truth`
- `review_memory_is_proof`
- `review_memory_is_accepted_evidence`
- `review_memory_is_durable_perspective_state`
- `candidate_is_fact`
- `candidate_is_proof`
- `source_ref_is_proof`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

`fixtures/foundation-lifecycle-review-memory.db-readonly-ui-completion.sample.v0.1.json`
contains public-safe symbolic refs only. It uses allowlisted relative DB paths
and GET-only examples for list, detail, and activity reads.

Safe placeholders may appear only inside blocked/error examples. The fixture
must not include real secrets, real provider IDs, real connector IDs, real
uploaded-file IDs, private URLs, local paths, raw source bodies, raw provider
outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, real GitHub payloads, real PR payloads, raw diffs,
or real terminal logs.

## Verification Expectations

Expected verification:

- `node --check scripts/smoke-foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1.mjs`
- `npm run smoke:foundation-lifecycle-review-memory-db-readonly-ui-completion-v0-1`
- `npm run smoke:research-candidate-review-memory-db-ui-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-db-routes-runtime-v0-1`
- `npm run smoke:research-candidate-review-memory-db-store-runtime-v0-1`
- `npm run smoke:foundation-lifecycle-review-memory-readonly-ui-v0-1`
- `npm run smoke:research-candidate-review-memory-ui-v0-1`
- downstream authority, privacy, invariant, calibration, product-write,
  typecheck, diff, and release-readiness smokes

Browser validation is expected when tooling is available. It should verify that
the UI loads, a 390px viewport has no horizontal overflow, DB path/default
appears, list/detail/activity actions trigger only DB-backed GET review-memory
routes, no POST request is triggered, no legacy JSON route is used as the
primary review-memory source, forbidden controls are absent, and bounded errors
are displayed.

## Explicit Non-Goals

This UI does not call POST routes.
This UI does not create, update, discard, or supersede review records.
This UI does not directly write DB.
This UI does not directly write files.
This UI does not call providers.
This UI does not send prompts.
This UI does not fetch sources.
This UI does not execute retrieval/RAG.
This UI does not create proof/evidence.
This UI does not write claim/evidence records.
This UI does not create work items.
This UI does not promote Perspective.
This UI does not write/apply durable Perspective state.
This UI does not write Formation Receipts.
This UI does not execute Git Ledger export runtime.
This UI does not execute Git or call GitHub.
This UI does not execute Codex.
This UI does not export/import files.
This UI does not product-write.
This UI does not allocate product IDs.

Product-write remains parked by #686.
Foundation status is orientation, not runtime completion.
Lifecycle is next review cue, not execution authority.
Review memory is explicit user-action record, not truth/proof/accepted
evidence/durable state.
Candidate refs are not facts.
Source refs are lineage pointers, not proof.
Smoke/CI pass is not truth.
The roadmap guide is not SSOT.

## Deferred Work

Source intake, provider extraction, retrieval/RAG, human-reviewed promotion,
Formation Receipt durable write, durable Perspective state apply, Git Ledger
export, product-write reentry, and any write-capable consolidated UI remain
deferred.
