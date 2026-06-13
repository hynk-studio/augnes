# Perspective Memory Local Review Queue v0.1

## Purpose

`/cockpit/perspective/memory-review-queue/local` is a local-only review queue for Codex candidate drafts created in the local adapter operator flow. It follows PR #533 and PR #534 by giving the selected local candidate draft a visible next product step: queue for perspective-memory review, inspect a bounded memory candidate preview, create a Local Memory Write Proposal, complete a Local Write Proposal Review Checklist, and make local review-only status choices.

This route is non-authoritative. It is not accepted Augnes memory, not review decision, not product DB persistence, not Core decision, not runtime handoff, and not automatic promotion. It does not call provider/model APIs, Codex, Codex SDK, GitHub, or a product database.

## Storage

- Route: `/cockpit/perspective/memory-review-queue/local`
- Storage namespace: `augnes.perspectiveMemory.localReviewQueue.v0.1`
- Queue version: `perspective_memory_local_review_queue.v0.1`
- Queue item version: `perspective_memory_local_review_queue_item.v0.1`
- Preview version: `perspective_memory_candidate_preview.v0.1`
- Source draft list namespace: `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`
- Local write proposal storage namespace: `augnes.perspectiveMemory.localWriteProposals.v0.1`
- Local write proposal review checklist namespace: `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`

The queue payload is:

```json
{
  "queue_version": "perspective_memory_local_review_queue.v0.1",
  "updated_at": "ISO timestamp",
  "items": []
}
```

Items are sorted newest first, deduped by `queue_item_id`, capped at 50, and stored only in browser localStorage.

## Queue Item Fields

Each item stores bounded local review metadata:

- queue ids and timestamps;
- `source_candidate_draft_id`, local status, action, validation result state, refs, hashes, source PR refs, changed file count, warning counts, and bounded review summary;
- `memory_candidate_preview` with title, summary, supporting refs, risk notes, unresolved tensions, and next review action;
- `queue_status` such as `queued_for_memory_review`, `reviewing_locally`, `kept_for_later`, `removed_from_queue`, or `returned_to_candidate_drafts`;
- `review_only_actions` with `can_create_memory_write: false`;
- source state: `current_with_source_candidate_draft`, `source_candidate_draft_stale`, `source_candidate_draft_missing`, or `not_checked`;
- authority boundary flags where local queue only is true and accepted/product/Core/runtime fields are false.

It does not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, secrets, raw diffs, raw review payloads, browser dumps, or private material.

## Operator Flow

The operator flow shows a Perspective-Memory Review Queue panel next to the Local Candidate Draft List. The user selects a local candidate draft, sees whether it is queue-eligible, and clicks `Queue for perspective-memory review`.

Queueing is allowed for a selected local candidate draft when:

- the draft exists;
- local status is `draft_candidate` or `supersedes_previous_candidate`;
- validation result is `PASS` or `PASS with follow-up`;
- validation came from `real_local_validate_execution`;
- the selected draft is current against the current validation hashes;
- authority flags remain local-only and non-authorizing.

Rejected memory candidates are visible in the draft list but are not queue-eligible for memory write review by default. A `PASS with follow-up` queue item includes a warning caveat in the deterministic preview.

## Queue Route

The local route renders:

- queue header and local-only boundary;
- queue item count;
- filters for all, queued, reviewing, kept, removed, and stale/missing source;
- item list and selected item detail;
- bounded memory candidate preview;
- source refs/hashes and warning counts;
- authority boundary;
- local review-only actions: Mark reviewing locally, Keep for later, Remove from queue, and Return to candidate drafts, local note only.
- Local Memory Write Proposal panel with `Create local memory write proposal`, proposed payload, proposal diff summary, local status controls, source queue item state, and Local Write Proposal Review Checklist controls.

The route updates only localStorage. `Remove from queue` marks the item `removed_from_queue`; `Clear queue` clears only the queue namespace.

## Local Memory Write Proposal

The proposal panel turns the selected queue item into a local proposal artifact that answers what could later be written to perspective memory. It stores proposals in `augnes.perspectiveMemory.localWriteProposals.v0.1` and keeps them separate from the queue.

Proposal creation is allowed only for selected queue items with `queued_for_memory_review`, `reviewing_locally`, or `kept_for_later`; `PASS` or `PASS with follow-up`; source candidate local status `draft_candidate` or `supersedes_previous_candidate`; and `current_with_source_candidate_draft`. Removed queue items, rejected memory candidates, BLOCKED results, stale source state, and missing source state do not create write proposals.

The proposal payload includes deterministic fields only: title, summary, `memory_kind=perspective_candidate`, source refs, evidence refs, risk notes, unresolved tensions, carry-forward questions, suggested next review action, and `should_write_to_memory_now: false`.

Proposal controls are local-only: Mark proposal reviewing locally, Keep proposal for later, Reject proposal locally, Mark proposal superseded locally, Clear selected proposal, and Clear all local write proposals. There is no enabled Write to memory, Commit memory, or Accept memory action.

## Local Write Proposal Review Checklist

The checklist panel turns the selected local write proposal into an explicit local readiness gate. It stores checklists in `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1` and keeps them separate from the queue and proposal list.

Checklist gates cover source refs, validation result, proposed payload, raw material exclusions, authority boundary, risk notes, unresolved tensions, carry-forward questions, source state, and final user intent. `pass_follow_up_caveat_reviewed` is required for `PASS with follow-up`; `supersede_impact_reviewed` is required for supersede proposals.

Readiness shows `ready_for_product_persistence_review` and keeps `ready_for_memory_write_now: false`. The checklist status can become `locally_ready_for_product_persistence_review` only after required gates pass and source proposal/queue state remains acceptable. Missing, removed, rejected, or superseded source state blocks readiness.

Checklist controls are local-only: Create local review checklist, Mark checklist in review, Recompute readiness, Mark locally ready for product persistence review, Save checklist note, Clear selected checklist, and Clear all local checklists.

## Stale And Missing Source

The queue route compares queue item hashes with the current local candidate draft list:

- matching hashes show `current_with_source_candidate_draft`;
- changed hashes show `source_candidate_draft_stale`;
- missing source draft ids show `source_candidate_draft_missing`.

Queue items are not auto-updated from source candidate drafts. Requeueing is explicit.

Proposal source state compares `source_queue_item_id` against the current local review queue and shows `source_queue_item_current`, `source_queue_item_status_changed`, `source_queue_item_missing`, or `source_queue_item_removed`. Proposals are not auto-updated when queue items change.

Checklist source proposal state compares `source_proposal_id` against the current local write proposal list and shows `source_proposal_current`, `source_proposal_status_changed`, `source_proposal_missing`, or `source_proposal_removed_or_rejected`. Checklists are not auto-updated when proposals change.

## Verification

- Static smoke: `npm run smoke:perspective-memory-local-review-queue`
- Write proposal smoke: `npm run smoke:perspective-memory-local-write-proposal`
- Checklist smoke: `npm run smoke:perspective-memory-local-write-proposal-review-checklist`
- Operator smoke: `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- Browser report smoke: `npm run browser:perspective-memory-local-review-queue`
- Browser route: `http://127.0.0.1:3000/cockpit/perspective/memory-review-queue/local`
