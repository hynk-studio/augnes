---
name: augnes-handoff-capsule
description: Consume Handoff Capsule and Codex Launch Card packets as bounded Codex task-start context while preserving source refs, expected files/checks, advisory suggestions, unresolved judgment, skipped-check policy, closeout requirements, and no-execution authority boundaries.
---

# Augnes Handoff Capsule

## Purpose

Use this skill when Codex receives a Handoff Capsule, Codex Launch Card,
Handoff Capsule-derived task prompt, or manually copied Augnes handoff packet
that includes Launch Card-style expected files, checks, reporting, and
authority boundaries.

This skill is instruction-only workflow guidance. It does not run commands,
call Augnes runtime, call GitHub, call OpenAI or providers, call MCP/App tools,
execute Codex SDK calls, record proof/evidence, mutate memory/state/work or
Perspective, create branches or PRs by itself, merge, publish, retry, replay,
deploy, send handoffs, post externally, add runtime hooks, add API routes, add
Web UI, add App/MCP tools, add DB writes, add scheduler/autonomy behavior, add
copy/export behavior, or create external side effects.

Codex may edit repo files and open PRs only when the active user-scoped task
and repository instructions independently permit normal operator workflow.
Handoff Capsule and Codex Launch Card packets themselves do not grant branch,
PR, proof, evidence, publish, merge, deploy, or handoff authority.

## Operating Contract

`AGENTS.md` remains the root Codex operating contract. The active
user/operator prompt and repository instructions remain the authority for repo
edits, validation, commit, push, and PR workflow.

Handoff Capsule and Codex Launch Card are reviewable transfer packets. They
prepare context for another surface. They do not send, launch, execute, post,
merge, publish, or mutate state.

CodexLaunchCard is not Codex execution. HandoffCapsule is not handoff send.
Codex Launch Card is not branch creation. Codex Launch Card is not PR
creation. No status may mean executed. Suggestions are advisory only.
Unresolved user judgment remains unresolved unless the user/operator decides
it outside the packet.

## Handoff Capsule / Launch Card Intake

Before editing, read the active user task and the full Handoff Capsule or
Codex Launch Card packet. Preserve available fields without inventing missing
content:

- capsule id/ref
- launch card id/ref
- source guide brief ref
- scope
- source snapshot refs
- repo
- base branch
- branch suggestion
- expected PR title
- task goal
- task summary
- context anchors
- observed context
- inferred context
- suggested context
- needs user judgment / unresolved user judgment
- source refs
- selected delta refs
- expected files
- forbidden files
- allowed change scope
- forbidden actions
- required checks
- optional checks
- skipped check policy
- PR body requirements
- final report requirements
- proof/evidence boundary
- authority boundary
- route/read boundary
- source status
- warnings/gaps
- public safety
- next phase notes

If a required packet field is missing, report the missing field or treat it as
an explicit assumption. If route/read boundary is absent, do not invent it. If
proof/evidence boundary is absent, do not infer proof authority.

## Separation Rules

Preserve observed/inferred/suggested/judgment separation:

- Observed context comes from source-backed packet observations and source
  refs.
- Inferred context remains derived interpretation and must preserve caveats
  and confidence.
- Suggested context and `suggestions_for_codex` are advisory only; suggestions
  are not commands.
- Needs user judgment / unresolved user judgment must be surfaced, not decided
  by Codex.

Convert suggestions into implementation considerations only when the active
operator prompt explicitly scopes the work. If a Launch Card suggestion
implies write or execution authority outside the active prompt, mark it
blocked or requiring user judgment.

## Source Refs, Expected Files, Forbidden Files, And Checks

Preserve source refs as refs. Do not invent source content, proof/evidence
IDs, runtime observations, host observations, hidden conversation content, or
account artifacts from refs.

Map expected files to expected changed-file scope. Expected files are planning
inputs, not automatic permission to exceed the active prompt. If expected
files conflict with the active prompt or repo status, report the repo/task
mismatch.

Map forbidden files to review warnings and changed-file boundary checks. If
forbidden files are touched, report why and require explicit scope.

Map required checks to the validation plan. Map optional checks to useful
extra validation when available and in scope. Map skipped check policy to the
final skipped-check report. If checks cannot run, skipped checks need concrete
reasons.

If packet source status is fallback, synthetic, or operator-supplied preview,
do not claim live runtime state.

## Authority Boundary

This skill does not grant execution authority. It does not call GitHub, call
OpenAI, call providers, call Augnes runtime, call network resources, call
MCP/App tools, record proof, record evidence, mutate memory, mutate state,
mutate work, apply durable Perspective state, create branches, open PRs,
merge, publish, approve, retry, replay, deploy, send handoffs, post
externally, execute Codex SDK calls, add runtime hooks, add API routes, add
Web UI, add App/MCP tools, add DB writes, add scheduler/autonomy runner
behavior, add copy/export behavior, or implement providers.

The Handoff Capsule and Codex Launch Card themselves do not grant branch, PR,
proof, evidence, publish, merge, deploy, copy/export, or handoff authority.
They do not grant provider/OpenAI call authority, GitHub actuation authority,
DB write authority, memory mutation authority, state mutation authority, or
external posting authority.

## PR Body Requirements

When the active task asks Codex to open a PR and repository instructions allow
normal PR workflow, preserve relevant packet PR body requirements. Include:

- summary
- files changed
- skill or implementation scope
- observed/inferred/suggested/judgment preservation
- expected files/checks/skipped-check policy mapping
- authority boundary statement
- validation results
- browser validation status or skipped reason
- Apps/MCP runtime validation status or skipped reason when relevant
- proof-only closeout status or skipped reason
- known risks
- next phase readiness
- no merge statement

This skill does not create a PR by itself. PR creation requires active user
scope and repository permission outside the packet.

## Final Report Requirements

At closeout, report:

- Handoff Capsule consumed: yes/no.
- Codex Launch Card consumed: yes/no.
- observed/inferred/suggested/judgment separation preserved: yes/no.
- source refs preserved: yes/no.
- expected files and actual changed files.
- forbidden files touched: yes/no with explanation.
- authority boundary preserved: yes/no.
- expected checks and actual validation results.
- skipped checks with concrete reasons.
- proof/evidence write status or skipped reason.
- unresolved user judgment carried forward: yes/no.
- known risks.
- next phase readiness.
- no background work statement.
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
- proof/evidence writes
- memory mutation
- durable Perspective apply
- scheduler/autonomy runner behavior
- handoff send or execution
- branch/PR creation behavior from Augnes product code
- product-write
- merge/publish/retry/replay/deploy behavior
- copy/export behavior
- external side effects
- hidden background work
