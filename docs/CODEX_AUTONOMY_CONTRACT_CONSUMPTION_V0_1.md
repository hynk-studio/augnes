# Codex Autonomy Contract Consumption v0.1

## 1. Purpose

Codex Autonomy Contract consumption defines how a Codex worker may consume
Autonomy Contract packets as planning boundary context for a separately scoped
user/operator task.

Autonomy Contract is a bounded delegation contract for future autonomous or
scheduled work. Autonomy Contract is not Autonomy Runner. Autonomy Budget is
not spend permission. Autonomy Delta Merge Policy is not state apply
implementation. Autonomy Run Preview is not background work.

Autonomy Contract may describe a future autonomous run. Autonomy Contract may
not run, schedule, launch, apply, post, merge, or mutate anything. Phase 9
runner requires separate explicit scope and approval.

This document is docs/skill/smoke alignment only. It adds no runtime hooks, no
API routes, no Web UI, no ChatGPT App/MCP tools, no DB schema or migration, no
DB write, no provider/OpenAI call, no GitHub actuation from Augnes product
code, no Codex execution from Augnes product code, no proof/evidence write, no
memory mutation, no durable Perspective apply, no scheduler/autonomy runner,
no daemon, no background work, no handoff send or execution, no branch/PR
creation behavior from Augnes product code, no product-write behavior, no
copy/export behavior, no merge/publish/retry/replay/deploy behavior, and no
external side effects.

## 2. Packet Boundary

Codex may use Autonomy Contract to preserve budget, stop conditions, forbidden
actions, review escalation, validation policy, reporting policy, output
policy, source refs, and authority boundary. It may use those fields while
performing a separately scoped user task.

Codex must not treat Autonomy Contract as permission to execute autonomously.
Codex must not treat allowed_actions as commands. Codex must not treat budget
as spend permission. Codex must not treat run_preview as active execution.
Codex must not treat delta_merge_policy as implementation of auto-apply.
Codex must not auto-apply durable memory or project Perspective. Codex must
not decide unresolved user judgment. Codex must not claim proof/evidence
writes unless separately scoped and actually completed. Codex must not claim
background work. Codex must not merge.

Active user/operator prompt and AGENTS.md remain the authority for repo edits
and normal PR workflow. The packet itself does not grant runner, scheduler,
daemon, background work, proof, evidence, state mutation, memory mutation, DB
write, GitHub actuation, provider/OpenAI call, Codex execution, Codex launch,
handoff-send, autonomy launch, merge, publish, deploy, or external posting
authority.

## 3. Required Packet Intake Sections

When an Autonomy Contract packet is provided, preserve the available fields
below. If a field is absent, do not invent it.

- `contract_ref` or `contract_id`
- `scope`
- `status`
- `autonomy_mode`
- `title`
- `goal`
- `bounded_context_summary`
- `source_refs`
- `guide_brief_refs`
- `handoff_capsule_refs`
- `codex_launch_card_refs`
- `current_working_perspective_refs`
- `delta_projection_refs`
- `workplane_refs`
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
- `route_authority_boundary` if present
- `read_boundary` if present
- `source_status`
- `warnings`
- `gaps`
- `public_safety`
- `next_phase_notes`

## 4. Codex Task-Start Rules

When an Autonomy Contract is provided, Codex should start by preserving or
restating:

- the Autonomy Contract goal and bounded context
- source refs as refs, not invented source content
- budget as boundary only
- missing or stale budget as a blocker
- allowed_actions as planning context only, not automatic permission
- forbidden_actions as hard review warnings and changed-file/action boundary
  checks
- required validations and output policy in the validation and final reporting
  plan
- stop conditions
- review escalation triggers
- `run_preview.status` as `preview_only`
- the fact that AutonomyRunPreview is not execution
- the fact that no runner/scheduler/daemon/background job exists unless
  separately scoped in a future phase
- delta_merge_policy with `auto_apply_allowed` false
- `auto_apply_targets` as empty
- durable memory and project Perspective review requirements
- proof/evidence boundary
- authority_boundary and route/read boundary notes

Restate or preserve the Autonomy Contract goal and bounded context. Preserve
source refs as refs, not invented source content. Preserve stop conditions.
Preserve review escalation triggers.

Codex must not claim live runtime data unless source_status says it is live.
Codex must not claim proof/evidence writes unless separately scoped and
actually completed. Codex must not claim background work. Codex must not merge.

If an Autonomy Contract field implies autonomy execution outside the active
prompt, mark it blocked or requiring user judgment. If allowed_actions conflict
with the active prompt, AGENTS.md, or authority boundary, treat them as
non-binding context. If forbidden_actions would be needed for the task, report
a blocker or scope mismatch. If stop conditions are triggered, stop and report.
If review escalation triggers are present, surface them instead of deciding
them.

## 5. Budget And Delta Merge Policy

Autonomy Budget is boundary only. It is not spend permission. If budget is
missing, stale, exceeded, or unclear, block future autonomy and report it.

Autonomy Delta Merge Policy is not state apply implementation. If
delta_merge_policy mentions auto-apply, preserve that `auto_apply_allowed` is
false in Phase 8 and that `auto_apply_targets` remains empty. Durable memory
and project Perspective require review.

Proof/evidence write, external publication, GitHub actuation, provider call,
branch/PR creation, and durable apply without review remain blocked unless a
future separately scoped phase explicitly changes product authority.

## 6. Source Refs, Checks, And Reporting

Source refs should be preserved as references in planning, PR body language,
and final reports when relevant. Do not expand refs into invented content,
proof/evidence IDs, runtime observations, host observations, hidden
conversation content, or account artifacts.

Required checks should be run when available and in scope. Optional checks may
be run when available and useful. If checks cannot run, skipped checks need
concrete reasons. If source_status is fallback, synthetic, or
operator-supplied preview, do not claim live autonomy state. If route/read
boundary is absent, do not invent it. If proof/evidence boundary is absent, do
not infer proof authority.

## 7. Closeout Requirements

A Codex final report that consumed Autonomy Contract should report:

- Autonomy Contract consumed: yes/no.
- Budget boundary preserved: yes/no.
- Forbidden actions preserved: yes/no.
- Stop conditions preserved: yes/no.
- Review escalation preserved: yes/no.
- Delta merge policy preserved: yes/no.
- auto_apply_allowed remained false: yes/no.
- run_preview remained preview_only: yes/no.
- authority boundary preserved: yes/no.
- source refs preserved: yes/no.
- expected files and actual changed files.
- forbidden files touched: yes/no with explanation.
- expected checks and actual validation results.
- skipped checks with concrete reasons.
- proof/evidence write status or skipped reason.
- unresolved user judgment carried forward: yes/no.
- known risks.
- next phase readiness.
- no runner/scheduler/daemon/background work statement.
- no merge statement.

Never claim runner, scheduler, daemon, background work, proof/evidence writes,
runtime state mutation, memory mutation, durable Perspective apply, handoff
send, Codex execution, Codex launch, branch/PR creation from Augnes product
code, GitHub actuation, provider/OpenAI calls, merge, publish, retry, replay,
deploy, copy/export, or external posting unless a separate explicit user task
and repo authority actually allowed and verified that work.

## 8. Non-Goals

Phase 8E does not implement:

- runtime hooks
- API routes
- Web UI
- ChatGPT App/MCP tools
- DB schema or migrations
- DB writes
- provider/OpenAI calls
- GitHub API actuation from Augnes product code
- Codex execution from Augnes product code
- Codex launch
- autonomy runner
- scheduler
- daemon
- background work
- proof/evidence writes
- memory mutation
- durable Perspective state apply
- handoff send or execution
- branch/PR creation behavior from Augnes product code
- product-write
- copy/export behavior
- merge/publish/retry/replay/deploy behavior
- external side effects
- hidden background work
