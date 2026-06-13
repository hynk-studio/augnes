# Perspective Memory Items Read-Only Review Workspace

## summary

This PR follows PR #539 by adding a packet-first read-only review workspace for persisted perspective-memory items. Search made items retrievable; this surface lets users select persisted items and inspect a deterministic review packet across content summaries, counts, source refs, evidence refs, risks, unresolved tensions, carry-forward questions, relationships, and review guidance.

The route is `/cockpit/perspective/memory-items/review` and the persistence backend remains `sqlite:lib/db.ts`.

## implementation

Added:
- deterministic review helper in `lib/perspective-ingest/perspective-memory-item-review-workspace.ts`
- packet-first review route at `/cockpit/perspective/memory-items/review`
- item selection, select all visible, clear selection, filters, reload, and selected item detail
- dashboard links to review workspace and selected-item preselection
- search route links to review workspace and selected-result preselection
- static and browser smoke scripts
- docs and validation reports

## deterministic review packet

The helper emits `perspective_memory_item_review_packet.v0.1` from selected persisted items. It also exposes `perspective_memory_item_review_workspace.v0.1`, `perspective_memory_item_review_selection_summary.v0.1`, and `perspective_memory_item_review_guidance.v0.1`.

The packet includes:
- `status_counts`
- `validation_result_counts`
- `memory_kind_counts`
- `source_boundary_record_ids`
- `source_candidate_draft_ids`
- `source_refs`
- `evidence_refs`
- `risk_notes`
- `unresolved_tensions`
- `carry_forward_questions`
- `suggested_next_review_actions`
- `content_summaries`
- `relationship_summary`
- `review_guidance`
- `authority_boundary`

Relationship summary detects shared source refs, duplicate titles, repeated questions, retracted/deprecated items, superseded items, and PASS with follow-up items.

## route behavior

The route renders:
- read-only boundary
- selected persisted perspective-memory items
- selected count
- select all visible
- clear selection
- reload items
- filters
- deterministic review packet panel
- content summary panel
- source/evidence refs panel
- risk/tensions/questions panel
- relationship summary panel
- review guidance panel
- selected item detail panel
- missing preselected item ids
- navigation links back to dashboard, search, boundary inbox, local queue, and local adapter operator flow

The route is a thin surface over the helper. It fetches `GET /api/perspective/memory/items?limit=100`, keeps selection in component state, and does not persist selection or packets.

## API/persistence behavior

No new write API is added. The client does not read SQLite directly and does not duplicate DB store logic. Existing item APIs remain unchanged:
- `GET /api/perspective/memory/items`
- `POST /api/perspective/memory/items`
- `GET /api/perspective/memory/items/[itemId]`
- `PATCH /api/perspective/memory/items/[itemId]`

The review route uses only `GET /api/perspective/memory/items`.

## boundary

This PR creates no Core memory, Core decision, state entry, runtime handoff, automatic runtime injection, automatic promotion, provider/model call, Codex SDK call, GitHub mutation, vector DB, embeddings, saved review workspace, persisted review packet table, or checklist layer.

The review packet excludes raw returned envelope text, raw prompt/source packet, raw candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, private material, and raw review payloads.

## browser validation

Browser validation uses:

```bash
AUGNES_DB_PATH=/tmp/augnes-memory-items-review-browser/augnes.db npm run dev -- -H 127.0.0.1 -p 3000
```

Validated routes:
- `/cockpit/perspective/codex-former/local-adapter-operator-flow`
- `/cockpit/perspective/memory-review-queue/local`
- `/cockpit/perspective/memory-boundary-review-inbox`
- `/cockpit/perspective/memory-items`
- `/cockpit/perspective/memory-items/search`
- `/cockpit/perspective/memory-items/review`

Browser validation covers the end-to-end local flow through persisted item creation, dashboard/search links, review workspace selection, selected count updates, packet panels, filters, clear selection, select all visible, refresh persistence through API/SQLite, read-only authority flags, no enabled mutation controls, no console warnings/errors, no unexpected external traffic, and responsive 390px, 768px, and desktop behavior.

Multi-item aggregation is covered in static smoke with deterministic fixture items.

## verification

Target verification:
- `npm run smoke:perspective-memory-items-review-workspace`
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
- `npm run browser:perspective-memory-items-review-workspace`
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## out of scope

No saved review workspaces, persisted review packet table, provider/model synthesis, embeddings, vector DB, Core promotion, Core memory, Core decision, state entry writes, runtime prompt injection, runtime handoff, automatic promotion, or checklist layer is implemented.

## Next recommended PR

After this PR:
1. Add saved local review workspaces if users need repeated manual review sessions.
2. Or add a persisted review packet table only if product decision is explicit.
3. Or design Core-facing promotion from perspective-memory items only if separately and explicitly decided.
