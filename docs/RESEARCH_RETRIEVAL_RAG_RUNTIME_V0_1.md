# Research Retrieval/RAG Runtime Contract v0.1

## 1. Purpose

Research Retrieval/RAG Runtime Contract is contract-only.

It defines the public-safe, rebuildable, non-authoritative contract for a
future research retrieval / RAG runtime. It defines future retrieval requests,
source-ref/candidate/review/durable-summary corpus descriptors, query
descriptors, retrieval candidate records, context preview candidate records,
scoring previews, redaction reports, result envelopes, lineage rules, and
authority boundaries before any runtime implementation is allowed.

Retrieval candidates are not truth.
Retrieval candidates are not proof/evidence.
Retrieval result is not evidence.
Retrieval score is not truth score.
Retrieval score is not promotion readiness.
RAG answer is context preview only.
accepted_for_future_runtime is not runtime execution.
bounded query summary is not query execution.
retrieval mode is planning metadata, not retrieval execution.
Source refs are lineage pointers, not proof.
Source refs must be public-safe symbolic refs.
Candidate summary refs are lineage metadata, not proof.
Durable summary refs are lineage metadata, not proof.
Provider candidate refs are lineage metadata, not proof.
Raw retrieval outputs must not be stored.
Product-write remains parked by #686.

## 2. Relationship to the integrated roadmap guide v0.2.1 FULL

It implements the Phase 3.5 research_retrieval_runtime_contract_v0_1 slice from
docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md.

The roadmap guide is not SSOT; it is an operational roadmap, PR sequencing
guide, and authority-boundary checklist. Actual field/type/enum authority for
this slice is the type contract in
types/research-retrieval-runtime-contract.ts.

Older proposal documents are background inputs already integrated into the roadmap guide, not standalone ordering authority.

## 3. Relationship to #774-#778 source intake, provider-assisted extraction, and repo-local roadmap slices

It follows #774, #775, #776, #777, and #778.

#774 defines the Bounded Source Intake Runtime Contract. #775 adds a bounded
source intake runtime that emits caller-provided-input-only result envelopes and
runtime reports. #776 defines the Provider-Assisted Extraction Candidate-Only
Contract. #777 adds the provider-assisted extraction runtime boundary while
still preserving provider, prompt, source, retrieval, write, proof, promotion,
and product-write limits. #778 adds the repo-local integrated roadmap guide
v0.2.1 FULL used as the planning basis for this slice.

This contract defines the next retrieval/RAG contract boundary after those
slices. It does not widen #774-#777 into retrieval execution, RAG execution,
provider calls, index reads/writes, source fetches, DB access, proof/evidence,
Perspective promotion, durable state, Git Ledger export, or product write.

## 4. Scope and non-goals

This slice adds:

- types/research-retrieval-runtime-contract.ts
- fixtures/research-retrieval-runtime-contract.sample.v0.1.json
- scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs
- this documentation pointer
- package and index pointers

It does not implement retrieval runtime.
It does not execute retrieval/RAG.
It does not create embeddings.
It does not query vector indexes.
It does not read indexes.
It does not write indexes.
It does not scan corpora.
It does not call provider/OpenAI.
It does not send prompts.
It does not store provider outputs.
It does not store retrieval outputs.
It does not fetch sources.
It does not read local files.
It does not read repository files as source input.
It does not read uploaded files.
It does not query or write DB.
It does not add routes.
It does not add UI.
It does not create proof/evidence.
It does not write claim/evidence records.
It does not promote Perspective.
It does not mutate durable Perspective state.
It does not mutate work.
It does not execute Codex.
It does not call GitHub.
It does not export Git Ledger packets.
It does not write product records.
Product-write remains parked by #686.

It also does not add package dependencies, GitHub Actions, CI runtime changes,
background jobs, raw source storage, raw provider output storage, raw retrieval
output storage, raw conversation storage, hidden reasoning storage, private URL
persistence, local private path persistence, product-write authority, or
product ID allocation.

## 5. Contract shape

The type contract defines:

- ResearchRetrievalInputRef
- ResearchRetrievalCorpusDescriptor
- ResearchRetrievalQueryDescriptor
- ResearchRetrievalRequest
- ResearchRetrievalCandidate
- ResearchRetrievalResultEnvelope
- ResearchRetrievalContractBundle
- ResearchRetrievalValidationResult
- contract/version, scope, status, input-kind, corpus-kind, retrieval-mode,
  request-status, candidate-kind, privacy, redaction, score-band,
  review-status, reason-code, and authority-boundary vocabularies

The fixture contains a deterministic public-safe bundle covering accepted,
blocked, rejected, operator-review, unknown, private-ref-only, redacted, and
candidate-only retrieval contract cases. The fixture is symbolic and stores no
raw source text, raw provider output, raw retrieval output, prompt text, query
text, hidden reasoning, private path, private URL, browser dump, or raw DB row.

## 6. Input refs and corpus descriptor rules

Input refs may point to:

- bounded_source_intake_result_envelope
- bounded_source_intake_runtime_report
- provider_assisted_extraction_candidate_output
- review_memory_ref
- candidate_summary_ref
- perspective_delta_summary_ref
- formation_receipt_summary_ref
- feedback_summary_ref
- source_ref
- manual_bounded_context
- unknown

Input refs are lineage metadata only. They do not fetch sources, read files,
retrieve context, generate candidates, create proof/evidence, or grant runtime
authority. Source refs must be public-safe symbolic refs. Candidate summary
refs are lineage metadata, not proof. Durable summary refs are lineage
metadata, not proof. Provider candidate refs are lineage metadata, not proof.

Corpus descriptors identify source-ref metadata sets, candidate summary sets,
review-note sets, perspective delta summary sets, formation receipt summary
sets, feedback summary sets, manual bounded context sets, or unknown corpus
sets. A corpus descriptor may be accepted for future runtime only as
rebuildable, derived, non-authoritative metadata. A stale index cannot override
current state.

## 7. Query descriptor rules

Query descriptors contain bounded query summaries, requested candidate kinds,
source refs, candidate refs, durable summary refs, redaction status, public-safe
status, reason codes, and the authority boundary.

bounded query summary is not query execution.
retrieval mode is planning metadata, not retrieval execution.

Query descriptors do not execute queries, call providers, generate embeddings,
read indexes, scan corpora, send prompts, fetch sources, read files, query DB,
or create proof/evidence.

## 8. Retrieval mode semantics

Retrieval modes are future planning metadata:

- metadata_lookup: future metadata-only lookup shape.
- lexical_candidate_retrieval: future lexical candidate retrieval shape.
- semantic_candidate_retrieval: future semantic candidate retrieval shape.
- hybrid_candidate_retrieval: future hybrid retrieval shape.
- rerank_candidate_preview: future rerank preview shape.
- rag_context_preview: future RAG context preview shape.
- citation_context_preview: future citation context preview shape.
- no_retrieval: candidate-only context shape with no retrieval.
- unknown: unsupported placeholder until a future contract defines behavior.

None of these modes execute retrieval/RAG in this PR. accepted_for_future_runtime
is not runtime execution.

## 9. Candidate rules

Retrieval candidates define reviewable context previews for:

- source_ref_candidate
- candidate_summary_candidate
- review_note_candidate
- provider_candidate_output_ref
- perspective_delta_summary_candidate
- formation_receipt_summary_candidate
- feedback_summary_candidate
- gap_context_candidate
- contradiction_context_candidate
- citation_context_candidate
- rag_context_candidate
- unknown

Retrieval candidates are not truth.
Retrieval candidates are not proof/evidence.
Retrieval result is not evidence.
Retrieval score is not truth score.
Retrieval score is not promotion readiness.
RAG answer is context preview only.

Every candidate keeps retrieval, RAG, embedding, vector search, index read,
index write, corpus scan, rerank, provider call, prompt sending, provider
output storage, retrieval output storage, proof/evidence creation,
claim/evidence writing, Perspective promotion, and product write execution
false.

## 10. Result envelope rules

Result envelopes are contract-only summaries of future retrieval candidate
eligibility. They may list candidate refs, source refs, review memory refs,
durable summary refs, feedback refs, acceptance for a future runtime, reason
codes, and the authority boundary.

Retrieval result is not evidence.
accepted_for_future_runtime is not runtime execution.
Source refs are lineage pointers, not proof.

Every result envelope keeps retrieval, RAG, embedding, vector search, index
read, index write, corpus scan, rerank, provider call, prompt sending,
provider output storage, retrieval output storage, proof/evidence creation,
claim/evidence writing, and product write execution false.

## 11. Rebuildable index and non-authoritative retrieval rules

This contract allows future descriptors to state that an index would be
rebuildable, derived, and non-authoritative. It does not build the index. It
does not read the index. It does not write the index. It does not scan the
corpus. It does not query a vector index. It does not create embeddings. It
does not run vector search. It does not rerank results.

Future retrieval results must link back to canonical records or public-safe
source refs. Stale index material cannot override current state. Source refs
are lineage pointers, not proof.

## 12. Privacy and redaction rules

Privacy classes distinguish public-safe refs, private-ref-only refs, blocked
raw private payloads, and blocked secret-like payloads. Redaction statuses
distinguish not-needed, redacted, secret-like blocked, raw-payload blocked, and
private-location blocked cases.

Raw retrieval outputs must not be stored. Raw source bodies, raw provider
outputs, raw conversations, hidden reasoning, private URLs, local private
paths, token-like strings, secret-like strings, raw DB rows, browser dumps,
actual prompt text, actual query text, embedding vectors, and vector index
dumps are outside this contract.

The fixture uses bounded placeholders only for blocked demonstrations and does
not include the blocked payload itself.

## 13. Research Retrieval/RAG authority boundary

The authority boundary keeps:

- contract_only true.
- retrieval_runtime_now false.
- rag_execution_now false.
- query_execution_now false.
- embedding_created_now false.
- vector_search_now false.
- rerank_now false.
- index_read_now false.
- index_write_now false.
- corpus_scan_now false.
- source_fetch_now false.
- local_file_read_now false.
- repository_file_read_now false.
- uploaded_file_read_now false.
- raw_source_body_storage_now false.
- raw_retrieval_output_storage_now false.
- provider_openai_call_now false.
- prompt_sent_now false.
- provider_output_stored_now false.
- db_query_or_write_now false.
- source_of_truth false.
- proof_or_evidence_record false.
- claim_or_evidence_write_now false.
- perspective_promotion false.
- durable_perspective_state false.
- work_mutation false.
- codex_execution_authority false.
- github_automation_authority false.
- git_ledger_export_authority false.
- product_write_authority false.
- product_id_allocation_authority false.

Product-write remains parked by #686.

## 14. Deferred work

Deferred work:

- Research retrieval runtime
- Rebuildable retrieval index runtime
- Retrieval routes
- Retrieval UI
- RAG context preview
- Embedding creation
- Vector index read/write
- Provider call integration
- Prompt sending
- Provider output storage
- Provider output redaction pipeline
- Dogfooding ingestion route contract
- Dogfooding ingestion route
- Codex result report ingestion
- Feedback aggregation runtime
- Feedback controls expansion
- Human-reviewed promotion
- Formation Receipt durable write
- Durable Perspective state apply
- Git Ledger export
- Product write reentry

## 15. Verification expectations

Verification is fixture-backed and contract-only:

- node --check scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs
- npm run smoke:research-retrieval-runtime-contract-v0-1
- downstream smoke chain requested by the PR handoff
- npm run typecheck
- git diff --check
- git diff --cached --check

The smoke asserts the roadmap prerequisite, fixture versions, enum coverage,
reason-code coverage, safe authority boundaries, execution/write falses,
deterministic bundle fingerprint, public-safe fixture text, package script, and
index pointers.

## 16. Next recommended slices

Next recommended slices:

1. rebuildable_retrieval_index_runtime_v0_1
2. rag_context_preview_v0_1
3. perspective_promotion_runtime_contract_v0_1
4. dogfooding_record_runtime_contract_v0_1
5. provider_output_redaction_contract_v0_1 if needed before live provider output storage is ever considered

These slices are not implemented in this PR.
