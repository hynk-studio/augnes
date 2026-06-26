# RAG Context Preview v0.1

## 1. Purpose

RAG Context Preview is preview-only.

RAG Context Preview does not generate answers. RAG Context Preview is not a final answer. RAG Context Preview is not truth.

It builds a deterministic bounded context packet for human/operator review from caller-provided retrieval search results, bounded summaries, symbolic refs, staleness warnings, unresolved tensions, and knowledge gaps.

Context items are not evidence. Context items are not proof. Retrieval result is not evidence. Retrieval score is not truth score. Retrieval score is not promotion readiness. Bounded query summary is not query execution.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

This slice implements rag_context_preview_v0_1 from docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist. Actual field/type/enum authority for this slice is types/rag-context-preview.ts.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #779 Research Retrieval/RAG Runtime Contract

This slice follows PR #779 and preserves the Research Retrieval/RAG contract boundary.

Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs. Raw retrieval outputs must not be stored.

## 4. Relationship to PR #780 Rebuildable Retrieval Index Runtime

This slice follows PR #780 and consumes caller-provided retrieval search results or equivalent bounded input refs. It does not rebuild indexes, execute retrieval, or expand search authority.

Stale context cannot override current state.

## 5. Scope and non-goals

This slice adds a type contract, deterministic preview builder, public-safe fixture, read-only UI panel, smoke, docs, package script, and index pointer.

No prompt is sent. No provider/OpenAI call is made. No embedding is created. No vector search is executed. No source fetch is executed. No local file is read as source input. No repository file is read as source input. No uploaded file is read. No DB query/write occurs. No proof/evidence record is created. No claim/evidence record is written. No Perspective promotion occurs. No durable Perspective state mutation occurs. Product-write remains parked by #686. Git Ledger export remains deferred.

## 6. Input rules

Inputs must use public-safe symbolic refs and bounded summaries only. The builder accepts caller-provided retrieval search results, retrieval hits, source ref candidates, candidate summaries, review memory summaries, durable summaries, feedback summaries, and manual bounded context refs.

Raw RAG context payloads must not be stored. Raw retrieval outputs must not be stored.

## 7. Context item inclusion and exclusion rules

Included context items require non-empty bounded summaries, supported input kinds, public_safe true, and source refs unless the item is explicit gap or tension context.

Excluded context records preserve why material was omitted: missing source ref, private/raw payload, stale without warning, duplicate, unsupported kind, or empty summary.

## 8. Candidate vs durable vs review memory vs feedback layers

Context items mark their layer as candidate, durable, review_memory, feedback, source_ref, manual, or unknown.

Candidate context is review material, not truth. Durable context is lineage metadata, not proof. Review memory context is review memory, not Perspective state. Feedback context is candidate-only, not rule mutation.

## 9. Staleness, unresolved tension, and knowledge gap preservation

Stale context can be included only with a stale warning and reason code. Stale context cannot override current state.

Unresolved tensions must be preserved. Knowledge gaps must be preserved.

## 10. Preview fingerprint rules

The preview fingerprint is deterministic sha256 over canonical JSON for the envelope without preview_fingerprint.

Repeated builds from the same bounded input must produce the same fingerprint.

## 11. Read-only UI panel rules

The read-only UI panel renders props-only preview data. It does not fetch, call routes, call providers, save, promote, write proof/evidence, write products, or imply execution authority.

The panel labels the surface as RAG context preview only, No answer generated, Context items are not evidence, Retrieval score is not truth score, and Product-write remains parked.

## 12. Privacy and redaction rules

Fixtures and runtime validation must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text intended for retrieval or RAG.

Blocked examples use bounded placeholder text only and do not include actual raw private payload.

Blocked private/raw inputs are never echoed in preview output, including blocked envelopes and excluded context items. Excluded private/raw context items use bounded redacted placeholders.

## 13. Authority boundary

Authority is preview-only context shaping over caller-provided bounded summaries and symbolic refs.

No answer generation, provider/OpenAI call, prompt sending, embedding creation, vector search, semantic embedding search, external retrieval provider, source fetch, crawler, local/repository/uploaded file read, raw source body storage, raw provider output storage, raw retrieval output storage, DB query/write, proof/evidence write, claim/evidence write, Perspective promotion, durable Perspective state mutation, work mutation, Codex execution, GitHub automation, Git Ledger export, product write, product ID allocation, source-of-truth authority, answer truth authority, context evidence authority, truth score authority, or promotion readiness authority is added.

Product-write remains parked by #686.

## 14. Deferred work

Deferred work:

1. Answer generation
2. Provider call integration
3. Prompt sending
4. Embedding creation
5. Vector search
6. Semantic retrieval
7. Reranking runtime
8. Retrieval/RAG routes
9. Durable RAG context storage
10. Retrieval UI beyond read-only preview panel
11. Dogfooding ingestion route contract
12. Dogfooding ingestion route
13. Human-reviewed promotion
14. Formation Receipt durable write
15. Durable Perspective state apply
16. Git Ledger export
17. Product write reentry

## 15. Verification expectations

Verification should run scripts/smoke-rag-context-preview-v0-1.mjs, the PR #780 retrieval index runtime smoke, the PR #779 research retrieval contract smoke, downstream source-intake/provider/review-memory/foundation smokes, npm run typecheck, git diff --check, and git diff --cached --check.

Existing MODULE_TYPELESS_PACKAGE_JSON warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 16. Next recommended slices

1. perspective_promotion_runtime_contract_v0_1
2. dogfooding_record_runtime_contract_v0_1
3. provider_output_redaction_contract_v0_1 if needed before live provider output storage is ever considered
4. feedback_event_aggregation_runtime_v0_1
5. retrieval_ui_or_citation_review_ui_v0_1 only after RAG context preview is reviewed
