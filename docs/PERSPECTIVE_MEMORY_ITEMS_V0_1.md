# Perspective Memory Items V0.1

This follows PR #537. Boundary records made locally-ready write proposals durable in SQLite, but they were still only review boundary records. This slice adds the explicit product decision: a reviewed boundary record can create a persisted perspective-memory item.

Route:
- `/cockpit/perspective/memory-items`
- `/cockpit/perspective/memory-items/search`

API:
- `GET /api/perspective/memory/items`
- `POST /api/perspective/memory/items`
- `GET /api/perspective/memory/items/[itemId]`
- `PATCH /api/perspective/memory/items/[itemId]`

Persistence backend:
- `sqlite:lib/db.ts`
- table: `perspective_memory_items`

## Product Meaning

A perspective-memory item is a product-level durable memory object created from a reviewed product persistence boundary record. It is visible in the memory items dashboard and can be used by future perspective-memory review, retrieval, synthesis, or dashboard surfaces.

It is not Core memory, not a Core decision, not automatic runtime injection, not automatic runtime context injection, not automatic promotion, not runtime handoff, not provider/model generated, not a Codex SDK result, and not GitHub mutation.

## Creation Flow

The boundary review inbox now includes a Perspective Memory Item panel. A user selects a persisted boundary record, reviews eligibility, checks confirmation boxes, and clicks `Create persisted perspective-memory item`.

The create API accepts only:

```json
{
  "source_boundary_record_id": "perspective-memory-boundary:...",
  "user_confirmation": {
    "user_confirmed_create_persisted_perspective_memory_item": true,
    "user_confirmed_not_core_decision": true,
    "user_confirmed_no_automatic_runtime_injection": true,
    "user_confirmed_source_boundary_record_preserved": true
  }
}
```

The server fetches the source boundary record from SQLite and validates eligibility server-side. Browser-local checklist, proposal, or queue objects are not trusted for item creation.

## Eligibility

A boundary record can create an item only when:
- boundary status is `product_persistence_boundary_recorded` or `locally_reviewing_boundary_record`
- boundary status is not `retracted_before_memory_write`
- checklist readiness is true for product persistence review
- `checklist_ready_for_memory_write_now` remains false
- `proposed_memory_payload.should_write_to_memory_now` remains false
- boundary authority flags still show no accepted memory, product memory write, Core decision, runtime handoff, or automatic promotion
- Core and auto-promote allowed actions remain false
- all user confirmations are true
- unsafe/raw markers are absent from the persisted item

## Item Schema

The item uses:
- `item_version: "perspective_memory_item.v0.1"`
- `content.content_version: "perspective_memory_item_content.v0.1"`
- `memory_kind: "perspective_candidate"`
- `item_status: "accepted" | "reviewing" | "retracted" | "superseded" | "deprecated"`

The item stores bounded refs, hashes, title, summary, risk notes, unresolved tensions, carry-forward questions, acceptance confirmation, source boundary snapshot, availability flags, and authority boundary.

It does not store raw returned envelope text, raw prompt/source packet, raw candidate payload, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, private material, or raw review payloads.

## Idempotency

`source_boundary_record_id` is unique. Repeating creation for the same boundary record returns the existing item with an idempotent replay response instead of creating duplicates.

## Dashboard

The `/cockpit/perspective/memory-items` dashboard shows:
- total item count
- active filter
- item list and selected detail
- content preview
- source boundary refs and hashes
- risk notes, unresolved tensions, and carry-forward questions
- acceptance confirmation
- source boundary snapshot
- availability flags
- authority boundary

Filters include all statuses, PASS/PASS with follow-up, has warnings, active-ish, and inactive-ish.

Status controls update only `item_status`:
- Mark item accepted
- Mark item reviewing
- Retract item
- Mark item superseded
- Mark item deprecated

The dashboard does not enable Send to Core, Create Core decision, Auto inject into runtime, Auto promote, Provider/model enrich, GitHub mutation, Commit state entry, Deploy, or runtime handoff.

## Read-Only Search

The dashboard links to `/cockpit/perspective/memory-items/search` with the label `Search persisted perspective-memory items`.

The search route is a retrieval-only surface for persisted perspective-memory items. It searches bounded title, summary, source refs, evidence refs, source lineage, hashes, risk notes, unresolved tensions, carry-forward questions, and suggested next review action. It returns deterministic match metadata and snippets through `GET /api/perspective/memory/items` when `q`, `search`, `source_validation_result_state`, `active_state`, or `has_warnings` query params are present.

The search route does not expose status mutation controls, item creation controls, boundary creation controls, Core controls, runtime controls, provider/model controls, Codex SDK controls, GitHub mutation controls, state entry controls, or deployment controls. It uses no vector search and no embeddings.

## Browser Validation

Browser validation covers operator flow creation, local queue proposal/checklist readiness, boundary record creation, item creation from the boundary inbox, and the dedicated memory items dashboard. The validation uses an isolated `AUGNES_DB_PATH` and confirms refresh persistence through API/SQLite.

## Out Of Scope

This PR does not implement Core-facing promotion, Core memory, runtime prompt injection, provider/model enrichment, GitHub mutation, automatic promotion, or retrieval/synthesis consumption.

## Recommended Next PR

Add a read-only synthesis/review surface that consumes selected persisted perspective-memory items, or add saved local search views if repeated retrieval workflows become common. Only design Core-facing promotion after a separate explicit product decision.
