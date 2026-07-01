# Autonomy Runner Preflight / Dry-Run v0.1

## 1. Status and Scope

Phase 9A is preflight/dry-run only.

Phase 9A consumes `AutonomyContract` as preview input and produces:

- `AutonomyRunnerPreflight`
- `AutonomyDryRunPlan`

The preflight may reason about whether a future supervised runner could be
considered. The preflight does not start runner. The dry-run plan may preview
read/evaluate/report steps. The dry-run plan does not execute.

Phase 9A adds type, deterministic helper, fixture, smoke, package pointer, and
latest-index pointer only. It adds no UI changes, no API route, no ChatGPT
App/MCP tool, no DB schema or migration, no DB writes, no provider/OpenAI
call, no GitHub actuation from Augnes product code, no Codex execution from
Augnes product code, no proof/evidence writes, no memory mutation, no durable
Perspective state apply, no scheduler, no daemon, no background job, no actual
autonomy runner, no handoff send or execution, no branch/PR creation from
product code, no auto-apply, no product-write, no merge/publish/retry/replay/
deploy behavior, and no external side effects.

Phase 9A has no scheduler. Phase 9A has no daemon. Phase 9A has no background
job. Phase 9A has no Codex execution. Phase 9A has no GitHub/provider/OpenAI
call. Phase 9A has no DB writes. Phase 9A has no proof/evidence writes. Phase
9A has no durable state/memory/Perspective apply. Phase 9A has no handoff
send. Phase 9A has no branch/PR creation from product code. Phase 9A has no
auto-apply. Phase 9A has no external side effects.

## 2. Purpose

`AutonomyRunnerPreflight` is a deterministic preview packet that classifies a
source `AutonomyContract` before any future runner phase. It answers:

- whether the contract shape is supported
- whether budget is present, complete, approved, or exceeded
- whether action scope remains dry-run/read/evaluate/report only
- whether delta merge policy blocks auto-apply
- whether review escalation or user judgment is unresolved
- whether stop conditions are triggered
- whether context is stale, partial, unknown, or fresh
- whether authority boundary is clear and all Phase 9A authority flags are
  denied

`AutonomyDryRunPlan` is a dry-run-only plan. Every planned step includes
`would_execute: false`.

No readiness value means a run has started.
ready_for_future_supervised_runner still means no run starts in Phase 9A.

## 3. Source Contract Consumption

Phase 9A consumes `AutonomyContract` as an input object only. The helper does
not collect source data internally. The helper does not call routes. The helper
does not call GitHub, OpenAI, providers, Codex, MCP/App tools, or browser
surfaces. The helper does not write files, write DB, write proof/evidence,
mutate memory, mutate Perspective state, schedule work, start work, or start
anything.

The source contract remains preview input:

- `allowed_actions` are planning context, not commands.
- `forbidden_actions` are hard blockers or warnings.
- `budget` is a boundary, not spend permission.
- `run_preview.status` must remain `preview_only`.
- `delta_merge_policy.auto_apply_allowed` must be `false`.
- `delta_merge_policy.auto_apply_targets` must be empty.
- source refs are pointers only.
- unresolved user judgment remains unresolved.

## 4. Readiness Values

`AutonomyRunReadiness` values:

- `blocked`
- `needs_review`
- `ready_for_future_supervised_runner`
- `not_supported`

Set readiness to `blocked` when:

- authority boundary is unclear
- budget is missing or exceeded
- a stop condition is already triggered
- stale context blocks run
- unresolved blocking user judgment exists
- contract requests forbidden action
- `auto_apply_allowed` is true in Phase 9A input
- `run_preview.status` is not `preview_only`
- contract tries to schedule, run, launch, or execute
- proof/evidence/write/external action is requested

Set readiness to `needs_review` when:

- contract is shaped but requires user/operator review
- budget is present but not approved
- user judgment exists but is not blocking
- stale context is partial but refreshable
- Codex/Handoff steps are preview-only but require future approval

Set readiness to `ready_for_future_supervised_runner` only when:

- contract is complete
- no blockers exist
- no forbidden actions are requested
- budget is complete and approved
- stop conditions are not triggered
- delta merge policy has `auto_apply_allowed: false`
- `auto_apply_targets` is empty
- all execution remains future-supervised
- authority boundary denies all execution/write/schedule/external behavior in
  this phase

Set readiness to `not_supported` when:

- autonomy mode is unknown
- contract version is unsupported
- required fields are missing enough that preflight cannot reason

## 5. Allowed and Forbidden Action Kinds

Phase 9A allowed read/dry-run action kinds:

- `read_contract`
- `read_preview_inputs`
- `evaluate_budget`
- `evaluate_stop_conditions`
- `evaluate_review_escalation`
- `rank_candidate_steps`
- `build_dry_run_plan`
- `draft_report_preview`

Phase 9A forbidden actions:

- `execute_codex`
- `run_codex`
- `call_github`
- `call_openai_or_provider`
- `create_branch_or_pr`
- `send_handoff`
- `write_db`
- `record_proof`
- `create_evidence`
- `mutate_memory`
- `apply_project_perspective`
- `publish_external`
- `merge`
- `retry_replay_deploy`
- `start_background_work`
- `schedule_background_work`
- `schedule_run`
- `spend_budget`
- `auto_apply_delta`

If any step would require execution, it must be blocked or future-only. Phase
9A dry-run steps never execute.

## 6. Preflight Shape

`AutonomyRunnerPreflight` includes:

- `runtime: "augnes"`
- `preflight_version: "autonomy_runner_preflight.v0.1"`
- `scope`
- `preflight_id`
- `created_at`
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

## 7. Dry-Run Plan Shape

`AutonomyDryRunPlan` includes:

- `runtime: "augnes"`
- `dry_run_version: "autonomy_dry_run_plan.v0.1"`
- `dry_run_id`
- `source_contract_id`
- `status: "dry_run_only"`
- `planned_steps`
- `planned_read_sources`
- `proposed_delta_outputs`
- `proposed_delta_batches`
- `proposed_reports`
- `proposed_review_queue_items`
- `blocked_steps`
- `required_preconditions`
- `required_checks`
- `stop_conditions`
- `budget_projection`
- `no_run_boundary`
- `next_phase_notes`

Every planned step includes:

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

## 8. Authority Boundary

Every preflight and dry-run plan must include a no-run authority boundary. All
authority boundary execution/write/schedule/external flags are false:

- `source_of_truth: false`
- `can_start_runner: false`
- `can_schedule_runner: false`
- `can_start_daemon: false`
- `can_start_background_work: false`
- `can_commit_or_reject_state: false`
- `can_record_proof: false`
- `can_create_evidence: false`
- `can_update_work: false`
- `can_mutate_memory: false`
- `can_apply_project_perspective: false`
- `can_publish_external: false`
- `can_merge: false`
- `can_retry_replay_deploy: false`
- `can_call_github: false`
- `can_call_openai_or_provider: false`
- `can_execute_codex: false`
- `can_create_branch_or_pr: false`
- `can_send_handoff: false`
- `can_launch_codex: false`
- `can_launch_autonomy: false`
- `can_schedule_background_work: false`
- `can_create_mcp_tool: false`
- `can_create_ui_action: false`
- `can_post_external_comment: false`
- `can_write_db: false`
- `can_spend_budget: false`
- `can_auto_apply_delta: false`

The no-run authority boundary means the runner may reason about whether a run
could start later and may produce a dry-run plan. The runner may reason about
whether a run could start later and may produce a dry-run plan. The runner
must not start the run.

## 9. Deterministic Helper

Phase 9A exposes deterministic, input-driven builders and assessors:

- `buildAutonomyRunnerPreflight(input)`
- `buildAutonomyDryRunPlan(input)`
- `assessAutonomyBudget(contract)`
- `assessAutonomyActionScope(contract)`
- `assessAutonomyDeltaMergePolicy(contract)`
- `assessAutonomyReviewEscalation(contract)`
- `assessAutonomyStopConditions(contract)`
- `assessAutonomyStaleness(contract)`
- `assessAutonomyAuthority(contract)`
- `deriveAutonomyRunReadiness(assessments)`
- `buildAutonomyRunBlockers(assessments)`
- `buildAutonomyRunWarnings(assessments)`
- `buildAutonomyPreflightAuthorityBoundary()`

Helper constraints:

- deterministic
- input-driven
- no source data collection
- no route calls
- no network
- no GitHub calls
- no OpenAI/provider calls
- no Codex calls
- no child_process
- no fs writes
- no DB reads or writes
- no proof/evidence writes
- no memory mutation
- no durable Perspective apply
- no scheduler
- no daemon
- no background work
- no run start
- no Date.now or new Date unless supplied by input
- no randomness
- no persistence
- no app route imports
- no UI component imports
- no App/MCP imports

## 10. Public Safety

Public-safe fixtures must confirm:

- no private conversation
- no hidden reasoning
- no local private paths
- no secrets/tokens
- no raw provider output
- no raw retrieval output
- no real account artifacts

Fixtures are synthetic samples. They must not be presented as live runtime
state, hidden conversation content, proof, evidence, account artifacts,
approval, execution, or merge authority.

## 11. Validation

`npm run smoke:autonomy-runner-preflight-v0-1` checks the Phase 9A docs, type
exports, helper exports, fixture, package script, latest-index pointer,
dry-run-only status, planned-step `would_execute: false`, all-false authority
boundary, no auto-apply, no UI/API/App/MCP/DB migration changes, no runner,
scheduler, daemon, background work, route, DB write, provider/GitHub/Codex
call, child_process, fs write, interval, timer, cron, or external side effect
implementation.

Browser/CDP validation is skipped because Phase 9A has no UI or route.

Proof-only closeout is skipped unless a future task explicitly scopes proof
recording and runtime proof context is available. Phase 9A does not write
proof/evidence.

## 12. Next Phase Readiness

Phase 9B can start only after separate explicit scope and approval. Phase 9B
recommended next phase:

```text
Phase 9B - Autonomy Runner Preflight GET-only read route v0.1
```

Phase 9B should consume the Phase 9A preflight without inventing policy. It
must preserve the no-run authority boundary unless the operator explicitly
scopes a different future phase.
