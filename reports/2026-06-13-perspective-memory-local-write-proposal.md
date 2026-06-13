# Perspective Memory Local Write Proposal Report

## Summary

This report covers the local write proposal after PR #534, the follow-on Local Write Proposal Review Checklist, and the Product Persistence Boundary that now consumes locally-ready checklists. PR #534 turned a selected local memory review queue item into a visible local write proposal; the current boundary step gives a locally-ready proposal a durable product-side handoff record.

The proposal itself remains local-only. The separate boundary record is product-side SQLite persistence, but it creates no accepted Augnes memory, no product memory write, no review decision, no Core decision, no runtime handoff, no provider/model/Codex/GitHub call, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-write-proposal.ts`
- `lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts`
- `lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-memory-local-write-proposal.mjs`
- `scripts/smoke-perspective-memory-local-write-proposal-review-checklist.mjs`
- `scripts/smoke-perspective-memory-product-persistence-boundary.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal-review-checklist.md`
- `reports/2026-06-13-perspective-memory-product-persistence-boundary.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
- `reports/browser/2026-06-13-perspective-memory-local-review-queue.md`
- `package.json`

## Local Write Proposal Behavior

The helper stores proposal lists in `augnes.perspectiveMemory.localWriteProposals.v0.1` with `proposal_list_version=perspective_memory_local_write_proposal_list.v0.1`, `proposal_version=perspective_memory_local_write_proposal.v0.1`, and `payload_version=perspective_memory_candidate_write_payload.v0.1`.

An eligible queue item can create a proposal only when the queue item is queued, reviewing, or kept for later; source validation is `PASS` or `PASS with follow-up`; source candidate status is `draft_candidate` or `supersedes_previous_candidate`; the source candidate draft is current; and authority flags remain local-only and false for authorizing behavior. Rejected candidates, removed queue items, stale/missing source drafts, and BLOCKED validation do not create write proposals.

The deterministic payload builder uses only bounded queue item fields. It creates `proposed_memory_payload` with title, summary, `memory_kind=perspective_candidate`, source refs, evidence refs, risk notes, unresolved tensions, carry-forward questions, suggested next review action, and `should_write_to_memory_now: false`.

The proposal diff summary records included queue fields, excluded mutable queue state, excluded raw material, and authority boundary notes. Proposal source queue item state tracking reports `source_queue_item_current`, `source_queue_item_status_changed`, `source_queue_item_removed`, or `source_queue_item_missing` without mutating the proposal.

The queue item to local write proposal flow remains the user-visible bridge from local memory review to proposal inspection.

## UI Behavior

The local queue route now renders a `Local Memory Write Proposal` panel. Users can create a local proposal from the selected queue item, see whether that queue item already has a proposal, inspect proposal details, update proposal status locally, clear the selected proposal, and clear all local proposals.

The UI keeps `can_create_memory_write=false` visible on the source queue item. It does not expose an enabled write, commit, accept, or promote action.

## Local Write Proposal Review Checklist

The selected proposal now has a `Local Write Proposal Review Checklist` panel backed by `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`. The checklist stores bounded gate statuses, source proposal state, source queue item state, readiness summary, and bounded local notes.

The checklist has required gates for source refs, validation result, proposed payload, raw material exclusion, authority boundary, risk notes, unresolved tensions, carry-forward questions, source state, and final user intent. `pass_follow_up_caveat_reviewed` is required for `PASS with follow-up`; `supersede_impact_reviewed` is required for supersede proposals.

Readiness can show `locally_ready_for_product_persistence_review` only when all required gates pass and source state remains acceptable. `ready_for_memory_write_now` remains false.

## Persistence Boundary

Write proposals and review checklists persist only in localStorage. The Product Persistence Boundary action creates a separate SQLite record through `/api/perspective/memory/product-persistence-boundary/records` only when the selected checklist is locally ready and the user confirms the non-authorizing boundary. The proposal record stores bounded refs, hashes, counts, deterministic preview-derived payload fields, diff summaries, status metadata, and authority boundary flags. The checklist record stores bounded source refs, source proposal hash, gate statuses, bounded notes, readiness summary, and authority boundary flags.

It does not persist raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, private/provider/token/browser material, hidden reasoning, raw diffs, or raw review payloads.

## Browser Validation

Browser validation covers the operator route and queue route. The operator route creates and queues a PASS local candidate draft. The queue route loads the queue item, creates a local memory write proposal, creates a local review checklist, checks required gates, shows `locally_ready_for_product_persistence_review`, keeps `ready_for_memory_write_now=false`, creates a product persistence boundary record after confirmations, restores the persisted record after refresh, and shows source-state caveats.

## Next Recommended PR

Add a minimal persisted boundary record review inbox/dashboard if records need cross-session visibility outside the queue route. Implement actual accepted memory writes only after an explicit product decision and review of the boundary record model.
