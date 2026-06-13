# Perspective Memory Boundary Review Inbox Report

## Summary

This PR adds a dedicated product-facing inbox for persisted perspective-memory product persistence boundary records. It follows PR #536 by making SQLite-backed boundary records visible and reviewable outside the local memory review queue route.

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

Accepted Augnes memory, product memory writes, review decisions, Core decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, and automatic promotion remain out of scope.

## Next Recommended PR

Implement accepted-memory write design and implementation from reviewed boundary records only if product decision is explicit. Otherwise add a boundary-record review packet/export instead of another checklist layer.
