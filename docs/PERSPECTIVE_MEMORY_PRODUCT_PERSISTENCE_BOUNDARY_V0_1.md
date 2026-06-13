# Perspective Memory Product Persistence Boundary v0.1

This follows PR #535. A local write proposal checklist can already reach `locally_ready_for_product_persistence_review`; this boundary creates the first durable product-side record for that readiness.

## Meaning

A product persistence boundary record means a user-confirmed, locally-ready proposal crossed from browser-local review into product persistence boundary review.

It is not accepted Augnes memory. It is not a product memory write, not a Core decision, not a review decision, not runtime handoff, not a provider/model result, not a Codex result, not GitHub mutation, and not automatic promotion.

## Backend

Persistence uses the existing Augnes SQLite product store through `lib/db.ts`. The backend marker is `sqlite:lib/db.ts`. The table is `perspective_memory_product_persistence_boundary_records`, with `record_json` holding the bounded v0.1 record and indexed columns for record id, status, source checklist, source proposal, source queue item, candidate draft, validation hashes, and timestamps.

This was chosen because the repo already uses SQLite for product records, route handlers, and runtime migrations. It is the smallest existing product-facing persistence pattern that is not localStorage-only.

## Record Schema

Records use `record_version=perspective_memory_product_persistence_boundary_record.v0.1`.

Lists use `boundary_record_list_version=perspective_memory_product_persistence_boundary_record_list.v0.1`.

Each record stores bounded refs, hashes, `proposed_memory_payload`, `proposal_diff_summary`, `checklist_gate_summary`, bounded `local_review_notes`, user confirmation flags, `boundary_status`, false write/Core action flags, and an authority boundary.

Raw returned envelope text, raw prompts, raw source packets, raw candidate payloads, hidden reasoning, provider logs, tokens, browser dumps, raw diffs, and private material are not persisted.

## Server-Side Validation

The API performs server-side validation before any boundary record is written.

The POST route is:

`/api/perspective/memory/product-persistence-boundary/records`

The server safe-parses the submitted checklist, proposal, and queue item, then re-runs eligibility. It requires:

- checklist status `locally_ready_for_product_persistence_review`
- `ready_for_product_persistence_review=true`
- `ready_for_memory_write_now=false`
- source proposal present and not rejected or superseded
- source queue item present and not removed
- proposal payload `should_write_to_memory_now=false`
- queue `can_create_memory_write=false`
- local-only authority boundaries with authorizing fields false
- explicit user confirmations for not accepted memory, not Core decision, and no automatic promotion

Malformed or ineligible requests return BLOCKED-style JSON with `blocked_reasons`.

## UI

The local memory review queue route adds a Product Persistence Boundary panel. The user can see eligibility, check three confirmations, create the record, inspect persisted record list/detail, and update `boundary_status` to:

- `locally_reviewing_boundary_record`
- `kept_for_later`
- `retracted_before_memory_write`

The UI shows `can_create_accepted_memory=false`, `can_create_core_decision=false`, and `can_auto_promote=false`.

## Out Of Scope

Accepted memory writes, Core decisions, review decision records, provider/model calls, Codex SDK calls, GitHub mutation, runtime handoff, and automatic promotion remain out of scope.

## Next

Add a minimal persisted boundary record review inbox/dashboard if records need cross-session visibility outside the queue route. Implement actual accepted memory writes only after an explicit product decision.
