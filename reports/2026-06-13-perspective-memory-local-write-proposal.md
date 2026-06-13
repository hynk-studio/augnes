# Perspective Memory Local Write Proposal Report

## Summary

This PR follows PR #533 by turning a selected local memory review queue item into a visible local write proposal. The queue item to local write proposal flow lets a user inspect the proposed memory payload, included and excluded fields, risks, unresolved tensions, source refs/hashes, and authority boundary before any persistence decision.

The proposal is still local-only. It creates no accepted Augnes memory, no review decision, no product DB persistence, no Core decision, no runtime handoff, no provider/model/Codex/GitHub call, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-write-proposal.ts`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-memory-local-write-proposal.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
- `reports/browser/2026-06-13-perspective-memory-local-review-queue.md`
- `package.json`

## Local Write Proposal Behavior

The helper stores proposal lists in `augnes.perspectiveMemory.localWriteProposals.v0.1` with `proposal_list_version=perspective_memory_local_write_proposal_list.v0.1`, `proposal_version=perspective_memory_local_write_proposal.v0.1`, and `payload_version=perspective_memory_candidate_write_payload.v0.1`.

An eligible queue item can create a proposal only when the queue item is queued, reviewing, or kept for later; source validation is `PASS` or `PASS with follow-up`; source candidate status is `draft_candidate` or `supersedes_previous_candidate`; the source candidate draft is current; and authority flags remain local-only and false for authorizing behavior. Rejected candidates, removed queue items, stale/missing source drafts, and BLOCKED validation do not create write proposals.

The deterministic payload builder uses only bounded queue item fields. It creates `proposed_memory_payload` with title, summary, `memory_kind=perspective_candidate`, source refs, evidence refs, risk notes, unresolved tensions, carry-forward questions, suggested next review action, and `should_write_to_memory_now: false`.

The proposal diff summary records included queue fields, excluded mutable queue state, excluded raw material, and authority boundary notes. Proposal source queue item state tracking reports `source_queue_item_current`, `source_queue_item_status_changed`, `source_queue_item_removed`, or `source_queue_item_missing` without mutating the proposal.

## UI Behavior

The local queue route now renders a `Local Memory Write Proposal` panel. Users can create a local proposal from the selected queue item, see whether that queue item already has a proposal, inspect proposal details, update proposal status locally, clear the selected proposal, and clear all local proposals.

The UI keeps `can_create_memory_write=false` visible on the source queue item. It does not expose an enabled write, commit, accept, or promote action.

## Persistence Boundary

Write proposals persist only in localStorage. The proposal record stores bounded refs, hashes, counts, deterministic preview-derived payload fields, diff summaries, status metadata, and authority boundary flags.

It does not persist raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, private/provider/token/browser material, hidden reasoning, raw diffs, or raw review payloads.

## Browser Validation

Browser validation covers the operator route and queue route. The operator route creates and queues a PASS local candidate draft. The queue route loads the queue item, shows proposal eligibility, creates a local memory write proposal, displays proposal id/status, renders the proposed memory payload, shows `should_write_to_memory_now=false`, renders the proposal diff summary and authority boundary, updates proposal statuses, clears selected/all proposals, restores proposals after refresh, and shows missing/removed source queue item caveats.

## Next Recommended PR

Add a local memory write proposal review checklist with explicit user gates for product persistence readiness. Product persistence should remain out of scope until the product decision is ready.
