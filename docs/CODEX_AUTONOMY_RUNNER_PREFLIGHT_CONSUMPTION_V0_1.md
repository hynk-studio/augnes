# Codex Autonomy Runner Preflight Consumption v0.1

## Purpose

Codex may consume Autonomy Runner Preflight and Autonomy Dry-Run Plan packets as
planning context for a separately scoped operator task.

Autonomy Runner Preflight is planning context only. Autonomy Dry-Run Plan is
preview context only. Preflight is not approval to run. Dry-run plan is not
execution permission. `readiness` is not authorization.

Phase 9E is docs/skill/smoke only. It adds no runner, scheduler, daemon,
background work, route, UI, ChatGPT App/MCP tool, product write, runtime
execution, or external side effect.

## Inputs Codex May Consume

Codex may inspect these public-safe preview fields when they are present:

- `preflight_version`
- `source_contract_id`
- `source_contract_version`
- `readiness`
- `readiness_summary`
- `contract_status`
- `autonomy_mode`
- `budget_assessment`
- `action_scope_assessment`
- `delta_merge_assessment`
- `review_escalation_assessment`
- `stop_condition_assessment`
- `staleness_assessment`
- `authority_assessment`
- `blockers`
- `warnings`
- `required_user_judgment`
- `required_operator_review`
- `dry_run_plan`
- `source_refs`
- `authority_boundary`
- `public_safety`
- `next_phase_notes`

Source composition remains preview/operator-supplied unless a later approved
phase says otherwise. Codex must not infer live-source completeness from a
preview packet.

## Required Interpretation

Codex must interpret the packet conservatively:

- Preflight is not approval to run.
- Dry-run plan is not execution permission.
- `readiness` is not authorization.
- `ready_for_future_supervised_runner` still means future supervised review
  only.
- `not_supported` is blocked planning context, not an invitation to infer
  missing policy.
- Missing or unsupported preflight means Codex should report the gap and keep
  execution future-only and operator-gated.
- A planned step with `would_execute: false` must remain non-executable.
- `dry_run_only` must be preserved.

## Required Preservation Rules

Codex must preserve:

- blockers
- warnings
- required user judgment
- required operator review
- budget limits
- stop conditions
- stale-source warnings
- forbidden actions
- action scope constraints
- delta merge constraints
- review escalation constraints
- authority boundary
- source refs
- public-safety boundaries

Codex must include preflight readiness, blockers, and warnings in review,
handoff, and planning summaries. Codex must not drop unresolved judgment or
operator-review requirements to make a future run appear ready.

## Forbidden Interpretations

Codex must not convert a planned dry-run step into an executed action.

Codex must not treat preflight alone as permission to:

- start a runner
- schedule a runner
- start a daemon
- start background work
- launch Codex
- execute Codex from Augnes product code
- call GitHub
- call OpenAI or provider APIs
- write DB
- create proof/evidence
- mutate memory
- apply durable Perspective state
- send handoff
- create a branch or PR from Augnes product code
- auto-apply deltas
- spend budget
- post externally
- publish, merge, retry, replay, or deploy

Codex must ask for or require explicit operator approval before any later phase
that actually runs anything.

## Blocker And Readiness Handling

`readiness` is a planning classification only:

- `blocked` means planning must carry blockers forward.
- `needs_review` means user/operator review remains required before any future
  execution phase.
- `ready_for_future_supervised_runner` means future supervised review only. It
  does not authorize execution.
- `not_supported` means the packet cannot safely reason about the requested
  run. Treat it as blocked planning context.

Codex must preserve blockers and warnings in summaries even when it proposes
future work. If blockers conflict with a requested action, the blocker wins
unless the active operator explicitly changes scope in a later phase.

## Dry-Run Step Handling

Every `planned_step` must preserve:

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

Codex must not rewrite `would_execute: false` into an actionable command.
Codex may summarize what a future operator-approved phase would need before
execution, but that summary must stay future-only and operator-gated.

## Budget Handling

Budget assessment is a boundary, not spend permission. Codex must preserve
budget missing, budget unapproved, budget exceeded, and budget unclear states.
Codex must not spend budget based on preflight or dry-run context.

## Review Escalation Handling

Required user judgment and required operator review remain unresolved until a
later explicit operator action resolves them. Codex must not decide unresolved
judgment on behalf of the operator.

## Stop Condition Handling

Stop conditions must be preserved. If a stop condition is triggered, Codex must
report it as a blocker or review requirement and keep execution future-only.

## Staleness Handling

Stale, partial, synthetic, fallback, or preview-supplied context must be
reported as such. Codex must not claim live-source freshness unless a later
approved phase provides live-source verification.

## Authority Boundary Handling

The no-run authority boundary remains controlling. Codex must preserve false
authority for execution, write, schedule, external, provider, GitHub, proof,
evidence, memory, Perspective, handoff, branch/PR, auto-apply, and budget-spend
behavior.

Codex may edit repo files, commit, push, and open a PR only when the active
user-scoped developer workflow explicitly asks for that work. Autonomy Runner
Preflight itself does not grant product authority to perform those actions.

## Public-Safety Boundary

Codex must preserve public-safe preview constraints:

- no private conversation
- no hidden reasoning
- no secrets/tokens
- no local private paths
- no raw provider output
- no raw retrieval output
- no real account artifacts

Codex must not expose hidden chain-of-thought, local private machine paths,
secrets, tokens, raw provider output, raw retrieval output, private
conversation content, or real account artifacts beyond safe repo/document refs
already present in public-safe preview data.

## Allowed Codex Outputs

Allowed outputs include:

- preflight status summary
- readiness summary
- blockers and warnings
- required user judgment and required operator review
- budget/action/delta/review/stop/staleness/authority assessment summaries
- dry-run plan summary
- planned steps that preserve `would_execute: false`
- no-run authority boundary summary
- public-safety notes
- future-only operator-gated next steps

## Forbidden Codex Outputs

Forbidden outputs include:

- commands to execute planned dry-run steps
- claims that readiness authorizes execution
- claims that `ready_for_future_supervised_runner` starts or approves a run
- approval to start a runner, scheduler, daemon, or background job
- approval to launch Codex or call GitHub/OpenAI/providers
- approval to write DB, proof, evidence, memory, Perspective, handoff, or state
- approval to create product branches or PRs
- approval to auto-apply deltas, spend budget, or post externally
- any output that treats preview/operator-supplied source composition as live
  source authority

## Phase Boundary

Phase 9E adds only this Codex alignment document, an instruction-only Codex
skill, package/index pointers, and smoke coverage. It adds no API route, UI,
ChatGPT App/MCP tool, actual autonomy runner, runner skeleton, scheduler,
daemon, background work, DB schema/migration, DB write, provider/OpenAI call,
GitHub actuation from Augnes product code, Codex execution from Augnes product
code, proof/evidence write, memory mutation, durable Perspective apply,
handoff execution, branch/PR creation from Augnes product code, auto-apply,
product-write, budget spending, merge/publish/retry/replay/deploy behavior, or
external side effect.

## Validation / Smoke Expectations

`npm run smoke:codex-autonomy-runner-preflight-v0-1` checks that this document
and the Codex skill preserve the planning-only, preview-only, dry-run-only, and
no-run boundaries. The smoke is static docs/skill/package/index coverage and
does not add runtime behavior to test the docs.

The smoke also checks that prior Phase 9A, 9B, 9C, and 9D Autonomy Runner
Preflight smokes still pass.

## Next Phase Readiness

Phase 9F recommended next phase:

```text
Phase 9F - Autonomy Runner Preflight / Dry-Run local copy and manual-copy preview v0.1
```

Phase 9F should remain local copy/manual-copy preview only unless separately
scoped. It should not add file download/export-to-disk unless a later operator
request explicitly widens the scope.
