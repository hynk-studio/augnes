# Final RAG Answer Generation Candidate Review v0.1

## Purpose

This slice implements `final_rag_answer_generation_candidate_review_v0_1`.

This is the explicitly approved final RAG answer candidate/review slice only.
It generates bounded final RAG answer candidates for operator review from
existing DB-backed RAG context preview results.

This is not proof.

This is not truth.

This is not accepted evidence.

This is not promotion.

This is not durable Perspective state.

This is not product-write.

## Relationship to v0.3 Remaining Gap Audit

`docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_3.md` kept final RAG answer
generation approval-gated unless separately approved. This slice consumes that
separate explicit approval only for a candidate/review layer.

The v0.3 audit remains correct that product ID allocation, broad product
persistence, product-write adapter enablement, additional product-write target
groups, proof/work-item creation, durable Perspective state mutation from
product-write, GitHub actuation, release execution, provider calls without an
explicit route action, retrieval/RAG execution outside the DB-backed context
preview path, source fetching, background jobs, and automatic product
generation remain gated or deferred.

## Runtime Scope

Implemented files:

- `types/final-rag-answer-candidate-review.ts`
- `lib/research-retrieval/build-final-rag-answer-candidate.ts`
- `lib/research-retrieval/final-rag-answer-provider-boundary.ts`
- `app/api/research-retrieval/final-rag-answer/route.ts`
- `fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json`
- `scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs`

The route is:

- `POST /api/research-retrieval/final-rag-answer`

The route is same-origin POST only. There is no GET provider execution route.
There is no provider call on load, background provider call, or hidden provider
call.

## RAG Context Preview Relationship

The runtime reuses `buildRagContextPreviewRuntimeCompletionV01` and existing
DB-backed RAG context preview request validation.

The final answer generator may execute retrieval search only through the
existing DB-backed context preview runtime path. It opens the retrieval DB
read-only after preflight and requires the existing retrieval index schema.

It does not rebuild the retrieval index.

It does not write retrieval index rows.

It does not fetch sources.

It does not crawl.

It does not treat retrieval results as evidence.

It does not treat retrieval score as truth score or promotion readiness.

It does not turn context preview into accepted evidence.

It preserves source refs as lineage pointers only.

Context preview remains a review aid. Retrieval result remains non-authoritative.

## Provider Boundary

The provider adapter receives only:

- bounded prompt descriptor
- bounded context summaries
- source refs
- max answer chars
- answer style constraints
- citation policy

The provider adapter must not receive raw source bodies, raw retrieval dumps,
raw DB rows, raw conversations, hidden reasoning, terminal logs, private URLs,
local paths, secrets, raw diffs, browser/session dumps, connector IDs,
uploaded-file IDs, or provider internal thread/run/session IDs.

The deterministic `mock_provider` path is required for smoke coverage and does
not use network. The configured-provider path without an injected safe adapter
returns a bounded `provider_missing_key` refusal. Live provider validation is
optional and skipped when no safe local config exists. Do not fake live
provider validation.

Raw prompts are non-persistent. Raw provider output is non-persistent. Hidden
reasoning and chain-of-thought are not stored.

Provider cited source refs must be a subset of context-preview source refs.
The allowed citation set is built from context preview `source_ref_id` and
`source_record_ref` values only. Provider citation notes must reference
context-backed source refs only. Unbacked provider citations reject candidate
generation and do not create an answer candidate ref.

Provider output remains candidate-only. Final answer candidate requires
operator review before any future evidence, promotion, or product-write path.

## Output Semantics

Successful output is `answer_review_state: candidate_only`.

The result includes bounded answer text, bounded citation notes, retrieved
refs, cited source refs, omitted context reasons, and explicit false execution
flags for writes and actuation.

Final answer candidate is not truth.

Final answer candidate is not proof.

Final answer candidate is not accepted evidence.

Final answer candidate is not promotion readiness.

Final answer candidate is not product.

Provider output is not truth, proof, accepted evidence, promotion readiness, or
product.

## Product-Write and Durable-State Boundary

This slice does not open product-write beyond the already merged accepted
evidence ref runtime from #842.

It does not product-write.

It does not write accepted evidence refs.

It does not allocate product IDs.

It does not create proof/evidence records.

It does not write claim/evidence records.

It does not write Review Memory.

It does not promote Perspective.

It does not write durable Perspective state.

It does not mutate durable Perspective state.

It does not write Formation Receipts.

It does not execute promotion.

It does not execute GitHub actuation.

It does not execute Git writes.

It does not execute release work.

It does not execute automatic product generation or answer-to-product
conversion.

## Validation Order

Validation order is:

1. route/same-origin validation
2. payload shape validation
3. forbidden authority validation
4. private/raw/secret-like validation
5. context preview request validation
6. DB path/schema checks through the existing context preview boundary
7. provider boundary selection
8. bounded answer candidate generation or graceful refusal

Forbidden authority validation is fail-closed. Only absent, false, null, and
undefined are allowed for forbidden authority fields. True, non-empty strings,
numbers, arrays, objects, and enabled-like values are blocked.

## Privacy and Redaction

The runtime blocks private/raw/secret-like material in input, context items,
answer candidate, provider response, prompt descriptor, audit event, and
fixture.

Blocked material includes real secrets, provider keys, provider internal IDs,
connector IDs, uploaded-file IDs, private URLs, local private paths, raw source
bodies, raw provider output, raw retrieval output, raw DB rows, raw
conversations, hidden reasoning, chain-of-thought, telemetry dumps, raw diffs,
terminal logs, GitHub payloads, and browser/session dumps.

Private/raw markers are blocked in keys as well as values. Keys such as
`raw_provider_output`, `raw_retrieval_output`, `hidden_reasoning`,
`chain_of_thought`, provider internal ID keys, connector/upload keys, token
keys, API key markers, password markers, and private-key markers are rejected
even when their values look bounded.

The route response and audit event must not echo unsafe payloads.

## Audit Behavior

Audit event emission is optional and bounded through
`maybeWriteRuntimeRouteAuditEventV01`.

Missing `audit_db_path` does not fail the primary route.

Invalid `audit_db_path` does not fail the primary route.

Audit write failure does not fail the primary route.

Final answer route audit events use the
`final_rag_answer_candidate_review_runtime` event surface. The existing RAG
context preview route keeps its own `rag_context_preview_runtime` surface.

Audit events are bounded route-status records only. Audit event is not truth,
proof, approval, durable state, or product authority.

## Authority Boundary

Allowed true fields include:

- `final_rag_answer_generation_candidate_review_now`
- `explicit_operator_answer_generation_only`
- `same_origin_post_route_now`
- `db_backed_rag_context_preview_now`
- `retrieval_execution_via_context_preview_now` only when context preview
  executes search
- `bounded_prompt_descriptor_now`
- `answer_provider_adapter_boundary_now`
- `mock_answer_provider_now` only in mock provider mode
- `configured_provider_missing_key_refusal_now` only in configured missing-key
  path
- `final_answer_candidate_generated_now` only on successful candidate
  generation
- `answer_review_state_candidate_only`
- `citation_source_refs_visible`
- `no_truth_language_required`
- `no_proof_language_required`
- `raw_prompt_non_persistent`
- `raw_provider_output_non_persistent`

Forbidden capabilities remain false:

- provider call on load
- background provider call
- hidden provider call
- raw prompt storage
- raw provider output storage
- raw retrieval output storage
- raw source body storage
- hidden reasoning storage
- chain-of-thought storage
- provider thread/run/session ID canonicalization
- source fetch
- automatic crawling
- retrieval index write
- embedding creation
- vector search
- proof/evidence record creation
- claim/evidence write
- Review Memory write
- promotion execution
- durable state write/apply
- Formation Receipt write
- product-write
- accepted evidence ref write
- product-write adapter enablement
- product ID allocation
- broad product persistence
- Git/GitHub actuation
- release execution
- Codex execution

Smoke/CI pass is not truth.

## Fixture Policy

The fixture uses public-safe symbolic refs only. It includes:

- valid mock-provider answer candidate case
- configured-provider missing-key graceful refusal
- empty/no-context case
- forbidden authority cases with non-false-like values
- private/raw payload blocked case descriptor
- context preview DB missing and schema missing behavior
- invalid DB path behavior
- missing audit DB path non-failing behavior
- invalid audit DB path non-failing behavior

The fixture contains no raw prompt, raw provider output, raw retrieval output,
raw source body, raw DB rows, raw conversations, hidden reasoning, telemetry
dumps, raw diffs, terminal logs, GitHub payloads, private paths, private URLs,
secrets, product IDs, provider internal IDs, connector IDs, or uploaded-file
IDs.

## Verification Expectations

`npm run smoke:final-rag-answer-generation-candidate-review-v0-1` verifies
docs, fixture, route/type/lib files, package/index pointers, v0.3 audit
reference, RAG context preview references, provider extraction references,
product-write accepted evidence ref boundary references, same-origin POST, no
GET provider execution route, deterministic mock-provider candidate creation,
configured-provider missing-key refusal, no raw prompt or provider output
storage, no hidden reasoning or chain-of-thought storage, no provider call on
load/background/hidden path, DB missing/schema missing bounds, no retrieval
index rebuild/write, no source fetch/crawling, non-authoritative retrieval
score/result semantics, candidate-only final answer semantics, no Review
Memory/proof/evidence/claim/durable state/Formation Receipt/product-write/Git
or release writes, fail-closed forbidden authority values, audit non-failure
behavior, no unsafe echo, fixture safety, changed-file scope, and Smoke/CI pass
is not truth.
