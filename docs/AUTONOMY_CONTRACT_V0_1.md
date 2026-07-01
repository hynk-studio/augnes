# Autonomy Contract / Budget / Delta Merge Policy v0.1

## 1. Status and Scope

Phase 8A defines Autonomy Contract / Budget / Delta Merge Policy core.

Autonomy Contract is a bounded delegation contract for future autonomous or
scheduled work. Autonomy Contract is not Autonomy Runner. Autonomy Budget is
not spend permission. Autonomy Delta Merge Policy is not state apply
implementation. Autonomy Run Preview is not background work.

Phase 8A is contract/type/helper/fixture/smoke/package/index only. It adds no
runner, scheduler, daemon, background work, hidden automation, Codex execution,
GitHub/provider/OpenAI calls, DB writes, proof/evidence writes, memory
mutation, durable Perspective apply, handoff send, branch/PR creation,
merge/publish/retry/replay/deploy, or external side effects.

Phase 8A adds no route, no UI, no ChatGPT App/MCP tool, no Codex skill
alignment, no copy/export, no API route, no App/MCP write tool, no scheduler,
no daemon, no background work, and no external post.

## 1.1 Phase 8B GET-Only Read Route

Phase 8B adds a GET-only local read-only Autonomy Contract preview route:

```text
GET /api/augnes/read/autonomy-contract?scope=project:augnes
x-augnes-local-readonly: autonomy-contract-v0.1
cache-control: no-store
```

Route behavior:

- exports `GET` only and exports no `POST`, `PUT`, `PATCH`, `DELETE`, or other
  mutating handler
- uses `runtime = "nodejs"` and `dynamic = "force-dynamic"`
- returns preview JSON only with `cache-control: no-store`
- returns the matching `x-augnes-local-readonly: autonomy-contract-v0.1`
  marker response header
- requires exact `scope=project:augnes`
- fails closed on missing scope, invalid scope, missing marker, invalid marker,
  and local access failures
- returns structured read errors with route authority boundary notes
- preserves the Autonomy Contract authority boundary

Source composition is owned by
`lib/autonomy/autonomy-contract-source.ts`. The route may compose from
GuideBrief, Handoff Capsule, and Codex Launch Card read-only preview sources.
These source refs are preview input only; the route must not call those routes
through HTTP and must not import app route handlers.

Phase 8B route composition may include synthetic/operator-supplied preview
defaults for title, goal, autonomy mode, allowed agents, allowed surfaces,
budget, reporting cadence, and run preview. Those defaults are not live
delegation approval, not spend permission, and not active autonomy state.

The Phase 8B route does not run autonomy. The route does not schedule
autonomy. The route does not launch Codex. The route does not send handoff.
The route does not call GitHub/OpenAI/provider APIs. The route does not write
DB/proof/evidence. The route does not mutate memory/state/work/Perspective.
The route does not create branches or PRs. The route does not start background
work or daemon. The route does not merge/publish/retry/replay/deploy or
externally post.

## 1.2 Phase 8C Read-Only Web Preview UI

Phase 8C adds read-only Autonomy Contract Web preview panels. Primary
placement is `/workbench` Agent Workplane. `/` and `/perspective` remain
deferred unless separately scoped.

The Web preview renders:

- Autonomy Contract goal, status, mode, bounded context, source refs, allowed
  agents, allowed surfaces, allowed actions, forbidden actions, warnings, and
  gaps
- Autonomy Budget fields and budget boundary notes
- Delta Merge Policy and Review Escalation Policy
- Stop conditions, Reporting Cadence, Output Policy, and Run Preview
- authority boundary fields and denied-authority notes
- visible source/fallback status

Public Web display defaults to the public-safe fixture fallback from
`fixtures/autonomy-contract.sample.v0.1.json` unless a separately scoped
local-only request context passes the Phase 8B validator. Source/fallback
status must remain visible. Route-composed budget/operator fields may remain
synthetic/operator-supplied preview defaults and must be disclosed.

Source composition for the Web display is owned by
`lib/autonomy/read-autonomy-contract-for-web.ts`. It does not fetch the Phase
8B route from the client, does not call local routes through HTTP, does not
import app route handlers, and does not bypass the local marker guard to expose
live route data on public Web surfaces.

Phase 8C Web preview adds no action buttons, no forms, no start, no run, no
schedule, no launch Codex, no send handoff, no apply memory, no apply project
Perspective, no approve auto-apply, no persist contract, no copy/export, no
API write route, no App/MCP tool, no DB schema/migration/write, no
provider/OpenAI call, no GitHub actuation, no proof/evidence writes, no memory
mutation, no durable Perspective apply, no scheduler/autonomy runner, no
daemon, no background work, no product-write, no
merge/publish/retry/replay/deploy, and no external side effects.

Phase 8D ChatGPT App/MCP read-only tool is deferred.
Phase 8E Codex skill alignment is deferred.
Phase 8F copy/export preview is deferred.
Phase 9 runner remains deferred and requires separate explicit scope and
approval.

## 2. Purpose

`AutonomyContract` is a preview-only packet that can describe a future bounded
delegation. It names the goal, context refs, allowed reads, forbidden actions,
budget boundary, delta merge policy, review escalation policy, stop
conditions, output policy, validation policy, staleness policy, and authority
boundary.

Autonomy Contract may describe a future autonomous run. Autonomy Contract may
not run, schedule, launch, apply, post, merge, or mutate anything.

Future Phase 9 runner requires separate explicit scope and approval.

## 3. Preview Inputs

Autonomy Contract may consume GuideBrief, Handoff Capsule, Codex Launch Card,
Augnes Delta, and Current Working Perspective only as preview input.

Handoff Capsule / Codex Launch Card consumption does not grant launch,
execution, handoff send, branch/PR creation, proof/evidence, merge, or
external authority.

Source refs are pointers only. They do not create proof, evidence, approval,
readiness, source-of-truth state, execution authority, or external side
effects.

Required docs refs for Phase 8A fixtures and default source refs:

- `docs/GUIDEBRIEF_CONTRACT_V0_1.md`
- `docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md`
- `docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md`
- `docs/AUGNES_DELTA_CONTRACT_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`
- `docs/AGENT_WORKPLANE_V0_1.md`

## 4. Contract Shape

`AutonomyContract` includes:

- `runtime: "augnes"`
- `contract_version: "autonomy_contract.v0.1"`
- `scope`
- `contract_id`
- `created_at`
- `status`
- `autonomy_mode`
- `title`
- `goal`
- `bounded_context_summary`
- `source_refs`
- `guide_brief_ref`
- `handoff_capsule_refs`
- `codex_launch_card_refs`
- `current_working_perspective_ref`
- `delta_projection_ref`
- `context_scope`
- `allowed_agents`
- `allowed_surfaces`
- `allowed_actions`
- `forbidden_actions`
- `budget`
- `reporting_cadence`
- `stop_conditions`
- `delta_merge_policy`
- `review_escalation_policy`
- `output_policy`
- `staleness_policy`
- `validation_policy`
- `run_preview`
- `authority_boundary`
- `gaps`
- `public_safety`
- `next_phase_notes`

Status values:

- `draft`
- `preview_only`
- `needs_review`
- `blocked`
- `ready_for_future_review`
- `archived`

No status may mean running.

Autonomy modes:

- `manual_supervised`
- `scheduled_hunt_preview`
- `full_access_preview`
- `chatgpt_only_preview`
- `codex_only_preview`
- `chatgpt_codex_loop_preview`
- `research_accumulation_preview`
- `office_workflow_preview`
- `world_model_preview`

All modes are preview/contract semantics in Phase 8A.

## 5. Allowed and Forbidden Actions

Allowed actions are narrow read/preview/report actions:

- `read_current_perspective`
- `read_delta_projection`
- `read_guide_brief`
- `read_handoff_capsule_preview`
- `read_codex_launch_card_preview`
- `summarize_context`
- `rank_candidate_deltas`
- `prepare_review_packet`
- `prepare_codex_handoff_preview`
- `draft_report_preview`

Future actions that remain not implemented in Phase 8A must be forbidden or
future-only notes:

- `run_codex`
- `open_pr`
- `call_github`
- `call_openai_or_provider`
- `write_memory`
- `apply_project_perspective`
- `record_proof`
- `create_evidence`
- `schedule_run`
- `send_handoff`
- `publish_external`

Forbidden actions include:

- `execute_codex`
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

## 6. Autonomy Budget

`AutonomyBudget` includes:

- `budget_id`
- `time_limit_minutes`
- `wall_clock_window`
- `max_iterations`
- `max_tool_calls`
- `max_codex_tasks`
- `max_prs`
- `max_file_changes`
- `allowed_file_globs`
- `forbidden_file_globs`
- `token_or_compute_budget`
- `cost_budget`
- `retry_limit`
- `failure_threshold`
- `reporting_interval`
- `requires_budget_refresh_after`
- `budget_boundary_notes`

Budget is boundary only. Budget is a boundary, not permission to spend. Missing
budget blocks future autonomy. Phase 8A must not charge, call providers,
execute tools, or run background work.

## 7. Delta Merge Policy

`AutonomyDeltaMergePolicy` includes:

- `policy_id`
- `default_delta_status`
- `auto_apply_allowed`
- `auto_apply_targets`
- `review_required_targets`
- `blocked_targets`
- `durable_memory_policy`
- `project_perspective_policy`
- `external_side_effect_policy`
- `codex_launch_policy`
- `proof_evidence_policy`
- `stale_context_policy`
- `user_judgment_policy`
- `policy_notes`

Phase 8A defaults:

- `auto_apply_allowed: false`
- `default_delta_status: needs_review`
- `auto_apply_targets: []`

Review-required targets include:

- `working_memory_candidate`
- `project_perspective_candidate`
- `durable_memory_candidate`
- `codex_launch_candidate`
- `handoff_send_candidate`

Blocked targets include:

- `proof_evidence_write`
- `external_publication`
- `github_actuation`
- `provider_call`
- `branch_pr_creation`
- `durable_apply_without_review`

Phase 8A may describe future `auto_apply_within_contract`, but must not
implement it. If a fixture mentions auto-apply, it must be clearly marked
future-contract-preview and inactive.

Durable memory and project Perspective require review. Proof/evidence write,
external publication, GitHub actuation, provider call, branch/PR creation, and
durable apply without review are blocked.

## 8. Review Escalation

`AutonomyReviewEscalationPolicy` defines when user/operator review is required.

Review escalation is required for stale context, user judgment, budget
exceeded, failed/skipped checks, forbidden action, durable memory, project
perspective, proof/evidence, Codex launch, GitHub/provider calls, and unclear
authority.

Escalation triggers include:

- needs_user_judgment item exists
- stale GuideBrief or stale Handoff Capsule
- budget exceeded
- forbidden file touched in future run
- required check skipped
- required check failed
- external side effect requested
- durable memory change requested
- project perspective change requested
- proof/evidence write requested
- Codex launch requested
- GitHub/provider call requested
- ambiguous authority boundary

Review escalation is policy metadata only. It does not run, schedule, apply,
post, merge, or mutate state.

## 9. Stop Conditions

`AutonomyStopCondition` includes:

- `stop_condition_id`
- `kind`
- `summary`
- `severity`
- `source_refs`
- `blocks_future_run`
- `recovery_hint`

Stop condition kinds:

- `budget_exhausted`
- `stale_context`
- `user_judgment_required`
- `required_check_failed`
- `required_check_skipped`
- `forbidden_action_requested`
- `forbidden_file_scope`
- `source_gap_high`
- `authority_boundary_unclear`
- `runtime_unavailable`
- `manual_stop_requested`

Stop conditions prevent future run until recovered.

## 10. Reporting and Output Policy

Reporting cadence modes:

- `manual`
- `scheduled_preview`
- `after_each_delta`
- `after_batch`
- `on_blocker`
- `on_budget_threshold`

Required report sections:

- `summary`
- `source_refs`
- `deltas_created`
- `delta_batch_summary`
- `budget_used`
- `checks_run`
- `skipped_checks`
- `blocked_actions`
- `user_judgment_items`
- `known_risks`
- `next_phase_readiness`

Output policy requires delta batch summary, skipped-check reporting,
proof/evidence status reporting, no-background-work statement, no-merge
statement, and next-phase-readiness reporting.

## 11. Run Preview

`AutonomyRunPreview` is preview-only future run sketch, not execution.

It includes:

- `preview_id`
- `title`
- `planned_steps`
- `allowed_read_sources`
- `proposed_delta_outputs`
- `proposed_reports`
- `blocked_steps`
- `required_preconditions`
- `not_implemented_notes`
- `status: "preview_only"`

Run preview rules:

- no run id that implies execution
- no schedule id that implies active scheduling
- no daemon
- no background job
- no active runner
- no active schedule
- no active execution
- no hidden work

AutonomyRunPreview is not background work.

## 12. Authority Boundary

Every AutonomyContract must include an authority boundary where all
execution/write/schedule/external booleans default to false:

- `source_of_truth: false`
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
- `can_start_daemon: false`

Authority boundary notes must include:

- Contract is preview-only.
- Contract does not run.
- Contract does not schedule.
- Contract does not launch Codex.
- Contract does not call GitHub or providers.
- Contract does not mutate state/memory/work/Perspective.
- Contract does not send handoffs.
- Contract does not create proof/evidence.
- Future runner requires separate Phase 9 scope and explicit approval.

## 13. Builders

Phase 8A exposes deterministic, input-driven builders:

- `buildAutonomyContract(input)`
- `buildAutonomyBudget(input)`
- `buildAutonomyDeltaMergePolicy(input)`
- `buildAutonomyReviewEscalationPolicy(input)`
- `buildAutonomyStopConditions(input)`
- `buildAutonomyReportingCadence(input)`
- `buildAutonomyOutputPolicy(input)`
- `buildAutonomyRunPreview(input)`
- `buildAutonomySourceRefs(input)`
- `buildAutonomyContractAuthorityBoundary()`
- `buildDefaultForbiddenActions()`
- `buildDefaultAllowedActions()`

Builder constraints:

- deterministic
- input-driven
- no DB reads
- no DB writes
- no route fetch
- no network
- no GitHub calls
- no OpenAI/provider calls
- no Codex calls
- no child_process
- no fs writes
- no scheduler
- no daemon
- no hidden background work
- no Date.now or new Date unless using explicit input created_at fallback constant
- no randomness
- no persistence
- no app route imports
- no UI component imports
- no App/MCP imports

## 14. Public Safety

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

## 15. Validation

`npm run smoke:autonomy-contract-v0-1` checks the Phase 8A docs, type exports,
helper exports, fixture, package script, latest-index pointer, authority
boundary, default no-auto-apply policy, stop conditions, review escalation,
public safety, helper import boundary, and changed-file boundary.

Browser validation is not required for Phase 8A because this phase adds no
Web UI/browser-facing behavior.

Apps/MCP live runtime validation is not required for Phase 8A because this
phase adds no App/MCP tool or runtime behavior.

Proof-only closeout is not required for Phase 8A unless runtime and
`CODEX_WORK_ID` proof path are explicitly available and scoped. Phase 8A does
not write proof/evidence.

## 16. Next Phase Readiness

Phase 9 runner can start only after separate explicit scope and approval. Phase
8A is ready for future review only if:

- AutonomyContract exists.
- AutonomyBudget exists.
- AutonomyDeltaMergePolicy exists.
- AutonomyReviewEscalationPolicy exists.
- Stop conditions exist.
- Reporting cadence exists.
- Output policy exists.
- Run preview exists and status is `preview_only`.
- builder, fixture, and smoke pass.
- source refs and authority boundary are explicit.
- `auto_apply_allowed` is false.
- runner/scheduler/execution are not implemented.
- no UI/route/MCP/App/tool/write/execution authority is added.
- Phase 9 runner can consume the contract without inventing policy.
