# Perspective Memory Product Persistence Boundary Review Inbox v0.1

This follows PR #536. Product persistence boundary records are now durable in SQLite, but the local memory review queue route is still centered on browser-local review work. This inbox gives persisted boundary records a dedicated product-facing review surface.

## Route

`/cockpit/perspective/memory-boundary-review-inbox`

The route is separate from `/cockpit/perspective/memory-review-queue/local`. The local queue route creates boundary records from locally-ready checklists. The inbox reviews records after they cross into product persistence boundary storage.

## API And Persistence

The inbox uses the existing same-origin API:

- `GET /api/perspective/memory/product-persistence-boundary/records`
- `PATCH /api/perspective/memory/product-persistence-boundary/records/[recordId]`

The client does not read SQLite directly and does not duplicate store logic. The persistence backend remains `sqlite:lib/db.ts` with the `perspective_memory_product_persistence_boundary_records` table.

## Inbox UI

The inbox renders total record count, active filter, selected record id, route path, API route, persistence backend, record list, and selected record detail.

Filters are client-side after fetching records:

- `all`
- `product_persistence_boundary_recorded`
- `locally_reviewing_boundary_record`
- `kept_for_later`
- `retracted_before_memory_write`
- `PASS`
- `PASS with follow-up`
- `has warnings`
- `retracted or kept`

Each record list item shows status, source validation result, warning/risk indicator, source checklist/proposal/queue/candidate refs, returned envelope hash, timestamps, and authority boundary summary.

The detail view shows source refs/hashes, `proposed_memory_payload`, `proposal_diff_summary`, `checklist_gate_summary`, `local_review_notes`, `user_confirmation`, `next_allowed_actions`, and `authority_boundary`.

## Status Transitions

The inbox can update only `boundary_status`:

- `locally_reviewing_boundary_record`
- `kept_for_later`
- `retracted_before_memory_write`

These PATCH calls do not create memory, Core decisions, review decisions, runtime handoff, or automatic promotion.

## Boundary

The inbox explicitly shows:

- not accepted Augnes memory
- not product memory write
- not review decision
- not Core decision
- not runtime handoff
- not automatic promotion
- `can_create_accepted_memory=false`
- `can_create_core_decision=false`
- `can_auto_promote=false`

Enabled Write to memory, Commit memory, Accept memory, Send to Core, Create Core decision, Deploy, and Auto promote controls are intentionally absent.

## Out Of Scope

Accepted memory writes, product memory writes, Core decisions, review decision records, provider/model calls, Codex SDK calls, GitHub mutation, runtime handoff, and automatic promotion remain out of scope.

## Next

Add explicit accepted-memory write design and implementation from reviewed boundary records only if product decision is explicit. Otherwise add a boundary-record review packet/export rather than another checklist layer.
