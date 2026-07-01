---
name: augnes-autonomy-runner-preflight
description: Consume Autonomy Runner Preflight and Dry-Run Plan preview packets as Codex planning context while preserving dry_run_only, would_execute false, blockers, warnings, review requirements, assessments, public safety, and no-run authority boundaries.
---

# Augnes Autonomy Runner Preflight Consumption

This skill is for consuming Autonomy Runner Preflight and Autonomy Dry-Run Plan
preview context. It is instruction-only workflow guidance.

It does not run commands. It does not call Augnes runtime. It does not call
GitHub. It does not call OpenAI or providers. It does not call MCP/App tools.
It does not execute Codex based on preflight. It does not launch Codex. It does
not run autonomy. It does not schedule autonomy. It does not start a daemon. It
does not perform background work. It does not write DB records. It does not
create proof/evidence. It does not mutate memory/state/work/Perspective. It
does not send handoff. It does not create branches or PRs from product
behavior. It does not auto-apply deltas. It does not spend budget. It does not
post externally. It does not add runtime hooks, API routes, Web UI, App/MCP
tools, DB writes, scheduler/autonomy behavior, copy/export, or external side
effects.

Codex may edit repo files and open PRs only when the active user-scoped task
explicitly asks for that developer workflow. Autonomy Runner Preflight itself
does not grant branch, PR, proof, evidence, publish, merge, deploy, handoff,
runner, scheduler, daemon, budget-spend, or background-work authority.

## When To Use

Use this skill when reviewing, summarizing, or planning around:

- `AutonomyRunnerPreflight`
- `AutonomyDryRunPlan`
- the Phase 9B read route preview packet
- the Phase 9C Web preview panel content
- the Phase 9D ChatGPT App/MCP read-only preview tool output
- Autonomy Runner Preflight blockers, warnings, assessments, or authority
  boundaries

Do not use this skill to start, schedule, execute, launch, apply, persist,
write, send, spend, or create anything.

## Inputs To Inspect

Inspect only public-safe preview fields, including:

- preflight status and `readiness`
- `readiness_summary`
- blockers
- warnings
- `required_user_judgment`
- `required_operator_review`
- budget assessment
- action scope assessment
- delta merge assessment
- review escalation assessment
- stop condition assessment
- staleness assessment
- authority assessment
- `dry_run_plan.status`
- planned steps
- planned read sources
- blocked steps
- required preconditions
- required checks
- stop conditions
- budget projection
- source refs
- no-run authority boundary
- public-safety status

If preflight is missing, malformed, or unsupported, treat it as blocked or
`not_supported`. Do not infer missing policy.

## Required Output Format

When asked for a Codex summary, use this format:

1. Preflight status
2. Readiness summary
3. Blockers
4. Warnings
5. Required user judgment
6. Required operator review
7. Budget / action / delta / review / stop / staleness / authority assessments
8. Dry-run plan summary
9. Planned steps, preserving `would_execute: false`
10. No-run authority boundary
11. Public-safety notes
12. What would be needed before execution, future-only and operator-gated

## Required No-Run Boundary

Every output must include a no-run boundary summary when the user asks for a
review, handoff, planning summary, or readiness summary.

Required boundary:

- Preflight is not approval to run.
- Dry-run plan is not execution permission.
- Readiness is not authorization.
- `ready_for_future_supervised_runner` remains future supervised review only.
- `dry_run_only` must be preserved.
- Every planned step must preserve `would_execute: false`.
- No runner starts.
- No scheduler starts.
- No daemon starts.
- No background work starts.
- No Codex execution starts from product behavior.
- No GitHub/provider/OpenAI call occurs.
- No DB write occurs.
- No proof/evidence write occurs.
- No memory or Perspective mutation occurs.
- No handoff send occurs.
- No branch/PR creation occurs from product behavior.
- No auto-apply occurs.
- No budget spend occurs.
- No external side effect occurs.

## Readiness Interpretation

Interpret readiness conservatively:

- `blocked`: preserve blockers and keep future execution blocked.
- `needs_review`: preserve review requirements before any future execution
  phase.
- `ready_for_future_supervised_runner`: future supervised review only, not
  approval to run.
- `not_supported`: blocked planning context; do not invent missing policy.

Readiness is not authorization. It is only a planning classification.

## Blockers / Warnings Handling

Preserve blockers, warnings, required user judgment, required operator review,
budget limits, stop conditions, stale-source warnings, forbidden actions, and
authority boundary details.

Do not remove a blocker or warning to simplify a plan. If blockers or warnings
conflict with an execution proposal, keep the proposal future-only and
operator-gated.

## Dry-Run Step Handling

Preserve `dry_run_only`. Preserve every planned step with
`would_execute: false`.

For each planned step, retain:

- `step_id`
- `title`
- `summary`
- `action_kind`
- `allowed_by_contract`
- `blocked_by`
- `source_refs`
- `expected_output`
- `would_require_review`
- `would_execute: false`

Do not convert a dry-run step into an executed action. Do not instruct Codex to
execute planned steps. If asked for next steps, write them as future-only
operator-gated prerequisites.

## Forbidden Actions

Do not:

- start runner/scheduler/daemon/background work
- execute Codex based on preflight
- launch Codex from product behavior
- call GitHub
- call OpenAI or provider APIs
- write DB
- create proof/evidence
- mutate memory or Perspective
- send handoff
- create branch/PR from product behavior
- auto-apply deltas
- spend budget
- post externally
- publish, merge, retry, replay, or deploy
- add write-capable skill/tool behavior

## Public-Safety Handling

Do not include:

- secrets
- tokens
- hidden reasoning
- private conversation
- local private paths
- raw provider output
- raw retrieval output
- real account artifacts

Only cite or summarize public-safe preview fields and safe repo/document refs.

## Example Review Summary

1. Preflight status: consumed as planning context only.
2. Readiness summary: `needs_review`; readiness is not authorization.
3. Blockers: preserve all listed blockers.
4. Warnings: preserve all listed warnings.
5. Required user judgment: unresolved items remain unresolved.
6. Required operator review: required before any future execution phase.
7. Assessments: budget/action/delta/review/stop/staleness/authority details
   carried forward.
8. Dry-run plan summary: `dry_run_only`.
9. Planned steps: each step remains `would_execute: false`.
10. No-run authority boundary: no runner, scheduler, daemon, Codex execution,
    GitHub/provider/OpenAI call, DB write, proof/evidence write, memory or
    Perspective mutation, handoff send, branch/PR creation, auto-apply, budget
    spend, or external side effect.
11. Public-safety notes: no private conversation, hidden reasoning, secrets,
    tokens, local private paths, raw provider output, raw retrieval output, or
    real account artifacts.
12. What would be needed before execution: later explicit operator approval,
    supported source composition, resolved blockers, resolved review
    requirements, and a separately scoped execution phase.

## Completion Checklist

- Preflight treated as planning context only.
- Dry-run plan treated as preview context only.
- Readiness not treated as authorization.
- `dry_run_only` preserved.
- Every planned step preserves `would_execute: false`.
- Blockers and warnings preserved.
- Required user judgment and operator review preserved.
- Budget, action, delta, review, stop, staleness, and authority assessments
  preserved.
- Missing or unsupported preflight treated as blocked or `not_supported`.
- No-run boundary included.
- Public-safety boundary preserved.
- Execution proposals remain future-only and operator-gated.
- Phase 9E itself remains docs/skill/smoke only.
