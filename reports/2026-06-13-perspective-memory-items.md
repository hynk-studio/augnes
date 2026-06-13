# Perspective Memory Items From Reviewed Boundary Records

## summary

This PR follows PR #537 by turning reviewed product persistence boundary records into persisted perspective-memory items. The item is a durable product memory object stored through `sqlite:lib/db.ts`, visible in a dedicated dashboard at `/cockpit/perspective/memory-items`, and still explicitly outside Core decisions and automatic runtime injection.

## product decision

The new product decision is that a reviewed boundary record may create a persisted perspective-memory item after explicit user confirmation. This item is not Core memory, not a Core decision, not automatic runtime context injection, not automatic promotion, not provider/model generated, not a Codex SDK result, and not GitHub mutation.

## boundary record versus item

A product persistence boundary record says a locally-ready proposal crossed into product persistence boundary review.

A perspective-memory item is the durable product memory object created from that reviewed boundary record. It preserves source refs and boundary snapshot data so future retrieval, synthesis, and dashboard surfaces can consume it without relying on browser-local queue state.

## implementation

Added:
- `lib/perspective-ingest/perspective-memory-item.ts`
- `lib/perspective-ingest/perspective-memory-item-store.ts`
- `app/api/perspective/memory/items`
- `app/api/perspective/memory/items/[itemId]`
- `app/cockpit/perspective/memory-items`
- boundary review inbox item creation panel
- SQLite table `perspective_memory_items`
- static and browser smoke scripts

## persistence backend

The persistence backend is `sqlite:lib/db.ts`. The table is `perspective_memory_items`, with a unique `source_boundary_record_id` for idempotent creation.

The item stores bounded refs, hashes, summaries, risk notes, questions, acceptance confirmation, source boundary snapshot, availability flags, and authority boundary. It does not store raw returned envelope text, raw prompt/source packet, raw candidate payload, provider logs, hidden reasoning, tokens, browser dumps, raw diffs, private material, or raw review payloads.

## API behavior

`POST /api/perspective/memory/items` accepts only `source_boundary_record_id` plus confirmation flags. The server fetches the boundary record from SQLite and validates eligibility server-side before creating the item.

`GET /api/perspective/memory/items` lists persisted items with optional filters.

`PATCH /api/perspective/memory/items/[itemId]` updates `item_status` only. It does not mutate content, source refs, source hashes, acceptance, source boundary snapshot, or authority boundary.

## idempotency

Creating a memory item from the same `source_boundary_record_id` is idempotent. The store uses the unique boundary id to return the existing item with an idempotent replay response rather than creating duplicates.

## dashboard behavior

The memory items dashboard shows item count, filters, list, selected detail, content preview, source boundary refs and hashes, risk notes, unresolved tensions, carry-forward questions, acceptance confirmation, source boundary snapshot, availability flags, and authority boundary.

Status controls are limited to:
- accepted
- reviewing
- retracted
- superseded
- deprecated

The dashboard shows unavailable Core/runtime actions as policy text only.

The dashboard now links to `/cockpit/perspective/memory-items/search` with the label `Search persisted perspective-memory items`. Search and retrieval behavior lives on that read-only route, not behind the dashboard status controls.

## browser validation

Browser validation covers:
- operator route candidate draft creation
- local queue proposal/checklist readiness
- boundary record creation
- boundary inbox item creation panel
- disabled create button until confirmations are checked
- item creation and idempotent persisted source
- memory items dashboard list/detail/filter/status controls
- refresh persistence through API/SQLite
- responsive 390px, 768px, and desktop viewports
- no external provider/model/Codex SDK/GitHub behavior beyond same-origin app/API routes
- no Core decision or automatic runtime injection behavior

## verification

Target verification:
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
- `npm run typecheck`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## out of scope

No Core decision, Core memory, state entry, runtime handoff, automatic runtime injection, automatic promotion, provider/model call, Codex SDK call, or GitHub mutation is created.

## recommended next PR

Add a read-only synthesis/review surface that consumes selected persisted perspective-memory items, or add saved local search views if repeated retrieval workflows become common. Core-facing promotion should wait for a separate explicit product decision.
