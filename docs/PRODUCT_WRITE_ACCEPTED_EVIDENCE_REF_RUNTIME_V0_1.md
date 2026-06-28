# Product Write Accepted Evidence Ref Runtime v0.1

## Purpose

This slice implements `product_write_accepted_evidence_ref_runtime_v0_1`.

This is the first explicitly approved gated product-write minimal runtime
target only: operator-approved accepted evidence ref write records for the
`accepted_evidence_records` target group.

This does not approve broad product-write.

This does not enable a product-write adapter.

This does not allocate product IDs.

This does not persist product objects, product profiles, product publications,
or broad product state.

## Relationship to v0.2.1 Remaining Runtime Gap Audit v0.2

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_2.md` says there is no next
ungated implementation gap and that product-write runtime requires explicit
approval.

This slice consumes that explicit approval only for the first target named by
the operator: accepted evidence ref write records backed by promotion decision,
Formation Receipt, review, source, reentry, target-contract, diff, rollback or
abort, idempotency, and operator approval refs.

The roadmap guide is not SSOT.

## Runtime Scope

Implemented files:

- `types/product-write-accepted-evidence-ref.ts`
- `lib/product-write/accepted-evidence-ref-store.ts`
- `lib/product-write/accepted-evidence-ref-runtime.ts`
- `app/api/product-write/accepted-evidence-refs/route.ts`
- `fixtures/product-write-accepted-evidence-ref-runtime.sample.v0.1.json`
- `scripts/smoke-product-write-accepted-evidence-ref-runtime-v0-1.mjs`

POST and GET are same-origin bounded.

The route exposes only:

- POST bounded accepted evidence ref write attempt
- GET bounded accepted evidence ref write read/list

It does not expose broad product-write execution.

## Required Backing Refs

Every create attempt requires public-safe symbolic refs for:

- promotion decision ref
- Formation Receipt ref
- review record ref
- public-safe source refs
- accepted evidence refs
- product-write reentry review ref
- product-write target contract ref
- preview-to-write diff ref
- rollback or abort plan ref
- stable idempotency key
- explicit operator approval payload

The runtime validates existing promotion decision and Formation Receipt rows in
the caller-injected SQLite DB before writing the accepted evidence ref record.
The Formation Receipt must point to the same promotion decision, review record,
operator, and source refs.

## Validation Order

Validation order is:

1. payload validation
2. forbidden authority validation
3. private/raw/secret-like validation
4. prerequisite validation
5. DB/schema checks
6. write or idempotent replay

The runtime rejects missing promotion decision refs, missing Formation Receipt
refs, missing review record refs, missing public-safe source refs, missing
accepted evidence refs, missing operator approval, missing preview-to-write
diff refs, missing rollback or abort plan refs, missing idempotency keys,
private/raw/secret-like refs or payloads, raw source bodies, raw provider
output, raw retrieval output, raw DB rows, raw conversations, hidden reasoning,
telemetry dumps, and raw diffs.

Forbidden authority fields fail closed: only absent, false, null, and undefined
are allowed. Any present non-false-like value is rejected as
`blocked_forbidden_authority`, including true, non-empty strings, nonzero
numbers, arrays, and objects.

Product DB files and directories are not created for invalid,
forbidden-authority, private/raw, or missing-prerequisite attempts.

Product DB files and directories are not created when the lineage DB path is
missing. After route-level preflight passes, POST opens only an existing
caller-injected lineage DB; if that DB is missing the request is rejected before
the accepted evidence ref write table can be created.

The accepted evidence ref write table is created only after payload,
forbidden-authority, private/raw, prerequisite, and lineage DB validation pass.

## Idempotency

The idempotency key is stable and scoped to:

- target group `accepted_evidence_records`
- operator approval ref
- promotion decision ref
- Formation Receipt ref
- preview-to-write diff ref

The runtime helper computes:

`product-write-accepted-evidence-ref:v0.1:accepted_evidence_records:<hash>`

Same idempotency key with the same material payload replays as
`idempotent_existing`.

Same idempotency key with a materially different payload is rejected as
`conflict_existing_idempotency_key`.

## Record Semantics

Accepted evidence ref write is not proof.

Accepted evidence ref write is not truth.

Accepted evidence ref write is not durable Perspective state.

Accepted evidence ref write is not product ID allocation.

Accepted evidence ref write is not broad product persistence.

Operator approval is required but is not itself proof.

Preview-to-write diff is required but is not write approval by itself.

Source refs are lineage pointers, not proof.

Promotion decision is a prerequisite, not an automatic execution command.

Formation Receipt is a prerequisite, not product-write authority by itself.

Audit event is not truth, proof, approval, state, or product authority.

## Audit Behavior

Audit event emission is optional and bounded through
`maybeWriteRuntimeRouteAuditEventV01`.

Missing `audit_db_path` does not fail the primary route.

Audit write failure does not fail the primary route.

Audit events store bounded route status only and do not store raw request
bodies, raw response bodies, raw provider output, raw retrieval output, raw
source bodies, raw conversations, raw DB rows, telemetry dumps, hidden
reasoning, or raw diffs.

## Authority Boundary

Allowed true fields:

- `product_write_accepted_evidence_ref_runtime_now`
- `product_write_minimal_runtime_first_target_only`
- `accepted_evidence_ref_write_now` only on successful first write
- `accepted_evidence_records_target_group_only`
- `caller_injected_db_only`
- `same_origin_route_now`
- `operator_approval_required`
- `promotion_decision_required`
- `formation_receipt_required`
- `review_record_required`
- `public_safe_source_refs_required`
- `preview_to_write_diff_required`
- `rollback_or_abort_plan_required`
- `idempotency_key_required`

Forbidden false fields:

- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `broad_product_persistence_now`
- `product_persistence_now`
- `product_object_creation_now`
- `product_profile_creation_now`
- `product_publication_now`
- `product_route_beyond_accepted_evidence_refs_now`
- `product_ui_now`
- `release_execution_now`
- `release_publication_now`
- `github_actuation_now`
- `github_api_call_now`
- `git_write_now`
- `branch_creation_now`
- `commit_creation_now`
- `pull_request_creation_now`
- `repository_file_write_from_runtime_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `source_fetch_now`
- `retrieval_execution_now`
- `rag_answer_generation_now`
- `final_rag_answer_generation_now`
- `final_rag_answer_automatic_promotion_now`
- `proof_creation_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `work_item_creation_now`
- `durable_perspective_state_mutation_from_product_write_now`
- `durable_perspective_state_write_now`
- `durable_perspective_state_apply_now`
- `formation_receipt_write_now`
- `promotion_execution_now`
- `background_job_now`
- `automatic_crawling_now`
- `automatic_source_fetching_now`
- `hidden_reasoning_storage_now`
- `raw_private_data_persistence_now`
- `accepted_evidence_ref_write_is_truth`
- `accepted_evidence_ref_write_is_proof`
- `accepted_evidence_ref_write_is_durable_perspective_state`
- `accepted_evidence_ref_write_is_product_id_allocation`
- `operator_approval_is_proof`
- `preview_to_write_diff_is_write_approval`
- `source_refs_are_proof`
- `promotion_decision_is_automatic_execution_command`
- `formation_receipt_is_product_write_authority`
- `audit_event_is_truth`
- `audit_event_is_proof`
- `audit_event_is_approval`
- `audit_event_is_durable_state`
- `audit_event_is_product_authority`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority_beyond_accepted_evidence_ref_write`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

## Fixture Policy

The fixture is public-safe. It uses symbolic refs and repo-relative pointers.
It contains no secrets, private paths, private URLs, raw source bodies, raw
provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden
reasoning, telemetry dumps, raw diffs, real product objects, product IDs,
provider IDs, connector IDs, terminal logs, or GitHub payloads.

## Verification Expectations

`npm run smoke:product-write-accepted-evidence-ref-runtime-v0-1` verifies docs,
fixture, type/runtime/store/route/schema files, package/index pointers,
validation order markers, public-safe fixture boundaries, same-origin POST and
GET route shape, optional audit behavior, idempotent replay, idempotency
conflict, missing audit DB path behavior, invalid audit DB path behavior,
fail-closed forbidden authority values, no product DB creation before preflight,
no product DB creation when the lineage DB path is missing, and rejected payload
cases for missing prerequisites, forbidden authority, private/raw content, and
missing lineage schema.

Smoke/CI pass is not truth.

## Deferred Work

Still deferred:

- product ID allocation
- broad product persistence
- product object/profile creation
- product publication
- product-write adapter enablement
- final RAG answer generation
- final RAG answer automatic promotion
- proof creation
- work item creation
- durable Perspective state mutation from product-write
- provider/OpenAI calls
- prompt sending
- retrieval/RAG execution
- source fetching
- automatic product generation
- Git/GitHub/release actuation
