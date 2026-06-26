# Rebuildable Retrieval Index Runtime v0.1

## 1. Purpose

Rebuildable Retrieval Index Runtime is a bounded derived runtime.

It provides deterministic local rebuild and search helpers for caller-provided public-safe summaries and symbolic refs. The index is rebuildable. The index is derived. The index is non-authoritative. The index is not canonical state. The index is not source of truth.

Search results are not evidence. Retrieval result is not evidence. Retrieval score is not truth score. Retrieval score is not promotion readiness. Stale index cannot override current state.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

It implements rebuildable_retrieval_index_runtime_v0_1 from docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md.

The roadmap guide is not SSOT. It is an operational roadmap, PR sequencing guide, and authority-boundary checklist. Actual field/type/enum authority remains with the relevant slice type contracts and existing SSOT layers.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to PR #779 Research Retrieval/RAG Runtime Contract

It follows PR #779 Research Retrieval/RAG Runtime Contract.

The PR #779 type contract remains the contract boundary for Research Retrieval/RAG shapes. This runtime preserves compatibility with types/research-retrieval-runtime-contract.ts and does not change the PR #779 contract-only artifact.

## 4. Scope and non-goals

This slice may rebuild an in-memory derived index from caller-provided bounded entries and may run deterministic metadata, lexical, hybrid, or no-retrieval searches against that index.

It does not implement RAG answer generation. RAG answer generation remains deferred. Embeddings remain deferred. Vector search remains deferred. Semantic embedding search remains deferred. Rerank runtime remains deferred.

Source fetch remains forbidden. Provider/OpenAI calls remain forbidden. Prompt sending remains forbidden. Provider output storage remains forbidden. Retrieval output storage remains forbidden. Raw source body storage remains forbidden. DB migration remains forbidden. Production DB read/write remains forbidden. Local file read as source input remains forbidden. Repository file read as source input remains forbidden. Uploaded file read remains forbidden.

Proof/evidence creation remains forbidden. Claim/evidence writes remain forbidden. Perspective promotion remains forbidden. Durable Perspective state mutation remains forbidden. Git Ledger export remains deferred. GitHub automation remains forbidden. Product ID allocation remains forbidden. Product-write remains parked by #686.

## 5. Runtime shape

The runtime has three local helper surfaces:

1. lib/research-retrieval/rebuild-index.ts rebuilds a deterministic derived index envelope.
2. lib/research-retrieval/search-index.ts searches a provided derived index and returns candidate-only review aids.
3. lib/research-retrieval/index-store.ts keeps an optional process-local in-memory derived cache.

Route responses are candidate-only review aids.

## 6. Rebuild input rules

Rebuild input must use runtime_version rebuildable_retrieval_index_runtime.v0.1 and contract_version research_retrieval_runtime_contract.v0.1.

Entries are caller-provided only. The runtime never scans a corpus from disk, a repository path, an upload, a database, a provider, or the web. Entries must be public-safe symbolic refs and bounded summaries only.

Inputs over max_entries, entries over max_summary_chars, unknown entry kinds, unsafe privacy classes, blocked redaction states, local paths, private URL markers, secret-like markers, raw source markers, raw provider markers, or raw retrieval markers are rejected.

## 7. Index entry rules

Each entry is a bounded metadata record. It may carry source_refs, candidate_refs, review_memory_refs, durable_summary_refs, feedback_refs, tags, a bounded title, and a bounded summary.

An entry is not proof. An entry is not evidence. An entry is not canonical state. Source refs are lineage pointers, not proof. Source refs must be public-safe symbolic refs.

## 8. Deterministic tokenization and fingerprint rules

Tokenization is deterministic: normalize text, lowercase it, remove punctuation, collapse whitespace, drop tokens shorter than two characters, deduplicate tokens per entry, and sort tokens lexicographically.

The index fingerprint is deterministic sha256 over canonical JSON for the index without index_fingerprint.

## 9. Search request and search result rules

Supported modes now are metadata_lookup, lexical_candidate_retrieval, hybrid_candidate_retrieval, and no_retrieval.

Deferred or unsupported modes now are semantic_candidate_retrieval, rerank_candidate_preview, rag_context_preview, citation_context_preview, and unknown. These return blocked_unsupported_mode, no hits, and explicit reason codes.

Search results are candidate-only review aids. Retrieval result is not evidence. Retrieval score is not truth score. Retrieval score is not promotion readiness.

## 10. Stale index rules

Stale entries may appear only with stale_warning true and an explicit stale_result_warning reason code.

Stale index cannot override current state. A stale hit cannot write proof, evidence, claim/evidence records, Perspective state, work state, product records, or product IDs.

## 11. In-memory derived store rules

In-memory derived cache is not durable state. It is a process-local derived cache for explicit caller use only.

The store performs no disk write, no DB write, no migration, no localStorage or sessionStorage write, no file read/write, no automatic rebuild, and no background job.

Discarding an index cache is not candidate rejection. Discarding an index cache is not proof/evidence deletion. Discarding an index cache is not product write.

## 12. Route boundary rules

The rebuild and search routes are POST-only. They use same-origin checks, accept JSON objects only, and return bounded responses with authority boundaries.

The rebuild route accepts caller-provided entries only and may save a derived index to the process-local in-memory cache. The search route accepts either an inline index or an index_id present in that cache. Missing indexes return bounded errors, not DB lookups.

The routes perform no source fetch, no local file read, no repository file read, no uploaded file read, no DB query/write, no provider/OpenAI call, no prompt sending, no embedding creation, no vector search, no RAG answer generation, no proof/evidence creation, no Perspective promotion, and no product write.

## 13. Privacy and redaction rules

Allowed runtime inputs are public-safe refs and bounded summaries only.

Fixtures and runtime validation must not include real private URLs, local user paths, tokens, secrets, raw source text, raw provider output, raw retrieval output, hidden reasoning, raw conversation, browser dumps, raw DB rows, actual prompt text, or actual query text intended for retrieval or RAG.

## 14. Authority boundary

The allowed authority is only a derived rebuildable index runtime over caller-provided bounded summaries and symbolic refs.

Forbidden authority remains false for RAG answer generation, embedding creation, vector search, semantic embedding search, external retrieval providers, source fetch, crawling, file reads as source input, raw source body storage, raw provider output storage, raw retrieval output storage, provider/OpenAI calls, prompt sending, DB migration, production DB read/write, proof/evidence records, claim/evidence writes, Perspective promotion, durable Perspective state, work mutation, Git Ledger export, Codex execution authority, GitHub automation authority, product write authority, product ID allocation authority, source of truth authority, evidence authority, truth-score authority, and promotion-readiness authority.

Product-write remains parked by #686.

## 15. Deferred work

Deferred work:

1. RAG context preview
2. Embedding creation
3. Vector index read/write
4. Semantic embedding retrieval
5. Reranking runtime
6. Retrieval UI
7. Provider call integration
8. Prompt sending
9. Provider output storage
10. Provider output redaction pipeline
11. Dogfooding ingestion route contract
12. Dogfooding ingestion route
13. Codex result report ingestion
14. Feedback aggregation runtime
15. Human-reviewed promotion
16. Formation Receipt durable write
17. Durable Perspective state apply
18. Git Ledger export
19. Product write reentry

## 16. Verification expectations

Verification should run scripts/smoke-research-retrieval-index-runtime-v0-1.mjs, the PR #779 research retrieval contract smoke, the downstream source-intake/provider/review-memory/foundation smokes, npm run typecheck, git diff --check, and git diff --cached --check.

Existing MODULE_TYPELESS_PACKAGE_JSON warnings from direct TypeScript imports are acceptable only when the command exits 0.

## 17. Next recommended slices

1. rag_context_preview_v0_1
2. perspective_promotion_runtime_contract_v0_1
3. dogfooding_record_runtime_contract_v0_1
4. provider_output_redaction_contract_v0_1 if needed before live provider output storage is ever considered
5. retrieval_ui_or_citation_review_ui_v0_1 only after RAG context preview is bounded
