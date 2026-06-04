# Perspective Handoff Usefulness Experiment Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer/skill-guidance only
- non-SSOT
- non-authoritative
- no runtime behavior
- no UI behavior
- no API route behavior
- no DB schema/migration/query
- no graph DB
- no persistence
- no App/MCP/ChatGPT App/tool implementation
- no plugin runtime hook/config/mapping
- no GitHub/OpenAI/Augnes runtime calls
- no proof/evidence/readiness writes
- no Codex SDK execution/provider behavior
- no branch/PR/merge/publish/approval/retry/replay/deploy authority by itself

This plan defines a bounded experiment for evaluating whether Perspective,
Project Constellation, the Cockpit preview, and Augnes handoff material improve
user next-work judgment and Codex PR quality. It does not execute the
experiment, add a consumer, reopen the closed route/auth/Cockpit local-only
consumer loop, or create readiness/proof.

## 2. Purpose

The purpose is to compare ordinary Codex task handoff against Augnes-assisted
handoff, using the current Perspective / Project Constellation / Cockpit
preview vocabulary and the `augnes-capsule-handoff` skill discipline.

The experiment asks whether the assisted handoff improves:

- user judgment about the best next work
- Codex retention of repo/task boundaries
- PR body and final report completeness
- ChatGPT review efficiency
- resistance to reopening closed or unrelated work

The result is a review note for deciding the next bounded PR type. It is not a
benchmark, source of truth, readiness result, proof record, or proposal score.

## 3. Baseline comparison

Baseline A: ordinary Codex prompt from current chat/repo instructions only.

Baseline B: Augnes handoff prompt using Perspective/Handoff Capsule fields.
Baseline B should include repo, base branch, working branch suggestion,
expected PR title, task goal, context anchors, selected nodes/edges when
available, evidence pointers, unresolved tensions, expected changed files,
forbidden changed files, hard constraints, required checks, skipped check
policy, browser/computer-use expectation, proof-only closeout expectation, PR
body requirements, final report requirements, blockers, repo/task mismatches,
scope risks, assumptions, questions requiring user/PM judgment, and next
suggested goal.

Optional human-review baseline: ChatGPT review with/without Perspective
context. This optional baseline is a human review comparison only; it does not
create proof, readiness, or merge input.

Each comparison should preserve the same user goal and repository state. If the
repo or task context changes materially between runs, the result should be
marked `ambiguous` or `needs_repair` rather than treated as a useful signal.

## 4. Comparison scenarios

Scenario 1: docs/smoke/package-pointer task similar to prior capsule handoff
dogfood.

- Candidate task shape: add or refine a bounded docs/smoke/package-pointer
  pointer with strict changed-file allowlists.
- Expected usefulness signal: Baseline B should preserve expected files,
  forbidden files, content-only diagnostic behavior, skipped reasons, and
  PR/final report fields with fewer omissions than Baseline A.
- Forbidden in this PR: no new runtime behavior, no UI behavior, no API route
  behavior, no DB schema/migration/query, no graph DB, no persistence, no
  App/MCP/ChatGPT App/tool implementation, no proof/evidence/readiness writes,
  and no Codex SDK execution/provider behavior.

Scenario 2: bounded implementation-fix or UI/read-only preview task, planned
scenario only.

- Candidate task shape: a future concrete defect fix in closed work, or a
  small read-only preview refinement with explicit browser/computer-use
  validation.
- Expected usefulness signal: Baseline B should preserve the closed milestone,
  identify whether a concrete defect exists, keep real auth/App/MCP/runtime
  work out of scope, and report browser/computer-use observations or skipped
  reasons accurately.
- Planned-only boundary: this PR does not implement UI/runtime changes, does
  not expand route responses, does not add graph UI, and does not add capsule
  display expansion.

## 5. Evaluation rubric

Each field is a review question, not a score.

| Field | Review question |
| --- | --- |
| Context retention | Did the handoff preserve prior decisions, closed milestones, constraints, and reasons? |
| Handoff quality | Did Codex receive a clearer, bounded task with expected and forbidden changes? |
| PR alignment | Did the PR match the original task intent and stated constraints? |
| Scope drift resistance | Did the run avoid unrelated planning, runtime, UI, auth, App/MCP, proof, or provider work? |
| skipped reason accuracy | Were skipped checks reported with concrete scope/environment reasons? |
| repo/task mismatch detection | Did the run detect wrong repo, stale branch, missing context, or task/file mismatch? |
| scope risk preservation | Did the PR/final report preserve risks without turning them into action authority? |
| unresolved tension preservation | Did unresolved tensions remain visible instead of being flattened into support? |
| final report completeness | Did the final report include PR URL, branch, commit SHA, changed files, exact checks, skipped reasons, blockers, mismatches, risks, assumptions, questions, and next suggested goal? |
| next suggested goal quality | Was the next suggested goal bounded, connected to evidence, and not a disguised approval? |
| ChatGPT review burden | Did ChatGPT need fewer clarifying questions or boundary corrections? |
| user merge/review judgment burden | Did the user have less hidden state to reconstruct before deciding review or merge? |

## 6. Outcome labels

Outcome labels are review notes only, not proof, readiness, source-of-truth
state, proposal score, or commit/reject input.

- `useful`: Baseline B clearly improves judgment or PR quality without added
  boundary risk.
- `partially_useful`: Baseline B improves some fields but leaves important
  omissions or review burden.
- `ambiguous`: The comparison is inconclusive because context, task, repo
  state, or evaluator conditions changed.
- `misleading`: Baseline B caused worse judgment, hidden assumptions, scope
  drift, or false confidence.
- `blocked`: The comparison cannot run because a concrete dependency is
  missing.
- `needs_repair`: The handoff template, skill guidance, or report shape needs
  repair before another experiment run.
- `superseded`: A newer validated workflow or product decision makes this
  comparison obsolete.

These labels must not be used as merge readiness, proof/evidence status,
source-of-truth state, proposal scoring, Gate/SRF input, or commit/reject
input.

## 7. Not-done classification rules

Final reports and PR bodies must classify skipped, unopened, or not-done work
with one of these values:

- `closed`: already completed; do not reopen without concrete defect.
- `implementation_fix`: concrete defect in closed work.
- `impossible_now`: missing concrete source/substrate/permission/info; must
  name the missing dependency.
- `rejected_for_current_goal`: possible but does not serve current goal.
- `rejected_for_next_session`: not supported by current experiment/usefulness
  trigger.
- `waiting_for_concrete_trigger`: do not open until named trigger occurs.
- `manual_next_step`: user/human dogfood or review, not repo PR initially.

Do not use deferred/later/나중에 as status values. Narrative prose may say that
a future area remains outside this PR, but the status value must come from the
classification list above.

## 8. Final report and PR body guidance

The PR body for this PR family should include summary, files changed, epic or
larger goal, why the PR exists, experiment scope, not-done classification rule
summary, authority boundary statement, validation results with exact command
results, browser/computer-use status or skipped reason, proof-only closeout
status or skipped reason, what this enables next, what this does not solve,
blockers/risks, repo/task mismatches, scope risks, assumptions, questions
requiring user/PM judgment, and next suggested goal.

Final reports should include PR number and URL, branch, commit SHA, changed
files, tests run with exact results, browser/computer-use status or skipped
reason, proof-only closeout status or skipped reason, regression result when
relevant, blockers, repo/task mismatches, scope risks, assumptions, questions
requiring user/PM judgment, and next suggested goal.

Skipped or unopened work must use the not-done classification rules in this
plan. The report must name missing dependencies for `impossible_now`, named
triggers for `waiting_for_concrete_trigger`, and human action for
`manual_next_step`.

## 9. Codex handoff efficiency comparison plan

For each scenario, compare Baseline A and Baseline B on the same task shape:

- Prepare a task packet with the same user goal, branch target, expected PR
  title, expected changed files, forbidden changed files, and validation
  commands.
- Run Baseline A from ordinary Codex prompt context and repo instructions only.
- Run Baseline B from Perspective/Handoff Capsule fields plus the
  `augnes-capsule-handoff` skill.
- Compare changed files, validation omissions, PR body completeness, final
  report completeness, skipped reason accuracy, not-done classification, and
  whether closed work stayed closed.
- Ask ChatGPT review to identify missing context, scope drift, mismatch, and
  unnecessary reviewer burden for each run.
- Record the outcome label as a review note only.

The comparison should preserve unresolved tensions and scope risks as review
material. It must not convert evidence pointers into proof/evidence writes or
turn next suggested goals into implementation authority.

## 10. Decision gate

Result that leads to experiment execution PR: `useful` or strong
`partially_useful` on Scenario 1, with no misleading authority implication and
with explicit user/PM selection of the next bounded experiment run.

Result that leads to skill/report template hardening: `partially_useful`,
`ambiguous`, `misleading`, or `needs_repair` caused by missing final report
fields, bad skipped reasons, weak not-done classification, hidden repo/task
mismatches, or unclear authority boundaries.

Result that leads to current-state/next-action compression UX:
`partially_useful` or `ambiguous` because the user still has high review
burden when deciding what changed, what remains closed, what is impossible now,
and what manual next step exists.

Result that still blocks DB-backed constellation, App/MCP consumer, real auth,
runtime integration, route response expansion, graph UI, or capsule display
expansion: every result in this docs-only plan. No outcome label in this plan
unlocks those areas.

## 11. Forbidden scope

This PR must not include:

- no real auth implementation
- no ChatGPT App/MCP consumer
- no new route/auth/consumer planning loop
- no standalone boundary compression PR
- no route response field expansion
- no DB-backed Constellation model
- no capsule/handoff display expansion
- no Codex plugin runtime integration
- no proof/evidence writes
- no browser-facing UI changes

This PR also must not add runtime behavior, UI behavior, API route behavior, DB
schema/migration/query, graph DB, persistence, App/MCP/ChatGPT App/tool
implementation, plugin runtime hook/config/mapping, GitHub/OpenAI/Augnes
runtime calls, Codex SDK execution/provider behavior, branch/PR authority by
itself, or merge/publish/approval/retry/replay/deploy authority.

## 12. Static smoke and package/index pointers

Static validation should check:

- this plan exists
- required sections exist
- at least two comparison scenarios exist
- Baseline A/B comparison exists
- rubric terms exist
- outcome labels exist
- not-done classification terms exist
- forbidden deferred/later/나중에-as-status guidance exists
- required forbidden scope terms exist
- docs index pointer exists
- package script pointer exists
- if the skill is updated, it remains instruction-only and has no
  runtime/authority grants
- scoped changed-file allowlist is narrow
- content-only mode remains diagnostic only
- no forbidden positive authority phrases are introduced

`AUGNES_BOUNDARY_SMOKE_MODE=content-only` remains diagnostic only. Default
scoped smoke remains the direct-edit gate.

## 13. Browser/computer-use handling

Expected status for this PR:

```text
browser/computer-use skipped: docs/smoke/package-pointer/skill-guidance only; no UI, browser-facing files, routes, interactive behavior, visual layout, or user workflow behavior changed.
```

If a future experiment execution PR changes UI, browser-facing files, routes,
interactive behavior, visual layout, or user workflow behavior, that PR must
run browser/computer-use and include exact observed results.

## 14. Proof-only closeout handling

Expected status for this PR:

```text
proof-only closeout skipped: no runtime/work ID context exists for this docs/smoke/package-pointer/skill-guidance PR, and this PR must not record proof/evidence writes.
```

Proof-only closeout should remain skipped unless runtime and `CODEX_WORK_ID`
context are actually available and the task permits proof/evidence writes.

## 15. Non-goals

This plan does not solve or implement:

- real auth
- ChatGPT App/MCP consumer behavior
- route/auth/consumer planning loop renewal
- route response expansion
- DB-backed Constellation
- graph UI
- capsule/handoff display expansion
- Codex plugin runtime integration
- proof/evidence/readiness writes
- browser-facing UI changes
- runtime integration
- Codex SDK execution/provider behavior
- branch/PR creation authority by itself
- merge, publish, approval, retry, replay, or deploy authority
