# Perspective Memory Local Review Queue Browser Validation

Route: `/cockpit/perspective/memory-review-queue/local`
URL: `http://127.0.0.1:3000/cockpit/perspective/memory-review-queue/local`

## Result

Passed on local dev server `npm run dev -- -H 127.0.0.1 -p 3000`.

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic
- queue item count visible
- queued item list visible
- select queue item works
- proposal eligibility visible
- Create local memory write proposal works
- proposal id visible
- proposal_status visible
- proposed memory payload visible
- should_write_to_memory_now false visible
- authority boundary visible for proposal
- proposal diff summary visible
- checklist panel visible
- create local review checklist
- checklist id visible
- checklist_status visible
- required gates visible
- PASS proposal has pass_follow_up_caveat_reviewed not_applicable
- checking required gates changes status from not_started to in_review
- final_user_intent_confirmed gate required
- locally_ready_for_product_persistence_review visible after all required gates
- ready_for_memory_write_now false visible
- unchecking one required gate returns to in_review
- PASS with follow-up proposal requires pass_follow_up_caveat_reviewed
- source queue item removal makes checklist blocked or source state caveat visible
- clear selected checklist works
- clear all checklists works
- refresh restores checklist
- no enabled Write to memory / Commit memory / Accept memory / Send to Core controls
- PASS with follow-up proposal includes warning/risk caveat
- Mark proposal reviewing locally works
- Keep proposal for later works
- Reject proposal locally works
- Mark proposal superseded locally works
- clear selected proposal works
- clear all proposals works
- refresh restores proposals
- selected queue item shows already has proposal
- removing queue item makes proposal show missing/removed source state
- memory candidate preview visible
- source refs/hashes visible
- warning counts visible
- authority boundary visible
- filters work
- Mark reviewing locally works
- Keep for later works
- Remove from queue works
- Clear queue works
- refresh preserves queue changes
- stale/missing source draft state visible
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- no clipboard automation
- no provider/model/Codex SDK/GitHub/DB/network behavior
- no accepted memory/review decision/Core decision behavior
- no raw returned envelope/private/provider/token/browser/source/candidate material visible outside the returned envelope textarea

## Evidence

- The queue route rendered `Local Memory Review Queue`, the local-only boundary, queue item count, filters, item list, and selected item detail.
- A queue item created from the operator flow appeared in the list with `queue_status=queued_for_memory_review`, source candidate draft id, local status, validation result state, warning count, and pointer warning count.
- Selecting the queue item showed the bounded memory candidate preview with title, bounded summary, supporting refs, risk notes, unresolved tensions, and next review action.
- Source refs/hashes, returned envelope hash, validation summary hash, authority boundary, and `can_create_memory_write=false` were visible.
- The Local Memory Write Proposal panel showed proposal eligibility for the selected queue item.
- `Create local memory write proposal` created a local proposal in `augnes.perspectiveMemory.localWriteProposals.v0.1`.
- The proposal id, `proposal_status=draft_write_proposal`, proposed memory payload, `should_write_to_memory_now=false`, proposal diff summary, and proposal authority boundary were visible.
- The Local Write Proposal Review Checklist panel was visible for the selected proposal.
- `Create local review checklist` created a checklist in `augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1`.
- The checklist id, `checklist_status`, required gates, readiness summary, `ready_for_product_persistence_review`, and `ready_for_memory_write_now=false` were visible.
- A PASS proposal showed `pass_follow_up_caveat_reviewed` as `not_applicable`.
- Checking required gates moved readiness from `not_started` to `in_review`, and checking `final_user_intent_confirmed` after the other required gates showed `locally_ready_for_product_persistence_review`.
- Unchecking one required gate returned the checklist to `in_review`.
- A PASS with follow-up proposal required `pass_follow_up_caveat_reviewed`.
- Removing the source queue item made the checklist show a blocked readiness/source state caveat.
- `Clear selected checklist` removed only the selected checklist.
- `Clear all local checklists` cleared only the checklist namespace.
- Refresh restored the local checklist from localStorage.
- No enabled Write to memory, Commit memory, Accept memory, or Send to Core control was present.
- A PASS with follow-up queue item proposal included the warning/risk caveat in `risk_notes`.
- `Mark proposal reviewing locally` updated the proposal to `reviewing_write_proposal`.
- `Keep proposal for later` updated the proposal to `kept_for_later`.
- `Reject proposal locally` updated the proposal to `rejected_locally`.
- `Mark proposal superseded locally` updated the proposal to `superseded_locally`.
- `Clear selected proposal` removed only the selected local write proposal.
- `Clear all local write proposals` cleared only the proposal namespace.
- Refresh restored proposals from localStorage.
- Selecting a queue item with an existing proposal showed the already-proposed id and status.
- Removing the source queue item made the proposal show `source_queue_item_removed`; clearing the queue made the proposal show `source_queue_item_missing`.
- Filters for all, queued, reviewing, kept, removed, and stale/missing source changed the visible list as expected.
- `Mark reviewing locally` updated the selected item to `reviewing_locally`.
- `Keep for later` updated the selected item to `kept_for_later`.
- `Remove from queue` updated the selected item to `removed_from_queue`.
- Refresh preserved the queue status change in `augnes.perspectiveMemory.localReviewQueue.v0.1`.
- Clearing the source candidate draft list from the operator flow made the queue route show `source_candidate_draft_missing`.
- `Clear queue` cleared only the local queue namespace.
- External resource probe returned `[]`.
- Console warn/error probe returned `[]`.
- Horizontal overflow was `0` at 390px, 768px, and 1280px.
