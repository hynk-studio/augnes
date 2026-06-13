# Perspective Memory Local Review Queue v0.1

## Purpose

`/cockpit/perspective/memory-review-queue/local` is a local-only review queue for Codex candidate drafts created in the local adapter operator flow. It follows PR #532 by giving the selected local candidate draft a visible next product step: queue for perspective-memory review, inspect a bounded memory candidate preview, and make local review-only status choices.

This route is non-authoritative. It is not accepted Augnes memory, not review decision, not product DB persistence, not Core decision, not runtime handoff, and not automatic promotion. It does not call provider/model APIs, Codex, Codex SDK, GitHub, or a product database.

## Storage

- Route: `/cockpit/perspective/memory-review-queue/local`
- Storage namespace: `augnes.perspectiveMemory.localReviewQueue.v0.1`
- Queue version: `perspective_memory_local_review_queue.v0.1`
- Queue item version: `perspective_memory_local_review_queue_item.v0.1`
- Preview version: `perspective_memory_candidate_preview.v0.1`
- Source draft list namespace: `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`

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

The route updates only localStorage. `Remove from queue` marks the item `removed_from_queue`; `Clear queue` clears only the queue namespace.

## Stale And Missing Source

The queue route compares queue item hashes with the current local candidate draft list:

- matching hashes show `current_with_source_candidate_draft`;
- changed hashes show `source_candidate_draft_stale`;
- missing source draft ids show `source_candidate_draft_missing`.

Queue items are not auto-updated from source candidate drafts. Requeueing is explicit.

## Verification

- Static smoke: `npm run smoke:perspective-memory-local-review-queue`
- Operator smoke: `npm run smoke:perspective-codex-former-local-adapter-operator-flow`
- Browser report smoke: `npm run browser:perspective-memory-local-review-queue`
- Browser route: `http://127.0.0.1:3000/cockpit/perspective/memory-review-queue/local`
