# Perspective Memory Local Write Proposal Review Checklist v0.1

## Purpose

The local write proposal review checklist follows PR #534 by adding an explicit gate between a local write proposal and any future product persistence decision. It lets a user review what was checked, what remains risky, and whether the proposal is locally ready for product persistence review.

This checklist is still local-only. It is not accepted Augnes memory, not product DB persistence, not a review decision, not a Core decision, not runtime handoff, and not automatic promotion. It does not call provider/model APIs, Codex, Codex SDK, GitHub, or a product database.

## Storage

- Route: `/cockpit/perspective/memory-review-queue/local`
- Storage namespace: `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`
- Checklist list version: `perspective_memory_local_write_proposal_review_checklist_list.v0.1`
- Checklist item version: `perspective_memory_local_write_proposal_review_checklist.v0.1`
- Readiness summary version: `perspective_memory_local_write_proposal_readiness_summary.v0.1`

The checklist list is bounded to 50 items, sorted newest first, deduped by `checklist_id`, and stored only in browser localStorage.

## User Flow

1. Create or select a local memory write proposal.
2. Select `Create local review checklist`.
3. Review required and conditional gates.
4. Add bounded local review notes.
5. Check required gates.
6. Recompute readiness.
7. If every required gate is checked and source state is acceptable, the checklist shows `locally_ready_for_product_persistence_review`.

Actual memory write remains unavailable. A locally-ready checklist only means the proposal is ready for a future product persistence review.

## Gate Model

Always-required gates:

- `source_refs_reviewed`
- `validation_result_reviewed`
- `proposed_payload_reviewed`
- `raw_material_exclusion_reviewed`
- `authority_boundary_reviewed`
- `risk_notes_reviewed`
- `unresolved_tensions_reviewed`
- `carry_forward_questions_reviewed`
- `source_state_reviewed`
- `final_user_intent_confirmed`

Conditional gates:

- `pass_follow_up_caveat_reviewed` is required for `PASS with follow-up`; it is `not_applicable` for `PASS`.
- `supersede_impact_reviewed` is required for a supersede proposal; it is `not_applicable` for non-supersede proposals.

## Readiness

The readiness summary includes:

- `ready_for_product_persistence_review`
- `ready_for_memory_write_now: false`
- `blocked_reasons`
- `warnings`
- `next_action`

Readiness can become true only when all required gates are checked, the source proposal still exists, the source proposal is not rejected or superseded locally, the source queue item is current or its status change was explicitly reviewed, `should_write_to_memory_now` remains false, and the proposal authority boundary remains local-only/non-authorizing.

If the source proposal is missing, rejected, or superseded, readiness is blocked. If the source queue item is missing or removed, readiness is blocked. If required gates are incomplete, status remains `not_started` or `in_review`.

## Source State

The checklist compares itself against the current local write proposal list:

- `source_proposal_current`
- `source_proposal_status_changed`
- `source_proposal_missing`
- `source_proposal_removed_or_rejected`
- `not_checked`

It also shows source queue item state from the proposal:

- `source_queue_item_current`
- `source_queue_item_status_changed`
- `source_queue_item_missing`
- `source_queue_item_removed`
- `not_checked`

Checklist readiness is recomputed locally. It does not auto-update the proposal, queue item, candidate draft, or product state.

## Local Controls

Allowed local controls:

- Create local review checklist
- Mark checklist in review
- Recompute readiness
- Mark locally ready for product persistence review
- Check or uncheck gates
- Save checklist note
- Clear selected checklist
- Clear all local checklists

There is no enabled Write to memory, Commit memory, Accept memory, Send to Core, review decision, product DB persistence, or automatic promotion control.

## Persistence Boundary

The checklist stores bounded proposal refs, source ids, source proposal hash, gate statuses, bounded local notes, readiness summary, and authority boundary flags.

It does not store raw returned envelope text, raw prompt text, raw source packet, raw candidate payload, hidden reasoning, provider logs, tokens, secrets, browser dumps, raw diffs, raw review payloads, or private material.

## Verification

- Static smoke: `npm run smoke:perspective-memory-local-write-proposal-review-checklist`
- Write proposal smoke: `npm run smoke:perspective-memory-local-write-proposal`
- Queue smoke: `npm run smoke:perspective-memory-local-review-queue`
- Browser route smoke: `npm run browser:perspective-memory-local-review-queue`
