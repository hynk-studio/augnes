# Perspective Memory Local Review Queue Report

## Summary

This PR follows PR #532 by giving local Codex candidate drafts a concrete next step. A selected local candidate draft in the operator flow can now be queued for perspective-memory review, and `/cockpit/perspective/memory-review-queue/local` shows a visible local review queue with detail, local review-only actions, and a bounded memory candidate preview.

The flow is still local-only and non-authoritative. It creates no accepted Augnes memory, no review decision, no product DB persistence, no Core decision, no runtime handoff, and no automatic promotion.

## Changed Files

- `lib/perspective-ingest/perspective-memory-local-review-queue.ts`
- `lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx`
- `app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.module.css`
- `app/cockpit/perspective/memory-review-queue/local/page.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx`
- `app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css`
- `scripts/smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/smoke-perspective-memory-local-review-queue.mjs`
- `scripts/browser-smoke-perspective-codex-former-local-adapter-operator-flow.mjs`
- `scripts/browser-smoke-perspective-memory-local-review-queue.mjs`
- `docs/PERSPECTIVE_CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_V0_1.md`
- `docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md`
- `reports/2026-06-12-perspective-codex-former-local-adapter-operator-flow.md`
- `reports/2026-06-13-perspective-memory-local-review-queue.md`
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

## Stale/Missing Source

Queue items compare their source validation hash, source input hash, prepare execution hash, and returned envelope hash with the current local candidate draft list.

Matching hashes show `current_with_source_candidate_draft`. Changed hashes show `source_candidate_draft_stale`. Missing source drafts show `source_candidate_draft_missing`. Queue items are not auto-updated; requeueing is explicit.

## Persistence Boundary

The queue stores bounded refs, hashes, counts, source PR refs, changed file count, bounded review summary, deterministic preview fields, status metadata, and authority boundary flags. It does not store raw returned envelope text, raw prompt/source/candidate/private/provider/token/browser material, raw diffs, or raw review payloads.

The queue persists separately from operator-flow metadata and the local candidate draft list. Clearing the candidate draft list does not clear the queue. `Clear queue` clears only the local queue namespace.

## Browser Validation

Browser validation covers the operator route and queue route: route load, no console warnings/errors, no unexpected external traffic, PASS/PASS with follow-up draft creation and queueing, BLOCKED rejection not queue-eligible for memory write review, queue item id display, queue item count, list selection, preview display, source refs/hashes, warning counts, authority boundary, filters, local review-only actions, refresh restore, stale/missing source display, clear queue, no horizontal overflow at 390px / 768px / desktop, and no clipboard/provider/model/Codex SDK/GitHub/DB/network behavior.

## Out Of Scope

This PR does not create production DB persistence, accepted Augnes memory, review decisions, Core decisions, provider/model API calls, Codex SDK calls, GitHub mutation, runtime handoff, or automatic promotion.

## Next Recommended PR

Add explicit “create local perspective-memory write proposal” from a selected queue item, still local-only and user-confirmed; or design the minimal product persistence boundary for perspective-memory queue items if the product decision is ready.
