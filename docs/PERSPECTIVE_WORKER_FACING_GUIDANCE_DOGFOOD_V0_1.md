# Perspective Worker-Facing Guidance Dogfood v0.1

## Purpose and Status

This is the deterministic local dogfood slice after PR #474. PR #474 added
`buildWorkerFacingPerspectiveGuidanceFromCandidate(input)`, docs, report,
package script, smoke coverage, and payload-marker redaction coverage. This
slice uses that merged scaffold against realistic reviewed Perspective
Candidate contexts and records whether the guidance is useful for a future
Codex worker.

This is not another abstract usage note or checklist-only layer. The dogfood
script builds local objects and writes a deterministic report artifact at
`reports/dogfood/2026-06-09-perspective-worker-facing-guidance-loop.md`.

## Local Chain

The dogfood script builds:

- Formation Input Bundle;
- Perspective Candidate;
- Worker-Facing Perspective Guidance.

The script uses only bounded, reviewable summaries and refs. It does not use
raw PR diffs, raw review payloads, private payloads, provider payloads,
generated model material, or credential-like material.

## Dogfood Scenarios

`real_reviewed_pr_474_ready` models merged PR #474 with:

- source PR ref for #474;
- changed files from #474;
- validation checks reported for #474;
- skipped checks with concrete reasons;
- review issue fixed: the billing marker redaction gap;
- bounded summaries only.

Expected result: the candidate is `sufficient_for_review`, guidance status is
`actionable_advisory`, the work goal is concrete, next actions are useful but
still advisory, and all authority flags remain false.

`review_gap_regression_case` models the pre-fix redaction concern. It confirms
that the guidance prioritizes resolving or qualifying the gap before
implementation planning and that unsafe marker input does not appear in output
guidance.

Expected result: guidance status is `resolve_gaps_first`, verification gaps
preserve the redaction concern safely, and worker instructions begin with gap
resolution.

`blocked_or_missing_scope_contrast` models a missing-scope candidate.

Expected result: guidance status is `stop_or_defer`, next actions tell the
worker to stop and request unblock, and stop/defer actions defer worker
planning and authority claims.

## Evaluation Questions

The dogfood report answers:

- Does the guidance narrow the next worker action?
- Does it distinguish actionable planning from gap-first review?
- Does it keep unresolved tensions and verification gaps visible?
- Does it avoid turning guidance into proof, evidence, readiness, approval,
  merge authority, GitHub mutation, Codex execution, or Core decision?
- Does it avoid unsafe raw/private/provider/token/billing/source payloads?
- Is the guidance specific enough for a future Codex task prompt?
- What is the next implementation PR after this dogfood?

The top-level conclusion is derived from scenario conclusions: any `BLOCKED`
scenario makes the report `BLOCKED`; otherwise any `PASS with follow-up`
scenario makes the report `PASS with follow-up`; only all-`PASS` scenarios
produce `PASS`.

## Conclusion

`PASS with follow-up`.

The guidance is specific enough to seed a future Codex task prompt because it
carries source candidate refs, changed files, validation summaries, skipped
checks, a concrete work goal, visible gaps, and explicit authority boundaries.
The follow-up is that action summaries should become more file/check-aware so
a future worker sees the exact smallest useful implementation step with less
interpretation.

Recommended next implementation PR title:
`Refine worker-facing guidance action specificity from dogfood findings`.

## Authority Boundary

This PR is local deterministic dogfood only. It does not execute Codex. It
does not mutate GitHub. It does not implement runtime routes, UI, app/api
behavior, DB schema, migrations, persistence, graph DB behavior, source
ingress, OAuth, provider/model/API calls, proof/evidence/readiness writes,
ChatGPT Apps integration, Codex SDK/plugin integration, actual Codex
execution, merge, approval, publish, retry, replay, deploy, or Core
decisions.

Explicit non-goals: does not implement runtime routes, does not implement UI,
does not implement DB schema, does not implement persistence, does not
implement provider/model/API calls, does not write proof/evidence/readiness,
does not implement ChatGPT Apps, does not implement Codex SDK/plugin
integration, and does not make Core decisions.

## Validation

- `npm run typecheck`
- `npm run dogfood:perspective-worker-facing-guidance-loop`
- `npm run smoke:perspective-worker-facing-guidance-loop-dogfood`
- `npm run smoke:perspective-worker-facing-guidance`
- `npm run smoke:perspective-candidate-builder-fixture`
- `git diff --check`
- `git diff --cached --check`
