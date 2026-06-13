# Perspective Memory Items Search V0.1

This follows PR #538. Augnes can now create persisted perspective-memory items from reviewed product persistence boundary records and show them in `/cockpit/perspective/memory-items`. This slice adds read-only retrieval so users can search and inspect those durable product-level memory items without creating memory, changing Core state, or injecting runtime context.

Routes:
- `/cockpit/perspective/memory-items`
- `/cockpit/perspective/memory-items/search`
- `/cockpit/perspective/memory-items/review`

API:
- `GET /api/perspective/memory/items`

Persistence backend:
- `sqlite:lib/db.ts`
- table: `perspective_memory_items`

## Dashboard Versus Search

The memory items dashboard remains the status-management surface for persisted perspective-memory items. It can update `item_status` only.

The search route is read-only. It exposes search, clear search, filters, reload, result selection, selected detail, source boundary trace, content preview, availability flags, and authority boundary. It does not expose status mutation controls, item creation controls, boundary creation controls, Core controls, runtime controls, provider/model controls, Codex SDK controls, GitHub mutation controls, state entry controls, or deployment controls.

The search route links to `/cockpit/perspective/memory-items/review` with `Open review workspace`, and selected results can be opened in review with `Review this item`. These links only preselect items for deterministic packet review; they do not mutate or persist anything.

## Search Fields

Search is deterministic and local over bounded persisted item fields:
- `item_id`
- `item_status`
- `memory_kind`
- `source_boundary_record_id`
- `source_checklist_id`
- `source_proposal_id`
- `source_queue_item_id`
- `source_candidate_draft_id`
- `source_validation_result_state`
- `source_validation_summary_hash`
- `source_input_ref`
- `source_input_hash`
- `prepare_summary_ref`
- `prepare_execution_summary_hash`
- `returned_envelope_hash`
- `source_proposal_hash`
- `content.title`
- `content.summary`
- `content.source_refs`
- `content.evidence_refs`
- `content.risk_notes`
- `content.unresolved_tensions`
- `content.carry_forward_questions`
- `content.suggested_next_review_action`

It does not search raw returned envelope text, raw prompts, raw source packets, raw candidate payloads, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, private material, or raw review payloads.

## Ranking

Search is case-insensitive and whitespace-normalized. Multi-token queries use AND matching by default; this is the v0.1 multi-token AND behavior. Ranking is deterministic:
1. exact title match
2. title token match
3. summary match
4. source/ref/hash match
5. risk/tension/question match
6. newer `updated_at`
7. stable `item_id` tie-breaker

Exact phrase matches receive a higher score inside their rank group. Result summaries include `perspective_memory_item_search_result_summary.v0.1`, score, matched fields, and bounded snippets.

## API Query Behavior

`GET /api/perspective/memory/items` keeps the existing list behavior and adds optional read-only query params:
- `q`
- `search`
- `item_status`
- `memory_kind`
- `source_validation_result_state`
- `source_boundary_record_id`
- `active_state`
- `has_warnings`
- `limit`

When search/query filters are present, `result.search` includes `perspective_memory_item_search.v0.1`, normalized query, candidate and match counts, aggregate match fields, and result summaries. Empty query returns a filtered list with `query_empty: true`.

## Boundary

This search is no vector search and uses no embeddings. It performs no provider/model call, no Codex SDK call, no GitHub mutation, no Core decision, no Core memory write, no `state_entries` mutation, no runtime handoff, no automatic runtime injection, and no automatic promotion.

## Browser Validation

Browser validation uses:

```bash
AUGNES_DB_PATH=/tmp/augnes-memory-items-search-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000
```

The validation covers the operator route, local memory review queue, boundary review inbox, memory items dashboard, and search route. The search route is checked for search input, filters, read-only boundary, result metadata, selected detail, source boundary trace, authority boundary, no enabled mutation controls, refresh persistence through API/SQLite, and 390px, 768px, and desktop responsive behavior.

## Out Of Scope

This PR does not implement saved searches, synthesis, Core-facing promotion, Core memory, Core decisions, runtime prompt injection, provider/model enrichment, vector DB, embeddings, GitHub mutation, automatic promotion, or runtime handoff.

## Next Recommended PR

After the review-workspace PR:
1. Add saved local review workspaces if users need repeated manual review sessions.
2. Or add a persisted review packet table only if product decision is explicit.
3. Do not implement Core-facing promotion unless separately and explicitly decided.
