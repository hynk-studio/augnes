# Perspective Memory Local Write Proposal v0.1

## Purpose

Local write proposals follow PR #533 by adding the missing “what would be written to memory?” artifact after a user reviews a local perspective-memory queue item.

The proposal is still local-only. It is not accepted Augnes memory, not product DB persistence, not review decision, not Core decision, not runtime handoff, and not automatic promotion. It does not call provider/model APIs, Codex, Codex SDK, GitHub, or any network service.

## Storage

- Queue route: `/cockpit/perspective/memory-review-queue/local`
- Storage namespace: `augnes.perspectiveMemory.localWriteProposals.v0.1`
- Proposal list version: `perspective_memory_local_write_proposal_list.v0.1`
- Proposal item version: `perspective_memory_local_write_proposal.v0.1`
- Proposed payload version: `perspective_memory_candidate_write_payload.v0.1`

The proposal list is bounded to 50 items, sorted newest first, deduped by `proposal_id`, and stored only in browser localStorage.

## User Flow

1. Create and queue a local candidate draft in the operator flow.
2. Open `/cockpit/perspective/memory-review-queue/local`.
3. Select a queue item.
4. Check proposal eligibility.
5. Select `Create local memory write proposal`.
6. Inspect proposal id, `proposal_status`, proposed memory payload, proposal diff summary, source queue item state, and authority boundary.
7. Update local proposal status or clear proposals.

## Eligibility

`Create local memory write proposal` is allowed only when the selected queue item:

- has queue status `queued_for_memory_review`, `reviewing_locally`, or `kept_for_later`;
- has validation result `PASS` or `PASS with follow-up`;
- came from `draft_candidate` or `supersedes_previous_candidate`;
- has `current_with_source_candidate_draft`;
- keeps `review_only_actions.can_create_memory_write` false;
- keeps `local_queue_only` true and all authorizing fields false.

Removed queue items, rejected memory candidates, BLOCKED results, fixture preview paths, stale source state, and missing source state do not create local write proposals.

## Proposed Payload

`proposed_memory_payload` is deterministic local formatting from the queue item:

- title and summary from `memory_candidate_preview`;
- `memory_kind=perspective_candidate`;
- source refs from supporting refs plus source/prepare refs;
- evidence refs from refs and hashes only;
- risk notes from preview risk notes plus warning counts;
- unresolved tensions from the queue preview;
- carry-forward questions, including whether durable memory is appropriate, whether PASS with follow-up needs another validation pass, and whether an older memory item should be superseded;
- suggested next review action: `Review proposal before any product persistence or Core decision.`;
- `should_write_to_memory_now: false`.

No AI/model call generates proposal text.

## Proposal Diff Summary

`proposal_diff_summary` shows:

- fields included from the queue item;
- fields excluded from the queue item;
- raw material excluded from local proposal persistence;
- authority boundary notes.

The proposal does not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, secrets, raw diffs, raw review payloads, browser dumps, or private material.

## Source Queue Item State

Each proposal compares `source_queue_item_id` against the current local review queue:

- `source_queue_item_current`
- `source_queue_item_status_changed`
- `source_queue_item_missing`
- `source_queue_item_removed`
- `not_checked`

Queue status changes do not silently mutate proposals. Users must create or update proposal state explicitly.

## Local Controls

Allowed local controls:

- Create local memory write proposal
- Mark proposal reviewing locally
- Keep proposal for later
- Reject proposal locally
- Mark proposal superseded locally
- Clear selected proposal
- Clear all local write proposals

There is no enabled Write to memory, Commit memory, or Accept memory action. Actual memory write requires a future product persistence decision.

## Verification

- Static smoke: `npm run smoke:perspective-memory-local-write-proposal`
- Queue smoke: `npm run smoke:perspective-memory-local-review-queue`
- Browser report smoke: `npm run browser:perspective-memory-local-review-queue`
