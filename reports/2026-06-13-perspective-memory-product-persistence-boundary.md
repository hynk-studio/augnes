# Perspective Memory Product Persistence Boundary Report

## Summary

This PR implements the minimal product persistence boundary for locally-ready perspective-memory write proposals. It adds a user-confirmed product-side boundary record that is persisted through the existing SQLite product store, while keeping accepted Augnes memory, product memory writes, Core decisions, review decision records, runtime handoff, provider/model calls, Codex SDK calls, GitHub mutation, and automatic promotion out of scope.

## why this follows PR #535

PR #535 let a local write proposal checklist reach `locally_ready_for_product_persistence_review`, but that readiness still lived only in browser localStorage. This PR adds the missing product step: a locally-ready checklist can cross into a durable product persistence boundary record after explicit user confirmation.

## persistence backend chosen

The backend is the existing Augnes SQLite product store through `lib/db.ts`. The new table is `perspective_memory_product_persistence_boundary_records`, with `record_json` holding the bounded v0.1 record and indexed columns for source ids, status, hashes, and timestamps.

SQLite was chosen because the repo already uses `lib/db.ts`, `lib/db/schema.sql`, route handlers, and migration helpers for product-side records. This is the smallest existing product-facing persistence pattern that is not localStorage-only.

## Boundary Record Behavior

The local memory review queue route now includes a Product Persistence Boundary panel. A selected checklist that is `locally_ready_for_product_persistence_review` can create a record only after the user confirms:

- this is not accepted Augnes memory;
- this is not a Core decision;
- this will not automatically promote or write memory.

The persisted record stores bounded refs, hashes, proposed memory payload preview, proposal diff summary, checklist gate summary, bounded review notes, user confirmation flags, `boundary_status`, disabled write/Core action flags, and authority boundary flags.

The record can move through local boundary review statuses: `locally_reviewing_boundary_record`, `kept_for_later`, and `retracted_before_memory_write`.

The persisted boundary record review inbox at `/cockpit/perspective/memory-boundary-review-inbox` now provides the dedicated product-facing cross-session view for these SQLite records outside the local queue route.

## server-side validation

The POST API at `/api/perspective/memory/product-persistence-boundary/records` safe-parses the submitted checklist, proposal, and queue item before writing. It rejects malformed or ineligible input with BLOCKED-style JSON and `blocked_reasons`.

Validation requires a ready checklist, `ready_for_memory_write_now=false`, a non-rejected/non-superseded proposal, a non-removed source queue item, proposal payload `should_write_to_memory_now=false`, queue `can_create_memory_write=false`, local-only/non-authorizing authority boundaries, explicit confirmation flags, checked required gates, and no unsafe raw-material markers.

The PATCH API updates only `boundary_status`. It does not create memory, Core decisions, or review decisions.

## browser validation

Browser validation covers the operator route and queue route: PASS candidate draft creation, queueing, local write proposal creation, checklist readiness, Product Persistence Boundary panel visibility, disabled create button before confirmations, persisted record creation, persisted record detail, proposed payload display, checklist gate summary display, user confirmation display, authority boundary display, false write/Core/auto-promotion flags, refresh restore, boundary status transitions, responsive widths, and no external provider/model/Codex SDK/GitHub behavior.

## Out Of Scope

This PR does not create accepted Augnes memory, product memory writes, review decisions, Core decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, or automatic promotion.

## Next Recommended PR

Use the persisted boundary review inbox for cross-session boundary record review. Implement actual accepted memory writes only after an explicit product decision and review of the boundary record model.
