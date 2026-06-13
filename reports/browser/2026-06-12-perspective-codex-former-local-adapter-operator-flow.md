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
- Draft id visible
- local_status visible
- authority boundary visible
- refresh restores local candidate draft
- Clear local candidate draft removes it
- Load PASS with follow-up envelope fixture works
- Run local validation returns PASS with follow-up
- Create local perspective candidate draft with warnings visible
- Load BLOCKED envelope fixture works
- Run local validation returns BLOCKED
- Mark as perspective candidate unavailable
- Reject as memory candidate can create local rejection draft
- Supersede previous candidate requires previous draft ref
- changing returned envelope after draft creation marks draft stale
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
- localStorage candidate draft restores separately from operator draft metadata
- localStorage draft survives refresh for bounded metadata
- Clear local draft removes saved state
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
- PASS fixture -> Run local validation -> Mark as perspective candidate enabled `Create local perspective candidate draft`; the saved local candidate draft rendered a visible `draft_id`, `local_status=draft_candidate`, `validation_summary_hash`, source/prepare/returned hashes, warning counts, and authority boundary with no accepted Augnes state, review decision, product DB persistence, Core decision, runtime handoff, or automatic promotion.
- Refresh restored the separate local candidate draft record from `augnes.codexFormer.localAdapterAcceptedCandidateDrafts.v0.1`; `Clear local candidate draft` removed it without requiring `Clear local draft`.
- Refresh also restored the bounded operator validation metadata visibly, including `validation_result_state=PASS` and `validation_result_source=real_local_validate_execution`.
- PASS with follow-up fixture local validation rendered `result_state=PASS with follow-up`, `execution_result=success`, `candidate_count=1`, `validation_source=real_local_validate_execution`, and warning material.
- PASS with follow-up -> Mark as perspective candidate -> Create local perspective candidate draft rendered warning and pointer-warning counts from the local validation result.
- BLOCKED fixture local validation rendered `result_state=BLOCKED`, `execution_result=blocked`, `failure_kind=dry_run_blocked`, `candidate_count=0`, and visible blocked reasons.
- BLOCKED fixture kept Mark as perspective candidate unavailable. Selecting Reject as memory candidate enabled `Create local memory rejection draft`, which rendered `local_status=rejected_memory_candidate`.
- Supersede previous candidate kept `Create local supersede draft` disabled until `supersede_previous_candidate_ref` was non-empty.
- Editing the returned envelope after creating a candidate draft showed `stale_local_candidate_draft` and left the saved draft unchanged.
- Malformed textarea text rendered `result_state=BLOCKED`, `execution_result=blocked`, `validation_source=real_local_validate_execution`, and visible blocked reasons including missing returned response bounds.
- Candidate action selection worked after PASS validation and remained local draft only.
- Review-blocker replay passed: PASS fixture -> Run local validation -> Mark as perspective candidate selected `accept_as_perspective_candidate`; loading the BLOCKED fixture immediately reset the selected local action to `keep_review_only` and disabled all candidate action buttons.
- BLOCKED fixture -> Run local validation kept `keep_review_only` selected, disabled all candidate action buttons, and did not retain stale `accept_as_perspective_candidate`.
- Refresh after BLOCKED validation restored bounded draft metadata with `validation_result_state=BLOCKED` and kept `keep_review_only` selected, with no stale `accept_as_perspective_candidate`.
- Malformed typed envelope text -> Run local validation returned BLOCKED with visible blocked reasons and kept `keep_review_only` selected.
- Refresh after malformed validation did not restore stale `accept_as_perspective_candidate`; the selected local action remained `keep_review_only`.
- Refresh restored bounded draft metadata: `validation_result_state=PASS`, `validation_result_source=real_local_validate_execution`, selected fixture `PASS`, and selected local action.
- Clear local draft reset visible metadata to `validation_result_state=not_validated` and `validation_result_source=not_run`.
- External resource probe returned `[]`.
- Console warn/error probe returned `[]`.
- Horizontal overflow was `0` at 390px, 768px, and 1280px.
- The Browser read-only evaluate scope did not expose `window.localStorage`; persistence was validated through route refresh/restore and clear behavior in the UI.
