# Perspective Memory Items Read-Only Search

## summary

This PR follows PR #538 by adding read-only retrieval for persisted perspective-memory items. Items created from reviewed product persistence boundary records remain product-level durable memory items in `sqlite:lib/db.ts`, and the new `/cockpit/perspective/memory-items/search` route makes them searchable and inspectable without creating Core memory, Core decisions, runtime injection, provider/model calls, Codex SDK calls, GitHub mutation, state entries, or automatic promotion.

## implementation

Added:
- deterministic search model in `lib/perspective-ingest/perspective-memory-item-search.ts`
- query support on `GET /api/perspective/memory/items`
- search page at `/cockpit/perspective/memory-items/search`
- dashboard link labeled `Search persisted perspective-memory items`
- static and browser smoke scripts
- docs and validation reports

## API/query behavior

`GET /api/perspective/memory/items` keeps the existing list behavior and supports optional query params:
- `q`
- `search`
- `item_status`
- `memory_kind`
- `source_validation_result_state`
- `source_boundary_record_id`
- `active_state`
- `has_warnings`
- `limit`

When search/query filters are present, `result.search` includes `perspective_memory_item_search.v0.1`, normalized query, candidate and match counts, aggregate match fields, and `perspective_memory_item_search_result_summary.v0.1` summaries with score, matched fields, and bounded snippets. Empty query returns filtered items with `query_empty: true`.

## search behavior

Search is local, deterministic, case-insensitive, and whitespace-normalized. Multi-token queries use AND matching; this is the v0.1 multi-token AND behavior. Ranking follows exact title match, title token match, summary match, source/ref/hash match, risk/tension/question match, newer `updated_at`, then stable `item_id`.

Search fields include title, summary, source_refs, evidence_refs, risk_notes, unresolved_tensions, carry_forward_questions, suggested_next_review_action, source lineage ids, validation state, and hashes including `returned_envelope_hash`.

It does not search raw returned envelope text, raw prompt/source packet, raw candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, private material, or raw review payloads.

## route behavior

The search route renders:
- route and persistence backend markers
- read-only authority boundary
- search input, search, clear search, reload, and filters
- result count and selected result id
- result list with matched fields/snippets
- selected item detail
- source boundary trace
- content preview
- risk notes, unresolved tensions, and carry-forward questions
- availability flags
- authority boundary
- navigation links back to dashboard, boundary inbox, local queue, and local adapter operator flow

The route does not expose status mutation controls, item creation controls, boundary creation controls, write/commit/Core/runtime/provider/GitHub controls, state entry controls, or deployment controls.

## persistence behavior

Search uses the existing SQLite-backed `perspective_memory_items` store through `lib/db.ts`. It loads a bounded item list and performs deterministic TypeScript matching over persisted item JSON. No FTS table, vector DB, embeddings, provider/model search, localStorage-only search, or new persistence table is added.

## browser validation

Browser validation uses:

```bash
AUGNES_DB_PATH=/tmp/augnes-memory-items-search-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000
```

Validated routes:
- `/cockpit/perspective/codex-former/local-adapter-operator-flow`
- `/cockpit/perspective/memory-review-queue/local`
- `/cockpit/perspective/memory-boundary-review-inbox`
- `/cockpit/perspective/memory-items`
- `/cockpit/perspective/memory-items/search`

The browser validation confirms the end-to-end local flow creates a persisted perspective-memory item, the dashboard links to search, and the search route supports title, summary, source boundary id, returned envelope hash, risk/carry-forward, multi-token, no-result, clear, select, detail, source trace, availability, and authority boundary workflows.

## verification

Target verification:
- `npm run smoke:perspective-memory-items-search`
- `npm run smoke:perspective-memory-items`
- `npm run smoke:perspective-memory-boundary-review-inbox`
- `npm run smoke:perspective-memory-product-persistence-boundary`
- `npm run smoke:perspective-memory-local-write-proposal-review-checklist`
- `npm run smoke:perspective-memory-local-write-proposal`
- `npm run smoke:perspective-memory-local-review-queue`
- `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- `npm run browser:perspective-codex-former-local-adapter-operator-flow`
- `npm run browser:perspective-memory-local-review-queue`
- `npm run browser:perspective-memory-boundary-review-inbox`
- `npm run browser:perspective-memory-items`
- `npm run browser:perspective-memory-items-search`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## out of scope

No Core-facing promotion, Core memory, Core decision, state entry, runtime handoff, automatic runtime injection, automatic promotion, provider/model call, Codex SDK call, GitHub mutation, vector DB, embeddings, saved search view, or synthesis surface is created.

## Next recommended PR

After this PR:
1. Add a read-only synthesis/review surface that consumes selected persisted perspective-memory items.
2. Or add saved local search views if users need repeated retrieval workflows.
3. Do not implement Core-facing promotion unless separately and explicitly decided.
