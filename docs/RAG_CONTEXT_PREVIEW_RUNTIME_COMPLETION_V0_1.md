# RAG Context Preview Runtime Completion v0.1

## Purpose

This slice implements `rag_context_preview_runtime_completion_v0_1` as a runtime completion for original Phase 3.7 RAG context preview requirements.

This slice closes the original Phase 3.7 RAG context preview gap by using DB-backed retrieval search results. It creates context previews only.

## Roadmap Relationship

This work follows `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` for Phase 3.7 implementation guidance. The roadmap guide is not SSOT.

## Relationship To RAG Context Preview v0.1

The earlier RAG context preview remains compatible but was caller-provided-results only. It built preview packets from bounded caller-provided retrieval hits and summaries. This runtime completion binds preview creation to the DB-backed retrieval search runtime.

## Relationship To Rebuildable Retrieval Index Runtime Completion

This slice reads from the DB-backed retrieval index through `searchResearchRetrievalIndexV01`. The preview route opens the DB read-only, requires an existing schema, and does not create DB files, create schema, rebuild indexes, or write rows.

## Relationship To Bounded Source Intake Runtime Completion

Bounded source intake summaries can appear as derived retrieval index entries and then as context preview items. Source refs are lineage pointers, not proof.

## Relationship To Provider-Assisted Extraction Runtime Completion

Provider extraction candidate summaries can appear as derived retrieval index entries and then as provider-candidate context. Provider output is still not truth, proof, evidence, or promotion readiness.

## Request Shape

Requests include `request_version`, `preview_version`, `search_version`, `scope`, `preview_request_id`, `requested_by`, `requested_at`, `db_path`, `query`, `search_filters`, `include_stale`, `max_search_results`, `max_context_items`, `max_context_chars`, candidate/durable/tension/gap inclusion switches, an authority boundary, and reason codes.

## Result Shape

Results include `result_version`, `preview_version`, `scope`, `status`, `preview_request_id`, `query_ref`, `search_request_ref`, `search_status`, `retrieved_refs`, `included_context_summaries`, `excluded_context_reasons`, candidate-vs-durable markers, staleness warnings, unresolved tensions, knowledge gaps, item/char counts, execution flags, authority boundary, and reason codes.

## DB-Backed Search Policy

The runtime preview calls the DB-backed retrieval search helper over an existing SQLite DB path that passes the retrieval index DB path policy. Search is read-only for this slice.

## Inclusion And Exclusion Policy

Included context must be public-safe, have a source ref, be supported by a known surface, fit item and character limits, and pass duplicate backref checks. Excluded context records preserve reasons such as stale excluded, max context items exceeded, max context chars exceeded, missing source ref, private/raw payload blocked, unsupported surface, duplicate backref, not public safe, or not relevant.

## Candidate-Vs-Durable Marker Policy

Context items mark candidate, review memory, durable state, promotion, Formation Receipt, feedback, source, provider-candidate, or unknown context. Candidate context is review material, not truth. Durable context is orientation, not proof.

## Staleness Warning Policy

Stale context can be included only when the request includes stale results. Included stale context emits staleness warnings. Stale context cannot override current state.

## Tension And Gap Marker Policy

Unresolved tension and knowledge gap markers are preserved when present in bounded summaries or reason codes and when the request asks to include those markers.

## Context Size Limits

The runtime enforces `max_search_results`, `max_context_items`, and `max_context_chars`. Excluded items keep bounded omission reasons.

## Route Policy

`POST /api/research-retrieval/rag-context-preview` is same-origin only. The route accepts JSON object requests, validates a safe DB path, requires the DB and schema to exist, opens SQLite read-only with `fileMustExist`, calls DB-backed retrieval search through the builder, and returns a bounded context preview response. It does not create schema or write DB.

## Component Policy

`components/rag-context-preview-panel.tsx` can render runtime completion results passed as props. It remains display-only and does not call routes, providers, prompts, source fetch, product-write, GitHub, or Codex.

## Privacy And Redaction Policy

The runtime rejects private/raw markers and forbidden authority grants. It must not echo unsafe DB paths, private URLs, local paths, secrets, raw source bodies, raw provider outputs, raw retrieval outputs, raw DB rows, raw conversations, hidden reasoning, telemetry dumps, GitHub payloads, PR payloads, raw diffs, or terminal logs.

## Authority Boundary

Allowed true fields are:

- `rag_context_preview_runtime_now`
- `db_backed_retrieval_search_now`
- `explicit_operator_preview_only`
- `same_origin_post_route_now`
- `read_only_db_search_now`
- `context_preview_created_now`
- `candidate_vs_durable_markers_visible`
- `staleness_warnings_visible`
- `unresolved_tension_markers_visible`
- `knowledge_gap_markers_visible`

Forbidden capabilities remain false. This slice does not generate final answers. This slice does not call providers. This slice does not send prompts. This slice does not fetch sources. This slice does not crawl. This slice does not create embeddings. This slice does not use vector search. This slice does not write retrieval indexes. This slice does not write DB. This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not mutate candidates. This slice does not write review memory. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs.

Product-write remains parked by #686.

RAG context is not truth. RAG context is not proof. RAG context is not accepted evidence. RAG context is not promotion readiness. Retrieval result is not evidence. Retrieval score is not truth score. Retrieval score is not promotion readiness. Source refs are lineage pointers, not proof. Smoke/CI pass is not truth.

## Fixture Policy

`fixtures/rag-context-preview-runtime-completion.sample.v0.1.json` uses public-safe symbolic refs only. Safe blocked placeholders appear only inside blocked examples.

## Verification Expectations

`scripts/smoke-rag-context-preview-runtime-completion-v0-1.mjs` verifies docs, route, builder exports, fixture policy, temp SQLite DB seeding through the rebuild helper, read-only preview route behavior, missing DB/schema handling, no-results behavior, stale/item/char exclusions, candidate/durable markers, tension/gap markers, private/raw blocking, forbidden authority blocking, invalid DB path/query rejection, no unsafe echo, authority boundary fields, existing RAG preview compatibility, retrieval index completion compatibility, and provider/source completion compatibility.

## Deferred RAG Answer Generation

RAG answer generation remains deferred. Context preview is a review aid, not a final answer.
