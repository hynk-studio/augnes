# Perspective Worker-Facing Guidance Loop Dogfood

Date: 2026-06-09

## Summary

This deterministic local dogfood slice uses the merged PR #474 Worker-Facing Perspective Guidance scaffold against realistic reviewed Perspective Candidate contexts. It builds Formation Input Bundle, Perspective Candidate, and Worker-Facing Perspective Guidance objects without raw PR diffs or raw review payloads.

## Evaluation Conclusion

PASS with follow-up

Recommended next implementation PR title: Refine worker-facing guidance action specificity from dogfood findings

## Dogfood Answers

- Does the guidance narrow the next worker action? Yes. The ready case narrows the next worker action to inspecting PR #474 refs and drafting the smallest scoped follow-up.
- Does it distinguish actionable planning from gap-first review? Yes. The ready case is actionable_advisory, the redaction regression case is resolve_gaps_first, and the missing-scope contrast is stop_or_defer.
- Does it keep unresolved tensions and verification gaps visible? Yes. Skipped checks, failed checks, unresolved gaps, and readiness reasons remain visible as worker-facing verification gaps or tensions.
- Does it avoid turning guidance into proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, or Core decision? Yes. All guidance authority flags remain false, and the guidance does not become proof, evidence, readiness, approval, merge authority, GitHub mutation, Codex execution, or Core decision.
- Does it avoid unsafe raw/private/provider/token/billing/source payloads? Yes. Unsafe marker inputs are omitted from output guidance and recorded through privacy metadata.
- Is the guidance specific enough for a future Codex task prompt? Yes, with follow-up. The guidance is specific enough to seed a future prompt, but the next action text should become more file/check-aware.
- What is the next implementation PR after this dogfood? Refine worker-facing guidance action specificity from dogfood findings

## Scenarios

### real_reviewed_pr_474_ready

Real Reviewed PR #474 Ready

- candidate_basis_quality: sufficient_for_review
- guidance_status: actionable_advisory
- work_goal: Use the reviewed PR #474 worker guidance scaffold to identify the next smallest useful local implementation follow-up.
- evaluation: PASS with follow-up
- specific enough: Yes, because the guidance carries PR #474 refs, changed files, checks, skipped-check reasons, a concrete work goal, and advisory next actions; follow-up should make action wording more file/check-aware.
- evaluation evidence:
- candidate basis is sufficient_for_review
- guidance is actionable_advisory
- work_goal is concrete
- next action asks for a smallest scoped plan
- authority flags remain false
- unsafe marker did not appear in guidance
- next_smallest_useful_actions:
- inspect_source_candidate_refs: Inspect the source candidate refs and selected material before proposing work.
- draft_smallest_scoped_plan: Draft the smallest useful scoped plan from the work goal and changed-file summary.
- carry_forward_verification_gaps: 2 verification gap(s) must stay visible and cannot be converted into proof or readiness.
- stop_or_defer_actions:
- defer_execution_until_user_task: Do not execute work from this guidance unless the user starts a future Codex task.
- defer_authority_claims: Do not claim approval, readiness, proof, evidence, merge authority, GitHub mutation, Codex execution, or Core decision authority from this guidance.
- verification_gaps:
- skipped_check (check:browser): Skipped check remains visible for worker planning: Browser validation was skipped because PR #474 changed only a pure local builder, docs, report, package script, and smoke coverage.
- skipped_check (check:build): Skipped check remains visible for worker planning: Build was skipped because PR #474 changed no runtime route, UI, component, CSS, DB, persistence, or app behavior.
- unresolved_tensions:
- None
- worker_instructions:
- Treat this as neutral planning guidance only after a user starts a future Codex task.
- Verify the repo, branch, scope, changed files, and checks independently before editing.
- Keep unresolved tensions and verification gaps visible in any plan or handoff.
- Do not write persistence, proof, evidence, readiness, approvals, provider calls, GitHub mutations, or Core decisions from this guidance.
- authority_flags_all_false: true
- unsafe_input_material_omitted: false

### review_gap_regression_case

Review Gap Regression Case

- candidate_basis_quality: needs_review
- guidance_status: resolve_gaps_first
- work_goal: Resolve or qualify the payload redaction gap before planning implementation work.
- evaluation: PASS
- specific enough: No implementation prompt should be drafted from this case until the visible redaction gap is resolved or qualified.
- evaluation evidence:
- candidate basis is needs_review
- guidance prioritizes gap resolution
- verification gap preserves the redaction concern safely
- worker instructions put gaps before implementation planning
- unsafe marker input was omitted
- unsafe marker did not appear in guidance
- next_smallest_useful_actions:
- resolve_verification_gaps: Resolve or qualify verification gaps before planning implementation work.
- preserve_unresolved_tensions: 3 unresolved tension(s) must remain visible in any revised candidate or later handoff.
- ask_user_decision_questions: Ask the preserved user/Core decision questions before treating this as ready for worker planning.
- stop_or_defer_actions:
- defer_implementation_planning: Defer implementation planning until unresolved gaps and review needs are resolved.
- defer_authority_claims: Do not claim approval, readiness, proof, evidence, merge authority, GitHub mutation, Codex execution, or Core decision authority from this guidance.
- verification_gaps:
- failed_check (check:payload-marker-redaction): Failed check remains unresolved: Payload marker redaction concern remained unresolved before the review fix.
- unresolved_gap (gap:payload-marker-redaction): Review feedback identified an unsafe payload marker that needed exact redaction coverage before implementation planning.
- failed_check (check:payload-marker-redaction): Payload marker redaction concern remained unresolved before the review fix.
- readiness_reason: unresolved gaps present
- unresolved_tensions:
- unresolved_gap (gap:payload-marker-redaction): Review feedback identified an unsafe payload marker that needed exact redaction coverage before implementation planning.
- failed_check (check:payload-marker-redaction): Payload marker redaction concern remained unresolved before the review fix.
- readiness_reason: unresolved gaps present
- worker_instructions:
- Resolve visible gaps before proposing implementation work.
- Treat this as neutral planning guidance only after a user starts a future Codex task.
- Verify the repo, branch, scope, changed files, and checks independently before editing.
- Keep unresolved tensions and verification gaps visible in any plan or handoff.
- Do not write persistence, proof, evidence, readiness, approvals, provider calls, GitHub mutations, or Core decisions from this guidance.
- authority_flags_all_false: true
- unsafe_input_material_omitted: true

### blocked_or_missing_scope_contrast

Blocked Or Missing-Scope Contrast

- candidate_basis_quality: blocked
- guidance_status: stop_or_defer
- work_goal: Confirm that missing scope stops worker planning before action selection.
- evaluation: PASS
- specific enough: No future implementation prompt should be drafted until scope is supplied.
- evaluation evidence:
- candidate basis is blocked
- guidance stops or defers
- next action requests unblock
- stop/defer actions defer worker planning
- stop/defer actions defer authority claims
- authority flags remain false
- next_smallest_useful_actions:
- stop_and_request_unblock: Stop worker planning from this candidate and ask the user or Core owner to resolve the blocking basis first.
- stop_or_defer_actions:
- defer_all_worker_planning: Defer worker planning until the blocked candidate basis is resolved.
- defer_authority_claims: Do not claim approval, readiness, proof, evidence, merge authority, GitHub mutation, Codex execution, or Core decision authority from this guidance.
- verification_gaps:
- skipped_check (check:scope-precondition): Skipped check remains visible for worker planning: Scope is missing, so worker planning cannot proceed.
- readiness_reason: missing scope
- unresolved_tensions:
- readiness_reason: missing scope
- worker_instructions:
- Stop and defer because the source candidate basis is blocked.
- Treat this as neutral planning guidance only after a user starts a future Codex task.
- Verify the repo, branch, scope, changed files, and checks independently before editing.
- Keep unresolved tensions and verification gaps visible in any plan or handoff.
- Do not write persistence, proof, evidence, readiness, approvals, provider calls, GitHub mutations, or Core decisions from this guidance.
- authority_flags_all_false: true
- unsafe_input_material_omitted: false

## Authority Boundary

This report is local deterministic dogfood only. It does not implement runtime routes, UI, app/api behavior, DB schema, migrations, persistence, graph DB behavior, source ingress, OAuth, provider/model/API calls, proof/evidence/readiness writes, ChatGPT Apps integration, Codex SDK/plugin integration, GitHub mutation automation, actual Codex execution, merge, approval, publish, retry, replay, deploy, or Core decisions.

## Validation Commands

- npm run typecheck
- npm run dogfood:perspective-worker-facing-guidance-loop
- npm run smoke:perspective-worker-facing-guidance-loop-dogfood
- npm run smoke:perspective-worker-facing-guidance
- npm run smoke:perspective-candidate-builder-fixture
- git diff --check
- git diff --cached --check
