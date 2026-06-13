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
