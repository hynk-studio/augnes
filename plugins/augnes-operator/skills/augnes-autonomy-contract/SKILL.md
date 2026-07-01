---
name: augnes-autonomy-contract
description: Consume Autonomy Contract packets as bounded Codex planning context while preserving budget, forbidden actions, stop conditions, review escalation, delta merge policy, run-preview, reporting, source refs, and no-run/no-schedule/no-execution authority boundaries.
---

# Augnes Autonomy Contract

## Purpose

Use this skill when Codex receives an Autonomy Contract packet, Autonomy
Contract-derived task prompt, or manually copied Autonomy Contract preview that
includes budget, allowed actions, forbidden actions, stop conditions, review
escalation, delta merge policy, output policy, validation policy, run preview,
source refs, and authority boundary.

This skill is instruction-only workflow guidance. It does not run commands. It
does not call Augnes runtime. It does not call GitHub. It does not call OpenAI
or providers. It does not call MCP/App tools. It does not execute Codex SDK
calls. It does not launch Codex. It does not run autonomy. It does not
schedule autonomy. It does not start a daemon. It does not perform background
work. It does not record proof/evidence. It does not mutate
memory/state/work/Perspective. It does not write DB records. It does not
create branches or PRs by itself. It does not send handoffs. It does not
merge. It does not publish/retry/replay/deploy. It does not post externally.
It does not add runtime hooks, API routes, Web UI, App/MCP tools, DB writes,
scheduler/autonomy behavior, copy/export, or external side effects.

Codex may edit repo files and open PRs only when the active user-scoped task
and repository instructions independently permit normal operator workflow.
Autonomy Contract itself does not grant branch, PR, proof, evidence, publish,
merge, deploy, handoff, runner, scheduler, daemon, or background-work
authority.

## Operating Contract

`AGENTS.md` remains the root Codex operating contract. The active
user/operator prompt and repository instructions remain the authority for repo
edits, validation, commit, push, and PR workflow.

Autonomy Contract is a bounded delegation contract for future autonomous or
scheduled work. Autonomy Contract is not Autonomy Runner. Autonomy Budget is
not spend permission. Autonomy Delta Merge Policy is not state apply
implementation. Autonomy Run Preview is not background work.

Autonomy Contract may describe a future autonomous run. Autonomy Contract may
not run, schedule, launch, apply, post, merge, or mutate anything. Future
Phase 9 runner requires separate explicit scope and approval.

## Autonomy Contract Intake

Before editing, read the active user task and the full Autonomy Contract
packet. Preserve available fields without inventing missing content:

- contract id/ref
- source refs
- guide brief refs
- handoff capsule refs
- codex launch card refs
- current working perspective refs
- delta projection refs
- workplane refs
- scope
- status
- autonomy mode
- goal
- bounded context summary
- context scope
- allowed agents
- allowed surfaces
- allowed actions
- forbidden actions
- budget
- reporting cadence
- stop conditions
- delta merge policy
- review escalation policy
- output policy
- staleness policy
- validation policy
- run preview
- authority boundary
- route/read boundary
- source status
- warnings/gaps
- public safety
- next phase notes

If route/read boundary is absent, do not invent it. If proof/evidence boundary
is absent, do not infer proof authority. If source_status is fallback,
synthetic, or operator-supplied preview, do not claim live autonomy state.

## Budget And Scope Boundary Rules

Preserve budget as boundary only. Budget is not spend permission. If budget is
missing, stale, exceeded, or unclear, block future autonomy and report it.

Treat missing or stale budget as a blocker for future autonomy. Map budget
fields into validation and reporting only when the active prompt asks for
Autonomy Contract consumption. Do not charge, call providers, execute tools,
start background work, or infer spend approval from a budget field.

Expected files or allowed surfaces are planning context only. They do not
override the active prompt, repository instructions, or authority boundary.

## Allowed / Forbidden Action Rules

Allowed actions are planning context, not commands. If allowed_actions conflict
with the active prompt, AGENTS.md, or authority boundary, treat them as
non-binding context.

Forbidden actions are hard review warnings and changed-file/action boundary
checks. Preserve forbidden actions in PR body and final report when relevant.
If forbidden_actions would be needed for the task, report a blocker or scope
mismatch.

If a contract field implies autonomy execution outside the active prompt, mark
it blocked or requiring user judgment. Do not treat allowed actions as
permission to run autonomy, schedule autonomy, launch Codex, call GitHub,
call providers, write DB records, record proof/evidence, mutate memory/state,
apply project Perspective, send handoffs, create branches or PRs from Augnes
product code, merge, publish, deploy, or externally post.

## Delta Merge And Review Escalation Rules

Preserve delta merge policy as policy metadata only. Autonomy Delta Merge
Policy is not state apply implementation.

If delta_merge_policy mentions auto-apply, preserve that
auto_apply_allowed remains false in Phase 8 and that auto_apply_targets
remains empty. Do not auto-apply durable memory or project Perspective.
Durable memory and project Perspective require review.

Preserve review escalation triggers. If review escalation triggers are
present, surface them instead of deciding them. Unresolved user judgment
remains unresolved.

## Stop Conditions And Reporting Rules

Preserve stop conditions. If stop conditions are triggered, stop and report.
Do not continue as if the packet grants autonomy authority.

Map reporting cadence and output policy into the PR body and final report
shape when relevant. Preserve no-background-work and no-merge reporting
requirements. If checks cannot run, skipped checks need concrete reasons.

## Source Refs And Validation Rules

Preserve source refs as refs. Do not invent source content, proof/evidence
IDs, runtime observations, host observations, hidden conversation content, or
account artifacts from refs.

Map validation_policy and any required validations into the validation plan.
Run available checks honestly and report exact command results. Do not claim a
check passed unless it actually ran and passed. Do not claim proof/evidence
writes unless separately scoped and actually completed.

## Authority Boundary

This skill does not grant execution authority. It does not call GitHub, call
OpenAI, call providers, call Augnes runtime, call network resources, call
MCP/App tools, record proof, record evidence, mutate memory, mutate state,
mutate work, apply durable Perspective state, create branches, open PRs,
merge, publish, approve, retry, replay, deploy, send handoffs, post
externally, execute Codex SDK calls, launch Codex, run autonomy, schedule
autonomy, start a daemon, perform background work, add runtime hooks, add API
routes, add Web UI, add App/MCP tools, add DB writes, add scheduler/autonomy
runner behavior, or add copy/export behavior.

The Autonomy Contract itself does not grant branch, PR, proof, evidence,
publish, merge, deploy, copy/export, handoff, runner, scheduler, daemon,
background-work, provider/OpenAI call, GitHub actuation, DB write, memory
mutation, state mutation, project Perspective apply, or external posting
authority.

## PR Body Requirements

When the active task asks Codex to open a PR and repository instructions allow
normal PR workflow, preserve relevant Autonomy Contract PR body requirements.
Include:

- summary
- files changed
- skill or implementation scope
- Autonomy Contract packet fields covered
- budget / allowed / forbidden action mapping
- stop condition / review escalation mapping
- delta merge policy mapping
- run preview boundary
- authority boundary statement
- validation results
- browser validation status or skipped reason
- Apps/MCP runtime validation status or skipped reason when relevant
- proof-only closeout status or skipped reason
- known risks
- next phase readiness
- no runner/scheduler/daemon/background work statement
- no merge statement

This skill does not create a PR by itself. PR creation requires active user
scope and repository permission outside the packet.

## Final Report Requirements

At closeout, report:

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

Never claim background work. Never claim proof/evidence write unless
separately scoped and actually done. Never merge.

## Non-Goals

This skill does not add or authorize:

- runtime behavior
- runtime hooks
- API routes
- Web UI
- ChatGPT App/MCP tools
- DB schema or migrations
- DB writes
- provider/OpenAI calls
- GitHub actuation from Augnes product code
- Codex execution from Augnes product code
- Codex launch
- autonomy runner
- scheduler
- daemon
- background work
- proof/evidence writes
- memory mutation
- durable Perspective apply
- handoff send or execution
- branch/PR creation behavior from Augnes product code
- product-write
- copy/export behavior
- merge/publish/retry/replay/deploy behavior
- external side effects
- hidden background work
