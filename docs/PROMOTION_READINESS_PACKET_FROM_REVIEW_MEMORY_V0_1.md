# Promotion Readiness Packet From Review Memory v0.1

## Purpose

This slice implements `promotion_readiness_packet_from_review_memory_v0_1`.

It builds bounded, read-only promotion readiness packets from existing Review
Memory DB records for operator review. It especially supports final answer
candidate Review Memory records created by
`final_rag_answer_candidate_review_memory_binding_v0_1`.

This packet is diagnostic only.

It is not promotion execution, not a promotion decision, not proof, not
evidence, not accepted evidence, not a Formation Receipt, not durable
Perspective state, and not product-write authority.

## Relationship to v0.6 Audit

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md` classified
`promotion_readiness_packet_from_review_memory_v0_1` as a possible future slice
only if separately approved.

This slice is that separate explicit approval, limited to a bounded readiness
packet from existing Review Memory records.

## Runtime Route

The route is:

- `POST /api/perspective/promotion/readiness-packet`

Route policy:

- same-origin POST only
- explicit operator packet-build action only
- JSON object body only
- route version, scope, and input are required
- reads from caller-selected Review Memory DB path only
- opens the Review Memory DB read-only with file-must-exist behavior
- does not create directories
- does not create DB files
- does not ensure schema
- does not write DB rows
- has no GET packet execution route

## Review Memory Source

The runtime uses existing Review Memory DB read/store helpers and route path
conventions. It reads an existing review record and, when requested, bounded
activity history.

A Review Memory record can be treated as a final answer candidate Review Memory
record when at least one public-safe marker is present:

- `record_kind === candidate_review_snapshot`
- `candidate_refs` includes a ref beginning with `final-rag-answer-candidate:`
- `reason_codes` includes
  `final_rag_answer_candidate_review_memory_binding_v0_1`
- `boundary_acknowledgements` includes `final_answer_candidate_not_truth`
- `boundary_acknowledgements` includes `review_memory_not_truth`

The runtime does not require every marker at once. Required policy fields can
still block or degrade readiness.

## Readiness States

Allowed readiness states are:

- `ready_for_operator_promotion_review`
- `needs_more_evidence`
- `blocked_missing_review_record`
- `blocked_missing_source_refs`
- `blocked_missing_candidate_refs`
- `blocked_boundary_acknowledgements`
- `blocked_private_or_raw_payload`
- `blocked_forbidden_authority`
- `db_missing`
- `schema_missing`
- `not_found`
- `rejected`

`ready_for_operator_promotion_review` means only that the bounded packet is
ready for a human to review for a future separately approved promotion decision.
It does not execute promotion and does not satisfy promotion requirements by
itself.

## Forbidden Runtime Behavior

This slice does not:

- execute promotion
- write promotion decision records
- use or write the promotion decision store
- add promotion decision routes
- add promotion decision UI
- create proof/evidence
- write claim/evidence records
- write Formation Receipts
- write or apply durable Perspective state
- product-write
- write accepted evidence refs
- allocate product IDs
- generate final answers
- call providers
- send prompts
- execute retrieval
- fetch sources
- write retrieval indexes
- execute Git/GitHub/release work
- write Review Memory

It does not write promotion decision records. It does not use or write the
promotion decision store. It does not create proof/evidence. It does not write
claim/evidence records. It does not write Formation Receipts. It does not
write or apply durable Perspective state. It does not product-write. It does
not write accepted evidence refs. It does not allocate product IDs. It does not
generate final answers. It does not call providers. It does not send prompts.
It does not execute retrieval. It does not fetch sources. It does not write
retrieval indexes.

Review Memory is not truth. Review Memory is not proof. Review Memory is not
accepted evidence. Review Memory is not durable Perspective state. Final
answer candidate remains candidate-only. Source refs are lineage pointers, not
proof. Readiness packet is diagnostic, not authority. Operator must separately
decide any future promotion. Smoke/CI pass is not truth.

`lib/perspective/promotion/promotion-decision-store.ts` remains a boundary
reference only for this slice and is not imported by the readiness runtime.

## Validation Order

The runtime validates in this order:

1. same-origin route boundary
2. JSON route envelope
3. payload shape
4. forbidden authority fields
5. private/raw/secret-like keys and values
6. readiness policy and request identity
7. Review Memory DB path
8. DB existence and read-only open
9. Review Memory schema existence
10. Review Memory record read
11. bounded readiness packet construction

Invalid, forbidden, private/raw, missing-prerequisite, missing-DB, and
schema-missing attempts do not create Review Memory DB files, directories, or
schemas.

## Authority Boundary

Allowed true fields:

- `promotion_readiness_packet_from_review_memory_now`
- `explicit_operator_readiness_packet_only`
- `same_origin_post_route_now`
- `read_only_review_memory_db_query_now`
- `review_memory_record_read_now`
- `bounded_readiness_packet_now`
- `gate_report_diagnostic_now`
- `source_refs_lineage_only`
- `final_answer_candidate_input_supported`
- `no_truth_language_required`
- `no_proof_language_required`

Forbidden fields remain false:

- `promotion_execution_now`
- `promotion_decision_record_write_now`
- `promotion_decision_store_write_now`
- `promotion_route_write_now`
- `promotion_decision_ui_now`
- `formation_receipt_write_now`
- `durable_state_write_now`
- `durable_state_apply_now`
- `proof_or_evidence_record_now`
- `claim_or_evidence_write_now`
- `accepted_evidence_ref_write_now`
- `product_write_now`
- `product_write_runtime_now`
- `product_write_adapter_enabled_now`
- `product_id_allocation_now`
- `broad_product_persistence_now`
- `product_persistence_now`
- `final_answer_generation_now`
- `provider_openai_call_now`
- `prompt_sent_now`
- `retrieval_execution_now`
- `source_fetch_now`
- `retrieval_index_write_now`
- `embedding_created_now`
- `vector_search_now`
- `review_memory_write_now`
- `review_record_create_now`
- `review_record_activity_write_now`
- `review_record_discard_now`
- `git_write_now`
- `github_api_call_now`
- `repository_file_write_now`
- `release_execution_now`
- `codex_execution_now`
- `codex_execution_authority`
- `github_automation_authority`
- `product_write_authority`
- `readiness_packet_is_promotion`
- `readiness_packet_is_proof`
- `readiness_packet_is_evidence`
- `readiness_packet_is_accepted_evidence`
- `readiness_packet_is_durable_state`
- `readiness_packet_is_product`
- `review_memory_is_truth`
- `review_memory_is_proof`
- `review_memory_is_accepted_evidence`
- `review_memory_is_durable_perspective_state`
- `final_answer_candidate_is_truth`
- `final_answer_candidate_is_proof`
- `source_ref_is_proof`
- `smoke_pass_is_truth`
- `ci_pass_is_truth`

Forbidden authority validation is fail-closed. Only absent, `false`, `null`,
and `undefined` are allowed for forbidden authority fields.

Raw/private stored or included policy flags are fail-closed too. Keys such as
`raw_prompt_stored_now`, `raw_provider_output_stored_now`,
`raw_retrieval_output_stored_now`, `raw_source_body_stored_now`,
`hidden_reasoning_stored_now`, `raw_provider_output_included`,
`raw_retrieval_output_included`, `raw_source_body_included`,
`raw_candidate_payload_included`, `raw_conversation_included`,
`raw_db_rows_included`, `hidden_reasoning_included`, and
`provider_thread_run_session_ids_included` are allowed only when absent,
`false`, `null`, or `undefined`. Non-false values for these raw/private
stored/included flags are blocked as forbidden authority drift.

## Privacy and Redaction

The runtime blocks private/raw/secret-like material in keys and values,
including raw prompt, raw provider output, raw retrieval output, raw source
body, raw candidate payload, raw DB row, raw conversation, hidden reasoning,
chain-of-thought, telemetry dump, raw diff, terminal log, browser dump, GitHub
payload, provider thread/run/session IDs, connector IDs, uploaded-file IDs,
secrets, tokens, API keys, passwords, private keys, private URLs, local private
paths, real provider IDs, real product IDs, and raw DB rows.

Route responses and audit events must not echo unsafe payloads, raw DB rows, or
unsafe DB paths.

## Audit Behavior

Optional bounded runtime audit events use the surface
`promotion_readiness_packet_from_review_memory_runtime`.

Missing, invalid, or failing audit DB writes do not fail the primary route.
Audit events are bounded summaries only and are not truth, proof, promotion,
approval, durable state, product authority, or product-write authority.

## Evidence Refs

- `docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md`
- `docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md`
- `docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md`
- `docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md`
- `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md`
- `docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md`
- `docs/PERSPECTIVE_PROMOTION_RUNTIME_V0_1.md`
- `types/perspective-promotion-runtime-contract.ts`
- `lib/perspective/promotion/promotion-decision-store.ts`

## Verification

Primary smoke:

- `npm run smoke:promotion-readiness-packet-from-review-memory-v0-1`

The smoke creates a temporary Review Memory DB as test setup only. The route
under test opens that DB read-only and does not create DB files, directories, or
schemas.
