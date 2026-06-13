# Perspective Codex Former Local Adapter Operator Flow Browser Validation

Route: `/cockpit/perspective/codex-former/local-adapter-operator-flow`
URL: `http://127.0.0.1:3000/cockpit/perspective/codex-former/local-adapter-operator-flow`

## Result

Passed on local dev server `npm run dev -- -H 127.0.0.1 -p 3000`.

## Checks

- route loads successfully
- No console warnings/errors
- No unexpected external traffic
- source/prepare panel visible
- copy-for-Codex panel visible
- copy-for-Codex panel includes bounded Codex-ready task/context/contract packet
- returned envelope textarea visible
- Load PASS envelope fixture works
- Run local validation returns PASS
- Select Mark as perspective candidate
- Create local perspective candidate draft
- draft appears in local candidate draft list
- Queue selected candidate draft for perspective-memory review
- queue item id visible
- local-only queue boundary visible
- Open local memory review queue route reference visible
- Draft id visible in list
- local_status visible in list
- authority boundary visible in list
- refresh restores local candidate draft list
- Load PASS with follow-up envelope fixture works
- Run local validation returns PASS with follow-up
- create second draft from PASS with follow-up
- queue PASS with follow-up draft with warning caveat visible
- list shows two drafts
- warning counts visible for PASS with follow-up draft
- Load BLOCKED envelope fixture works
- Run local validation returns BLOCKED
- Mark as perspective candidate unavailable
- Reject as memory candidate can create local rejection draft
- list shows rejection draft
- rejected_memory_candidate is not queue-eligible for memory write review
- Supersede previous candidate requires previous draft ref
- supersede draft appears with supersedes_draft_id
- select draft from list works
- clear selected draft removes only that draft
- clear all drafts removes list
- editing returned envelope after draft creation marks drafts stale/current correctly
- malformed pasted envelope returns visible blocked reasons
- validation source says real_local_validate_execution
- Preview fixture result remains secondary
- candidate actions can be selected
- BLOCKED local validation resets selected local action to keep_review_only
- malformed local validation resets selected local action to keep_review_only
- refresh after BLOCKED does not restore stale accept_as_perspective_candidate
- refresh after malformed does not restore stale accept_as_perspective_candidate
- refresh after BLOCKED rejection draft restores rejected_memory_candidate without stale accept action
- localStorage draft updates validation_result_state
- localStorage candidate draft list restores separately from operator draft metadata
- localStorage memory review queue restores separately from operator draft metadata
- localStorage draft survives refresh for bounded metadata
- Clear local draft does not clear candidate draft list
- Clear local candidate draft list does not clear memory review queue
- no automatic clipboard behavior
- no provider/model/Codex SDK/GitHub/DB/network behavior
- no accepted state/review decision/Core decision behavior
- 390px viewport had no horizontal overflow
- 768px viewport had no horizontal overflow
- desktop viewport had no horizontal overflow
- no raw private/provider/token/browser/source/candidate material visible outside the returned envelope textarea

## Evidence

- Initial route had one returned envelope textarea, one `Run local validation` button, and one `Preview fixture result` button.
- PASS fixture local validation rendered `result_state=PASS`, `execution_result=success`, `candidate_count=1`, `validation_source=real_local_validate_execution`, and a visible local validation summary hash.
- PASS fixture -> Run local validation -> Mark as perspective candidate enabled `Create local perspective candidate draft`; the draft appeared in the Local Candidate Draft List with visible `draft_id`, `local_status=draft_candidate`, validation result, source/prepare refs, returned envelope hash, warning counts, and authority boundary with no accepted Augnes state, review decision, product DB persistence, Core decision, runtime handoff, or automatic promotion.
- Queue selected candidate draft for perspective-memory review created a visible local queue item id, showed the local-only queue boundary, and rendered the Open local memory review queue route reference.
- Refresh restored the local memory review queue separately from operator draft metadata and the candidate draft list.
- Refresh restored the separate local candidate draft list from `augnes.codexFormer.localAdapterAcceptedCandidateDraftList.v0.1`.
- Refresh also restored the bounded operator validation metadata visibly, including `validation_result_state=PASS` and `validation_result_source=real_local_validate_execution`.
- PASS with follow-up fixture local validation rendered `result_state=PASS with follow-up`, `execution_result=success`, `candidate_count=1`, `validation_source=real_local_validate_execution`, and warning material.
- PASS with follow-up -> Mark as perspective candidate -> Create local perspective candidate draft appended a second list item and rendered warning and pointer-warning counts from the local validation result.
- Queueing the PASS with follow-up draft kept the warning caveat visible in the queue panel and did not overwrite the earlier queue item.
- BLOCKED fixture local validation rendered `result_state=BLOCKED`, `execution_result=blocked`, `failure_kind=dry_run_blocked`, `candidate_count=0`, and visible blocked reasons.
- BLOCKED fixture kept Mark as perspective candidate unavailable. Selecting Reject as memory candidate enabled `Create local memory rejection draft`, which appended a `local_status=rejected_memory_candidate` list item.
- The `rejected_memory_candidate` row remained visible but was not queue-eligible for memory write review.
- Supersede previous candidate kept `Create local supersede draft` disabled until `supersede_previous_candidate_ref` was non-empty; the created supersede draft showed `supersedes_draft_id`.
- Selecting a draft from the list updated the selected draft id. `Clear selected local candidate draft` removed only that item. `Clear all local candidate drafts` emptied the list.
- Editing the returned envelope after creating drafts showed `no_current_validation`; running malformed local validation then showed stored drafts as `stale_local_candidate_draft` and left saved drafts unchanged.
- Malformed textarea text rendered `result_state=BLOCKED`, `execution_result=blocked`, `validation_source=real_local_validate_execution`, and visible blocked reasons including missing returned response bounds.
- Candidate action selection worked after PASS validation and remained local draft only.
- Review-blocker replay passed: PASS fixture -> Run local validation -> Mark as perspective candidate selected `accept_as_perspective_candidate`; loading the BLOCKED fixture immediately reset the selected local action to `keep_review_only`.
- BLOCKED fixture -> Run local validation kept `keep_review_only` selected, kept Mark as perspective candidate unavailable, allowed only the rejection path, and did not retain stale `accept_as_perspective_candidate`.
- Refresh after BLOCKED validation restored bounded draft metadata with `validation_result_state=BLOCKED` and kept `keep_review_only` selected, with no stale `accept_as_perspective_candidate`.
- Malformed typed envelope text -> Run local validation returned BLOCKED with visible blocked reasons and kept `keep_review_only` selected.
- Refresh after malformed validation did not restore stale `accept_as_perspective_candidate`; the selected local action remained `keep_review_only`.
- Refresh restored bounded draft metadata: `validation_result_state=PASS`, `validation_result_source=real_local_validate_execution`, selected fixture `PASS`, and selected local action.
- Clear local draft reset visible operator metadata to `validation_result_state=not_validated` and `validation_result_source=not_run` while leaving the local candidate draft list intact.
- Clear local candidate draft list emptied only the candidate draft list and did not clear the local memory review queue.
- External resource probe returned `[]`.
- Console warn/error probe returned `[]`.
- Horizontal overflow was `0` at 390px, 768px, and 1280px.
- The Browser read-only evaluate scope did not expose `window.localStorage`; persistence was validated through route refresh/restore and clear behavior in the UI.
