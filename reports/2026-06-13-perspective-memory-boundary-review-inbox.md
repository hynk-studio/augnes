# Perspective Memory Boundary Review Inbox Report

## Summary

This PR adds a dedicated product-facing inbox for persisted perspective-memory product persistence boundary records. It follows PR #536 by making SQLite-backed boundary records visible and reviewable outside the local memory review queue route. The inbox now also hosts the product step that creates persisted perspective-memory items from eligible reviewed boundary records.

## Why This Follows PR #536

PR #536 created durable product persistence boundary records through same-origin API routes and `sqlite:lib/db.ts`. Those records were still mainly surfaced inside `/cockpit/perspective/memory-review-queue/local`, which is a browser-local review workflow. The new inbox gives persisted records their own cross-session review route.

## Route

`/cockpit/perspective/memory-boundary-review-inbox`

The route shows the route path, API route, persistence backend, total record count, active filter, selected record id, record list, and record detail.

## API And Persistence

The inbox uses:

- `GET /api/perspective/memory/product-persistence-boundary/records`
- `PATCH /api/perspective/memory/product-persistence-boundary/records/[recordId]`

The client does not read SQLite directly and does not duplicate store logic. Persistence remains `sqlite:lib/db.ts` in `perspective_memory_product_persistence_boundary_records`.

## Filters

Filters are available for all records, boundary status values, `PASS`, `PASS with follow-up`, has warnings, and retracted-or-kept records.

## Record Detail

The detail panel surfaces source checklist/proposal/queue/candidate refs, validation hashes, source input and prepare hashes, returned envelope hash, `proposed_memory_payload`, `proposal_diff_summary`, `checklist_gate_summary`, `local_review_notes`, `user_confirmation`, `next_allowed_actions`, and `authority_boundary`.

## Perspective-Memory Item Panel

The inbox includes a Perspective Memory Item panel for the selected boundary record. The panel shows item eligibility, blocked reasons, existing item id/status when present, confirmation checkboxes, and the `Create persisted perspective-memory item` action. It links to `/cockpit/perspective/memory-items`.

Item creation is server-side through `/api/perspective/memory/items`; the client submits only `source_boundary_record_id` and confirmation flags. The server reloads the boundary record from `sqlite:lib/db.ts` and validates it before writing the item.

## Status Transitions

The inbox can update only `boundary_status` to:

- `locally_reviewing_boundary_record`
- `kept_for_later`
- `retracted_before_memory_write`

No memory write, review decision, Core decision, runtime handoff, or automatic promotion is created.

## Boundary

The UI explicitly shows that records are not accepted Augnes memory, not product memory writes, not review decisions, not Core decisions, not runtime handoff, and not automatic promotion. It shows `can_create_accepted_memory=false`, `can_create_core_decision=false`, `can_auto_promote=false`, `product_memory_write_created=false`, and `accepted_augnes_memory_created=false`.

## Browser Validation

Browser validation covers operator flow candidate creation, queueing, local write proposal creation, checklist readiness, product persistence boundary record creation, inbox route loading, persisted record list/detail, filters, status updates, refresh persistence through API/SQLite, navigation links, responsive widths, and no enabled Write to memory / Commit memory / Accept memory / Send to Core controls.

## Out Of Scope

Core decisions, Core memory, review decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, automatic runtime injection, and automatic promotion remain out of scope.

## Next Recommended PR

Add a read-only retrieval/search surface for persisted perspective-memory items. Core-facing promotion should wait for a separate explicit product decision.
