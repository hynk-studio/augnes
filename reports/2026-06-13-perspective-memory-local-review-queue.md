# Perspective Memory Local Review Queue Report

## Summary

This report now covers the local review queue after PR #533, the local write proposal panel from PR #534, the Local Write Proposal Review Checklist from PR #535, and the Product Persistence Boundary panel. The route now carries a selected local candidate draft through queue review, local write proposal inspection, local checklist readiness, and an explicit product persistence boundary record.

Queue, proposal, and checklist state remain browser-local and non-authoritative. The new boundary action creates a durable product-side SQLite boundary record after explicit confirmation. It still creates no accepted Augnes memory, no product memory write, no review decision, no Core decision, no runtime handoff, no provider/model/Codex/GitHub call, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-review-queue.ts`
- `lib/perspective-ingest/perspective-memory-local-write-proposal.ts`
- `lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts`
- `lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts`
- `lib/perspective-ingest/perspective-memory-product-persistence-boundary-store.ts`
- `lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts`
- `lib/db.ts`
- `lib/db/schema.sql`
- `app/api/perspective/memory/product-persistence-boundary/records/route.ts`
- `app/api/perspective/memory/product-persistence-boundary/records/[recordId]/route.ts`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `app/cockpit/perspective/memory-review-queue/local/page.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/smoke-perspective-memory-local-write-proposal.mjs`
- `scripts/smoke-perspective-memory-local-write-proposal-review-checklist.mjs`
- `scripts/smoke-perspective-memory-product-persistence-boundary.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal-review-checklist.md`
- `reports/2026-06-13-perspective-memory-product-persistence-boundary.md`
- `reports/browser/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/browser/2026-06-13-perspective-memory-local-review-queue.md`
- `package.json`

## Local Queue Behavior

The new helper stores queue payloads in `augnes.perspectiveMemory.localReviewQueue.v0.1` with `queue_version=perspective_memory_local_review_queue.v0.1` and `item_version=perspective_memory_local_review_queue_item.v0.1`.

The operator flow lets the user select a local candidate draft and choose `Queue for perspective-memory review`. Queueing appends a new item, preserves existing items, dedupes by queue item id, sorts newest first, and caps the list at 50.

Queue items can be built from `draft_candidate` and `supersedes_previous_candidate` drafts when validation is `PASS` or `PASS with follow-up`, validation source is `real_local_validate_execution`, and the selected draft is current against validation hashes. `rejected_memory_candidate`, BLOCKED, fixture preview, and stale/no-current validation paths do not create memory-review queue items.

## Queue Route Behavior

The local route renders a visible local review queue with filters for all, `queued_for_memory_review`, `reviewing_locally`, `kept_for_later`, `removed_from_queue`, and stale/missing source. Selecting an item shows queue status, source candidate draft refs/hashes, warning counts, pointer warning counts, authority boundary, and review-only controls.

The bounded memory candidate preview is deterministic local formatting from draft metadata. It includes title, bounded summary, supporting refs, risk notes, unresolved tensions, and next review action. It does not use AI/model calls.

Local review-only actions update queue status in localStorage:

- `Mark reviewing locally`
- `Keep for later`
- `Remove from queue`
- `Return to candidate drafts, local note only`

`can_create_memory_write` remains false.

## Local Write Proposal Behavior

The queue route now includes a `Local Memory Write Proposal` panel backed by `augnes.perspectiveMemory.localWriteProposals.v0.1`. The proposal list uses `proposal_list_version=perspective_memory_local_write_proposal_list.v0.1`, `proposal_version=perspective_memory_local_write_proposal.v0.1`, and `payload_version=perspective_memory_candidate_write_payload.v0.1`.

An eligible queue item can create a local proposal when its queue status is `queued_for_memory_review`, `reviewing_locally`, or `kept_for_later`; source validation is `PASS` or `PASS with follow-up`; source candidate local status is `draft_candidate` or `supersedes_previous_candidate`; the source candidate draft is current; and all authority flags remain non-authorizing. Removed queue items, rejected memory candidates, stale/missing source drafts, and BLOCKED validation do not create proposals.

The deterministic payload builder copies bounded preview fields, refs, hashes, warning counts, and review prompts into `proposed_memory_payload`. It sets `should_write_to_memory_now: false` and adds carry-forward questions for user review. The `proposal diff summary` lists included queue fields, excluded mutable queue data, excluded raw material, and authority boundary notes.

Proposals append without overwriting, dedupe by proposal id, cap at 50, and support local status changes: `reviewing_write_proposal`, `kept_for_later`, `rejected_locally`, and `superseded_locally`. The panel also shows whether the selected queue item already has a proposal.

## Local Write Proposal Review Checklist

The queue route now includes a `Local Write Proposal Review Checklist` panel backed by `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`. The checklist list uses `checklist_list_version=perspective_memory_local_write_proposal_review_checklist_list.v0.1`, `checklist_version=perspective_memory_local_write_proposal_review_checklist.v0.1`, and `readiness_version=perspective_memory_local_write_proposal_readiness_summary.v0.1`.

The checklist gate model requires source refs, validation result, proposed payload, raw material exclusions, authority boundary, risk notes, unresolved tensions, carry-forward questions, source state, and final user intent. Conditional gates require `pass_follow_up_caveat_reviewed` for `PASS with follow-up` and `supersede_impact_reviewed` for supersede proposals.

Readiness can show `locally_ready_for_product_persistence_review` only when all required gates pass and source state remains acceptable. The readiness summary exposes `ready_for_product_persistence_review`, `ready_for_memory_write_now=false`, blocked reasons, warnings, and next action. This does not create actual memory writes.

## Product Persistence Boundary Behavior

The queue route now includes a `Product Persistence Boundary` panel backed by `/api/perspective/memory/product-persistence-boundary/records` and the existing SQLite product store through `lib/db.ts`.

A selected checklist can create a boundary record only when it is `locally_ready_for_product_persistence_review`, `ready_for_product_persistence_review=true`, `ready_for_memory_write_now=false`, the source proposal is still acceptable, the source queue item is not removed, and all authority boundaries remain non-authorizing. The user must confirm that the record is not accepted Augnes memory, not a Core decision, and not automatic promotion.

The persisted record stores bounded refs, hashes, proposed payload preview, proposal diff summary, checklist gate summary, user confirmation flags, boundary status, false write/Core action flags, and authority boundary. It does not store raw returned envelope text, raw prompt/source/candidate material, provider logs, tokens, browser dumps, raw diffs, or private material.

Boundary status updates are limited to `locally_reviewing_boundary_record`, `kept_for_later`, and `retracted_before_memory_write`.

## Stale/Missing Source

Queue items compare their source validation hash, source input hash, prepare execution hash, and returned envelope hash with the current local candidate draft list.

Matching hashes show `current_with_source_candidate_draft`. Changed hashes show `source_candidate_draft_stale`. Missing source drafts show `source_candidate_draft_missing`. Queue items are not auto-updated; requeueing is explicit.

Write proposals track source queue item state separately. Matching queue item status shows `source_queue_item_current`; changed queue status shows `source_queue_item_status_changed`; removed queue items show `source_queue_item_removed`; and missing queue items show `source_queue_item_missing`. Proposals are not auto-updated when the queue item changes.

Checklists track source proposal state separately. Matching proposal state shows `source_proposal_current`; changed proposal status shows `source_proposal_status_changed`; missing proposals show `source_proposal_missing`; rejected or superseded proposals show `source_proposal_removed_or_rejected`. Checklists are not auto-updated when the proposal changes.

## Persistence Boundary

The queue stores bounded refs, hashes, counts, source PR refs, changed file count, bounded review summary, deterministic preview fields, status metadata, and authority boundary flags. The proposal list stores bounded proposal payloads, source refs/hashes, counts, diff summaries, review notes, status metadata, and local-only authority flags. The checklist list stores bounded proposal refs, source ids, source proposal hash, gate statuses, bounded local notes, readiness summary, and local-only authority flags. The product persistence boundary table stores bounded boundary records in SQLite. None of these stores contain raw returned envelope text, raw prompt/source/candidate/private/provider/token/browser material, raw diffs, or raw review payloads.

The queue persists separately from operator-flow metadata and the local candidate draft list. Write proposals persist separately from the queue in `augnes.perspectiveMemory.localWriteProposals.v0.1`. Checklists persist separately in `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`. Boundary records persist separately in `perspective_memory_product_persistence_boundary_records`. Clearing the candidate draft list does not clear the queue, proposals, checklists, or persisted boundary records.

## Browser Validation

Browser validation covers the operator route and queue route: route load, no console warnings/errors, no unexpected external traffic, PASS/PASS with follow-up draft creation and queueing, queue item id display, queue item count, list selection, preview display, source refs/hashes, warning counts, authority boundary, filters, local review-only actions, proposal eligibility, `Create local memory write proposal`, proposal id/status display, proposed memory payload, `should_write_to_memory_now=false`, proposal diff summary, `Create local review checklist`, required and conditional gates, `locally_ready_for_product_persistence_review`, `ready_for_memory_write_now=false`, Product Persistence Boundary panel, confirmation checkboxes, disabled create button until confirmations are checked, persisted boundary record id/detail, boundary status transitions, refresh restore, no horizontal overflow at 390px / 768px / desktop, and no clipboard/provider/model/Codex SDK/GitHub/network behavior except same-origin app/API routes.

## Out Of Scope

This PR does not create accepted Augnes memory, product memory writes, review decisions, Core decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, or automatic promotion.

## Next Recommended PR

Add a minimal persisted boundary record review inbox/dashboard if records need cross-session visibility outside the queue route. Implement actual accepted memory writes only after an explicit product decision and review of the boundary record model.
