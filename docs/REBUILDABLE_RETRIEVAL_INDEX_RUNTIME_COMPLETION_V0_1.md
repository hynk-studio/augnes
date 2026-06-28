# Rebuildable Retrieval Index Runtime Completion v0.1

## Purpose

This slice implements `rebuildable_retrieval_index_runtime_completion_v0_1` as the original Phase 3.6 rebuildable retrieval index runtime completion. It adds caller-injected SQLite persistence for derived retrieval index rows plus explicit rebuild and search runtime behavior.

This slice closes the original Phase 3.6 rebuildable retrieval index runtime gap, if the earlier runtime was partial. The earlier `REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_V0_1` implementation remains compatible as a process-local, caller-provided deterministic index helper, but it was not the DB-backed rebuild/search completion required here.

## Roadmap Relationship

This work follows `docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md` for Phase 3.6 implementation guidance. The roadmap guide is not SSOT. The runtime boundary is this slice's helper, route, fixture, and smoke behavior.

## Contract Relationship

This slice follows the Research Retrieval/RAG Runtime Contract shape in `types/research-retrieval-runtime-contract.ts`, while continuing to defer RAG answer generation, embeddings, vector search, rerank runtime, and citation context composition.

## Related Runtime Slices

The index may accept public-safe derived summaries from Bounded Source Intake Runtime Completion, Provider-Assisted Extraction Runtime Completion, and Review Memory DB runtime records when callers provide bounded symbolic refs and summaries. It does not fetch those records automatically and does not turn any retrieval result into evidence.

## Schema

The DB-backed store uses caller-injected SQLite DB handles with these logical tables:

- `research_retrieval_index_entries`
- `research_retrieval_index_terms`
- `research_retrieval_index_rebuilds`

`research_retrieval_index_entries` stores bounded public-safe summaries, symbolic backrefs, stale markers, and authority boundary JSON. `research_retrieval_index_terms` stores deterministic lexical terms derived from public-safe titles, summaries, and symbolic refs. `research_retrieval_index_rebuilds` records bounded rebuild metadata only.

This slice writes derived retrieval index rows only.

Index is derived and rebuildable.

## Rebuild Input Policy

Rebuild is explicit operator action only. Callers provide `rebuild_version`, `scope`, `rebuild_request_id`, `requested_by`, `requested_at`, `db_path`, `index_version`, and bounded `entries`.

Entries must be public-safe and may reference source, candidate, review, promotion, Formation Receipt, durable Perspective state, trajectory, feedback, provider extraction, bounded source intake, dogfooding, or manual bounded context surfaces through symbolic refs. Duplicate deterministic entries are deduped during rebuild. The rebuild replaces rows for the same scope and index version atomically.

## Search Input Policy

Search is explicit operator action only. Search reads the derived index tables and returns bounded review-aid results. Search result is not evidence. Retrieval score is not truth score. Retrieval score is not promotion readiness. Source refs are lineage pointers, not proof.

Search supports bounded query text, limit, stale inclusion, and filters such as candidate ref, source ref, review record ref, promotion decision ref, Formation Receipt ref, Perspective id, feedback ref, provider extraction ref, and bounded source intake ref.

## DB Path Policy

Routes allow only relative DB paths under:

- `tmp/research-retrieval/`
- `.tmp/research-retrieval/`

Paths must end with `.sqlite` or `.db`. Absolute paths, parent traversal, backslashes, null bytes, URL-like paths, private local paths, and token/secret-looking values are rejected without echoing the raw path.

## Tokenization And Scoring Policy

Tokenization is deterministic lexical tokenization over bounded public-safe fields only. Scores are simple matched-term display hints. They are not truth, evidence, or promotion readiness.

## Stale Marker Policy

Each entry carries `fresh`, `stale`, or `unknown`. Search exposes the stale marker, and callers can exclude stale entries unless explicitly including them.

## Backrefs Policy

Search results expose public-safe symbolic backrefs where present: source, candidate, review, promotion decision, Formation Receipt, Perspective state, feedback, provider extraction, and bounded source intake refs.

## Privacy And Redaction Policy

The index must not store raw source bodies, raw provider output, raw retrieval output, hidden reasoning, private URLs, local paths, secrets, provider internal IDs, raw conversations, raw DB rows, telemetry dumps, raw diffs, or terminal logs.

## Route Policy

`POST /api/research-retrieval/rebuild` supports the completion route body and may ensure schema and write derived index rows.

`POST /api/research-retrieval/search` supports the completion route body and reads existing derived index rows. The search route does not create DB files or schema.

Both routes require same-origin requests. The legacy process-memory route body remains compatible but is not this DB-backed completion.

## Authority Boundary

Allowed true fields are limited to rebuild/search runtime, explicit operator rebuild/search, caller-injected DB, DB query/write, derived index write on rebuild, derived index search on search, public-safe derived entries, stale marker visibility, and backrefs visibility.

Forbidden capabilities remain false:

- provider/OpenAI calls
- prompt sending
- source fetch
- live crawling
- embedding creation
- vector search
- RAG answer generation
- raw source body indexing
- raw provider output indexing
- raw retrieval output storage
- hidden reasoning storage
- proof/evidence record creation
- claim/evidence writes
- Perspective promotion
- durable Perspective state write/apply
- Formation Receipt writes
- product-write
- product-write runtime or adapter enablement
- product ID allocation
- product persistence
- Git Ledger export runtime
- Git/GitHub execution
- repository file writes
- local file import/export
- Codex execution

This slice does not call providers. This slice does not send prompts. This slice does not fetch sources. This slice does not crawl. This slice does not create embeddings. This slice does not use vector search. This slice does not generate RAG answers. This slice does not create proof/evidence. This slice does not write claim/evidence records. This slice does not promote Perspective. This slice does not write/apply durable Perspective state. This slice does not write Formation Receipts. This slice does not execute Git/GitHub. This slice does not execute Codex. This slice does not product-write. This slice does not allocate product IDs.

Product-write remains parked by #686.

## Fixture Policy

`fixtures/research-retrieval-index-runtime-completion.sample.v0.1.json` uses public-safe symbolic refs only. Safe blocked-example placeholders appear only inside blocked examples.

## Verification Expectations

`scripts/smoke-research-retrieval-index-runtime-completion-v0-1.mjs` verifies schema creation, schema existence, deterministic rebuild, atomic replacement, duplicate dedupe, search filters, stale markers, backrefs, route behavior, DB missing/schema missing errors, invalid DB path rejection, private/raw blocking, forbidden authority blocking, no unsafe echo, authority boundaries, fixture policy, and compatibility with the earlier retrieval runtime and contract.

Smoke/CI pass is not truth. It is only validation evidence for this implementation boundary.

## Deferred RAG Preview Binding

Follow-up RAG context preview completion should use this search runtime, not caller-provided fake retrieval results only. RAG answer generation remains deferred.
