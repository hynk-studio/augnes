# Perspective Memory Local Review Queue Report

## Summary

This report now covers the local review queue after PR #533 and the follow-on local write proposal panel. PR #533 gave local Codex candidate drafts a concrete next step: queueing a selected local candidate draft for perspective-memory review. This PR extends that route with a queue item to local write proposal flow so the user can inspect what could later be written to memory before any product persistence decision.

The flow is still local-only and non-authoritative. It creates no accepted Augnes memory, no review decision, no product DB persistence, no Core decision, no runtime handoff, no provider/model/Codex/GitHub call, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-review-queue.ts`
- `lib/perspective-ingest/perspective-memory-local-write-proposal.ts`
- `lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `app/cockpit/perspective/memory-review-queue/local/page.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/smoke-perspective-memory-local-write-proposal.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
- `reports/2026-06-13-perspective-memory-local-write-proposal.md`
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

## Stale/Missing Source

Queue items compare their source validation hash, source input hash, prepare execution hash, and returned envelope hash with the current local candidate draft list.

Matching hashes show `current_with_source_candidate_draft`. Changed hashes show `source_candidate_draft_stale`. Missing source drafts show `source_candidate_draft_missing`. Queue items are not auto-updated; requeueing is explicit.

Write proposals track source queue item state separately. Matching queue item status shows `source_queue_item_current`; changed queue status shows `source_queue_item_status_changed`; removed queue items show `source_queue_item_removed`; and missing queue items show `source_queue_item_missing`. Proposals are not auto-updated when the queue item changes.

## Persistence Boundary

The queue stores bounded refs, hashes, counts, source PR refs, changed file count, bounded review summary, deterministic preview fields, status metadata, and authority boundary flags. The proposal list stores bounded proposal payloads, source refs/hashes, counts, diff summaries, review notes, status metadata, and local-only authority flags. Neither namespace stores raw returned envelope text, raw prompt/source/candidate/private/provider/token/browser material, raw diffs, or raw review payloads.

The queue persists separately from operator-flow metadata and the local candidate draft list. Write proposals persist separately from the queue in `augnes.perspectiveMemory.localWriteProposals.v0.1`. Clearing the candidate draft list does not clear the queue or proposals. `Clear queue` clears only the local queue namespace; proposal clear actions clear only the proposal namespace.

## Browser Validation

Browser validation covers the operator route and queue route: route load, no console warnings/errors, no unexpected external traffic, PASS/PASS with follow-up draft creation and queueing, queue item id display, queue item count, list selection, preview display, source refs/hashes, warning counts, authority boundary, filters, local review-only actions, proposal eligibility, `Create local memory write proposal`, proposal id/status display, proposed memory payload, `should_write_to_memory_now=false`, proposal diff summary, PASS with follow-up risk caveat, proposal status changes, selected/all proposal clearing, refresh restore, already-proposed state, source queue item missing/removed caveat, no horizontal overflow at 390px / 768px / desktop, and no clipboard/provider/model/Codex SDK/GitHub/DB/network behavior.

## Out Of Scope

This PR does not create production DB persistence, accepted Augnes memory, review decisions, Core decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, actual memory writes, or automatic promotion.

## Next Recommended PR

Add a local memory write proposal review checklist with explicit user gates for product persistence readiness. Defer product persistence until there is a clear product decision.
