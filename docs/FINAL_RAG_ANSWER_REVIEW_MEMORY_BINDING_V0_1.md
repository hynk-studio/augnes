# Final RAG Answer Review Memory Binding v0.1

## Purpose

This slice implements `final_rag_answer_candidate_review_memory_binding_v0_1`.

This is the explicitly approved final RAG answer candidate Review Memory
binding slice only. It writes bounded Review Memory DB records from already
generated final RAG answer candidates.

This is Review Memory binding only.

It does not generate final answers.

It does not call providers.

It does not send prompts.

It does not execute retrieval.

It does not fetch sources.

It does not create proof/evidence.

It does not write claim/evidence records.

It does not promote Perspective.

It does not write/apply durable Perspective state.

It does not write Formation Receipts.

It does not product-write.

It does not write accepted evidence refs.

It does not allocate product IDs.

It does not enable product-write adapter.

It does not execute Git/GitHub/release work.

## Relationship to v0.4 Remaining Gap Audit

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md` kept Review Memory writes
approval-gated unless separately approved. This slice consumes that separate
explicit approval only for binding already generated bounded final RAG answer
candidates into bounded Review Memory DB records for operator review.

The v0.4 audit remains correct that proof/evidence creation, claim/evidence
writes outside Review Memory, promotion, durable Perspective state
write/apply, Formation Receipt writes, product-write, accepted evidence ref
write, product ID allocation, product-write adapter enablement, broad product
persistence, GitHub actuation, release execution, live provider validation,
source fetching, retrieval index writes, background jobs, and automatic
answer-to-product conversion remain gated or deferred.

## Runtime Scope

Implemented files:

- `types/final-rag-answer-review-memory-binding.ts`
- `lib/research-retrieval/final-rag-answer-review-memory-binding.ts`
- `app/api/research-retrieval/final-rag-answer/review-memory/route.ts`
- `fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json`
- `scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs`

The route is:

- `POST /api/research-retrieval/final-rag-answer/review-memory`

The route is same-origin POST only. There is no GET route.

## Input Boundary

The route accepts a JSON object with route version, `scope: project:augnes`,
`input`, and optional `audit_db_path`.

The binding input contains:

- request/runtime/scope markers
- binding request metadata
- caller-selected Review Memory DB path
- already generated bounded final answer candidate result
- explicit operator review payload
- stable idempotency key
- authority boundary
- reason codes

The final answer candidate result must already be candidate-only and bounded.
It must have `status: final_answer_candidate_created`,
`answer_review_state: candidate_only`, a non-empty `answer_candidate_ref`, at
least one public-safe cited source ref, and the #844 non-authority claims:
not truth, not proof, not accepted evidence, not promotion, and not
product-write.

The binding rejects missing candidate refs, missing/unsafe cited source refs,
citation notes whose source refs are not in `cited_source_refs`, any proof or
evidence flag, any promotion flag, any durable-state flag, any Formation
Receipt write flag, any product-write flag, any product ID allocation flag,
any DB/retrieval/source/Git/GitHub/release execution flag, and unsafe private
or raw keys/values.

## Validation Order

Validation order is:

1. route/same-origin validation
2. payload shape validation
3. forbidden authority validation
4. private/raw/secret-like key and value validation
5. final answer candidate result validation
6. operator review payload validation
7. idempotency key validation
8. DB path validation
9. Review Memory DB open/schema ensure/write

Invalid, forbidden, private/raw, or missing-prerequisite payloads do not create
the Review Memory DB file or directory. Schema ensure happens only after
preflight passes.

## Review Memory Mapping

The binding uses the existing Review Memory DB store helper:
`createResearchCandidateReviewRecordV01`.

The Review Memory record uses:

- `record_kind: candidate_review_snapshot`
- `lifecycle_state: active`, or `discarded` when the operator decision is
  `discard`
- `candidate_ref` from the final answer candidate ref
- `candidate_refs` from answer candidate ref, answer request ref, and RAG
  context preview ref
- public-safe source refs from `cited_source_refs`
- bounded summary with answer candidate ref, answer request ref, RAG context
  preview ref, a capped answer excerpt, and a candidate-only warning
- boundary acknowledgements that final answer candidate and Review Memory are
  not truth, proof, accepted evidence, promotion, durable state, product, or
  product-write authority
- privacy report with no raw conversation, hidden reasoning, raw source body,
  raw candidate payload, raw provider output, provider thread/run/session IDs,
  private URLs, local private paths, secrets, raw DB rows, or browser dumps

Same idempotency key and same normalized payload replays idempotently through
the existing store. Same idempotency key with materially different payload
returns a bounded conflict.

## Authority Boundary

Allowed true fields are:

- `final_rag_answer_review_memory_binding_now`
- `explicit_operator_review_memory_binding_only`
- `same_origin_post_route_now`
- `caller_injected_review_memory_db_only`
- `db_query_or_write_now`
- `review_memory_db_store_now`
- `review_record_persistence_now`
- `review_record_activity_persistence_now`
- `final_answer_candidate_input_required`
- `answer_review_state_candidate_only_required`
- `bounded_review_memory_snapshot_now`
- `source_refs_lineage_only`
- `no_truth_language_required`
- `no_proof_language_required`

Forbidden authority fields must remain false. Only absent, false, null, and
undefined are false-like. True, non-empty strings, numbers, arrays, objects,
enabled-like values, and future authority-like keys with non-false values are
blocked.

Review Memory is not truth.

Review Memory is not proof.

Review Memory is not accepted evidence.

Review Memory is not durable Perspective state.

Final answer candidate remains candidate-only.

Source refs are lineage pointers, not proof.

Operator review note is review memory, not authority for promotion or
product-write.

Smoke/CI pass is not truth.

## Privacy and Redaction

The runtime blocks private/raw/secret-like material in keys and values,
including raw prompt, raw provider output, raw retrieval output, raw source
body, raw candidate payload, raw DB row, raw conversation, hidden reasoning,
chain-of-thought, telemetry dump, raw diff, terminal log, browser dump, GitHub
payload, provider thread/run/session IDs, connector IDs, uploaded-file IDs,
secrets, tokens, API keys, passwords, private keys, private URLs, local private
paths, real provider IDs, real product IDs, and raw DB rows.

Route responses and audit events must not echo unsafe payloads.

## Audit Behavior

Audit event emission is optional and bounded through
`maybeWriteRuntimeRouteAuditEventV01`.

Missing `audit_db_path` does not fail the primary route.

Invalid `audit_db_path` does not fail the primary route.

Audit write failure does not fail the primary route.

Final answer Review Memory binding route audit events use the
`final_rag_answer_review_memory_binding_runtime` event surface.

Audit event is not truth, proof, approval, durable state, product, or
product-write authority.

## Verification Expectations

`npm run smoke:final-rag-answer-review-memory-binding-v0-1` verifies route,
type, helper, fixture, package script, latest index pointer, v0.4 audit
reference, final RAG candidate reference, Review Memory DB store/route
references, same-origin POST boundary, no GET route, valid Review Memory record
creation, idempotent replay, conflict on material payload drift, DB-free
preflight, forbidden authority blocking, private/raw key blocking, bounded
audit behavior, public-safe fixture policy, no unsafe echo, no provider/prompt
retrieval/source/retrieval-index/proof/promotion/durable-state/Formation
Receipt/product-write/accepted-evidence/product-ID/Git/GitHub/release
execution, and no smoke-derived or CI-derived truth claim.
