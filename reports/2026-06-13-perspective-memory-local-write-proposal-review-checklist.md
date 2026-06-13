# Perspective Memory Local Write Proposal Review Checklist Report

## Summary

This report follows PR #534 and PR #535 by describing the explicit local review gate for memory write proposals and the Product Persistence Boundary now created from locally-ready checklists. The write proposal to checklist flow lets a user create a local checklist, check required and conditional gates, add bounded notes, recompute readiness, and see whether the proposal is locally ready for product persistence boundary review.

The checklist itself is local-only and non-authorizing. A separate confirmed boundary action can persist a product-side SQLite boundary record, but it creates no accepted Augnes memory, no product memory write, no review decision, no Core decision, no runtime handoff, no provider/model/Codex/GitHub call, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts`
- `lib/perspective-ingest/perspective-memory-local-write-proposal.ts`
- `lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-memory-local-write-proposal-review-checklist.mjs`
- `scripts/smoke-perspective-memory-product-persistence-boundary.mjs`
- `scripts/smoke-perspective-memory-local-write-proposal.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal-review-checklist.md`
- `reports/2026-06-13-perspective-memory-product-persistence-boundary.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal.md`
- `reports/browser/2026-06-13-perspective-memory-local-review-queue.md`
- `package.json`

## Checklist Behavior

The helper stores checklist lists in `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1` with `checklist_list_version=perspective_memory_local_write_proposal_review_checklist_list.v0.1`, `checklist_version=perspective_memory_local_write_proposal_review_checklist.v0.1`, and `readiness_version=perspective_memory_local_write_proposal_readiness_summary.v0.1`.

The checklist gate model includes always-required gates for source refs, validation result, proposed payload, raw material exclusion, authority boundary, risk notes, unresolved tensions, carry-forward questions, source state, and final user intent. Conditional gates keep local review precise: `pass_follow_up_caveat_reviewed` is required only for `PASS with follow-up`, and `supersede_impact_reviewed` is required only for supersede proposals.

The readiness computation sets `ready_for_product_persistence_review=true` only when every required gate is checked, the source proposal exists and is not rejected or superseded locally, the source queue item is current or its status change has been reviewed, `should_write_to_memory_now=false`, and the proposal authority boundary remains local-only/non-authorizing. `ready_for_memory_write_now` is always false.

The source proposal state tracking reports `source_proposal_current`, `source_proposal_status_changed`, `source_proposal_missing`, or `source_proposal_removed_or_rejected`. Missing, removed, rejected, or superseded sources block readiness.

## UI Behavior

The local queue route now renders a `Local Write Proposal Review Checklist` panel under the selected proposal. Users can create a local checklist, see checklist id/status, check or uncheck gates, save bounded local notes, mark in review, recompute readiness, mark locally ready for product persistence review when gates pass, clear the selected checklist, and clear all local checklists.

The proposal list and detail show checklist status. If ready, the route shows `locally_ready_for_product_persistence_review` while keeping actual memory write unavailable.

## Persistence Boundary

Checklists persist only in browser localStorage. They store bounded proposal refs, source ids, source proposal hash, gate statuses, bounded local notes, readiness summary, and authority boundary flags.

They do not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, secrets, browser dumps, raw diffs, raw review payloads, or private material.

The Product Persistence Boundary panel consumes only locally-ready checklists. The server re-validates the bounded checklist, proposal, queue item, readiness summary, false `ready_for_memory_write_now`, authority flags, and explicit confirmations before writing the SQLite boundary record.

## Browser Validation

Browser validation covers creating a PASS candidate draft, queueing it, creating a local write proposal, creating a local review checklist, checking gates, moving readiness from `not_started` to `in_review`, reaching `locally_ready_for_product_persistence_review`, confirming `ready_for_memory_write_now=false`, creating a product persistence boundary record after confirmations, restoring the persisted record after refresh, unchecking a required gate, and showing blocked source-state caveats when the source queue item is removed.

## Next Recommended PR

Add a minimal persisted boundary record review inbox/dashboard if records need cross-session visibility outside the queue route. Implement actual accepted memory writes only after an explicit product decision and review of the boundary record model.
