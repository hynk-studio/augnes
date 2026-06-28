# Final Answer Candidate Review UI Binding v0.1

## Purpose

This slice implements `final_answer_candidate_review_ui_binding_v0_1`.

It adds a read/display-only operator UI for bounded Review Memory records that
were created by `final_rag_answer_candidate_review_memory_binding_v0_1`.

The UI helps an operator inspect final answer candidate Review Memory records,
candidate refs, source refs, bounded summaries, reviewer note summaries,
lifecycle/review decision state, activity history, boundary acknowledgements,
and non-authority notes.

This UI is read/display only.

This UI does not create, modify, discard, promote, product-write, or write
accepted evidence refs.

## Relationship to PR #846 Review Memory Binding

PR #846 completed
`final_rag_answer_candidate_review_memory_binding_v0_1` as bounded Review
Memory DB record creation from already generated final answer candidates under
explicit operator action.

This UI consumes only records already present in the Review Memory DB. It does
not call the #846 binding POST route and does not write Review Memory.

The #846 references remain:

- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md`
- `fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json`
- `scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs`
- `app/api/research-retrieval/final-rag-answer/review-memory/route.ts`
- `lib/research-retrieval/final-rag-answer-review-memory-binding.ts`
- `types/final-rag-answer-review-memory-binding.ts`

## Relationship to v0.5 Audit

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md` confirmed #846 as bounded
Review Memory binding only and kept UI binding not implemented unless
separately approved.

This slice is that separate approval only for read/display UI binding. It does
not alter v0.5 audit classifications beyond this new UI surface.

## UI Route and Component

The page route is:

- `app/research-retrieval/final-rag-answer/review-memory/page.tsx`

The client component is:

- `components/final-rag-answer-review-memory-panel.tsx`

The UI renders under:

- `/research-retrieval/final-rag-answer/review-memory`

Existing Review Memory UI and route references:

- `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_UI_RUNTIME_COMPLETION_V0_1.md`
- `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md`
- `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md`
- `lib/research-candidate-review/review-memory-db-route-contract.ts`

## Route Usage

The UI uses only existing Review Memory DB GET routes:

- `GET /api/research-candidate-review/review-records`
- `GET /api/research-candidate-review/review-records/[review_record_id]`
- `GET /api/research-candidate-review/review-records/[review_record_id]/activity`

The UI does not call:

- `POST /api/research-candidate-review/review-records`
- `POST /api/research-candidate-review/review-records/[review_record_id]/activity`
- `POST /api/research-candidate-review/review-records/[review_record_id]/discard`
- `POST /api/research-retrieval/final-rag-answer`
- `POST /api/research-retrieval/final-rag-answer/review-memory`
- any product-write route
- any provider route
- any retrieval rebuild/search route
- any Git/GitHub/release route

## Read/Display Policy

Allowed UI actions:

- edit a local/dev Review Memory DB path field
- list matching final answer candidate Review Memory records
- filter by candidate ref or source ref
- open a selected review record
- load activity history for a selected record
- copy a bounded read-only review packet to clipboard
- display non-authority boundary notes
- display bounded route/status/error codes

The UI has no write buttons, create form, discard form, append activity form,
product-write controls, accepted evidence ref write controls, promotion
controls, Formation Receipt controls, proof/evidence controls, provider
controls, prompt box, source fetch controls, retrieval execution controls, or
Git/GitHub/release controls.

The UI does not auto-load from a private DB path. It reads only after explicit
operator click actions.

The UI does not use `localStorage`, `sessionStorage`, cookies, direct DB
imports, direct filesystem writes, or raw JSON blob rendering.

## Filtering Policy

The UI treats records as final answer candidate Review Memory records when any
public-safe marker is present:

- `record_kind === candidate_review_snapshot`
- `candidate_refs` includes a ref beginning with `final-rag-answer-candidate:`
- `reason_codes` includes
  `final_rag_answer_candidate_review_memory_binding_v0_1`
- `boundary_acknowledgements` includes `final_answer_candidate_not_truth`
- `boundary_acknowledgements` includes `review_memory_not_truth`

The UI does not require all markers at once, because existing stored records
may vary. It displays a bounded final answer candidate review memory badge only
when at least one marker is present.

## DB Path Policy

The UI uses the same Review Memory DB route path policy for local/dev paths:

- `tmp/research-candidate-review-memory/`
- `.tmp/research-candidate-review-memory/`

The DB path must end with `.sqlite` or `.db`.

The UI blocks invalid DB paths before fetch. It rejects absolute paths,
parent traversal, backslashes, null bytes, URLs, private/local user paths,
token/secret-like paths, and unsafe/private/raw markers.

Invalid DB path status is bounded as `invalid_db_path` and does not echo the
raw invalid path.

## Display Policy

The UI displays safe projections only:

- `review_record_id`
- `record_kind`
- `lifecycle_state`
- `review_decision`
- `review_action`
- `reviewer_actor`
- bounded summary excerpt
- reviewer note summary excerpt
- candidate refs
- source refs
- boundary acknowledgements
- reason codes
- activity summaries
- route status/error code
- non-authority boundary notes

Long bounded summaries, reviewer note summaries, activity summaries, reason
codes, candidate refs, and source refs are truncated before display.

The UI does not display route response bodies wholesale and does not render raw
JSON blobs directly.

## Privacy and Redaction

The UI blocks private/raw/secret-like material in DB path input, filters,
copied packets, and displayed text. Blocked material includes raw prompt,
raw provider output, raw retrieval output, raw source body, raw candidate
payload, raw DB row, raw conversation, hidden reasoning, chain-of-thought,
telemetry dump, raw diff, terminal log, browser dump, GitHub payload,
provider thread/run/session IDs, connector IDs, uploaded-file IDs, secrets,
tokens, API keys, passwords, private keys, private URLs, local private paths,
real provider IDs, real product IDs, and raw DB rows.

Unsafe display text is replaced with a bounded blocked marker instead of being
echoed.

## Authority Boundary

Allowed true fields:

- `final_answer_candidate_review_ui_binding_now`
- `read_display_only_ui_now`
- `explicit_operator_read_action_only`
- `same_origin_get_route_calls_only`
- `db_backed_review_memory_routes_primary`
- `review_memory_db_read_now`
- `final_answer_candidate_review_memory_display_now`
- `bounded_review_memory_record_display_now`
- `bounded_activity_display_now`
- `source_refs_lineage_only`
- `no_truth_language_required`
- `no_proof_language_required`

Forbidden fields remain false:

- `post_route_call_now`
- `review_memory_write_now`
- `review_record_create_now`
- `review_record_activity_write_now`
- `review_record_discard_now`
- `final_answer_generation_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `retrieval_index_write_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `promotion_execution_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `formation_receipt_write_now`
- `product_write_now`
- `accepted_evidence_ref_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `broad_product_persistence_now`
- `product_persistence_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `release_execution_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `review_memory_is_truth`
- `review_memory_is_proof`
- `review_memory_is_accepted_evidence`
- `review_memory_is_durable_perspective_state`
- `final_answer_candidate_is_truth`
- `final_answer_candidate_is_proof`
- `final_answer_candidate_is_accepted_evidence`
- `final_answer_candidate_is_promotion`
- `final_answer_candidate_is_product`
- `source_ref_is_proof`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Required UI Boundary Text

The UI states:

- Review Memory is not truth.
- Review Memory is not proof.
- Review Memory is not accepted evidence.
- Review Memory is not durable Perspective state.
- Final answer candidate remains candidate-only.
- Source refs are lineage pointers, not proof.
- Operator review note is review memory, not authority for promotion or
  product-write.
- This UI is read/display only.
- This UI does not create, modify, discard, promote, product-write, or write
  accepted evidence refs.
- Smoke/CI pass is not truth.

## Explicit Non-Capabilities

This slice does not write Review Memory.

This slice does not generate final answers.

This slice does not call providers.

This slice does not send prompts.

This slice does not execute retrieval.

This slice does not fetch sources.

This slice does not write retrieval indexes.

This slice does not create proof/evidence.

This slice does not write claim/evidence records.

This slice does not promote Perspective.

This slice does not write/apply durable Perspective state.

This slice does not write Formation Receipts.

This slice does not product-write.

This slice does not write accepted evidence refs.

This slice does not allocate product IDs.

This slice does not enable a product-write adapter.

This slice does not add broad product persistence.

This slice does not execute Git/GitHub/release work.

This slice does not perform live provider validation.

This slice does not add background jobs.

This slice does not perform automatic answer-to-product conversion.

## Fixture Policy

`fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json` is
public-safe. It uses symbolic refs and repo-relative references only.

The fixture includes a sample DB path, sample list/detail/activity responses,
expected UI projection, authority boundary, invalid DB path case,
private/raw filter blocked case, copied packet expectations, and public-safe
fixture policy.

## Verification Expectations

`npm run smoke:final-answer-candidate-review-ui-binding-v0-1` verifies docs,
fixture, package script, latest index pointer, page/component files, v0.5
audit reference, #846 Review Memory binding reference, existing Review Memory
DB UI reference, GET-only route usage, read/display-only boundary, invalid DB
path blocking, private/raw filter blocking, no write controls, no provider/
prompt/retrieval/source-fetch/Git/GitHub/release controls, public-safe fixture
projection, bounded copied packet, changed-file scope, and no smoke/CI truth
claim.
