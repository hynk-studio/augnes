---
name: augnes-capsule-handoff
description: Convert Perspective Capsule / Handoff Capsule material into bounded Codex PR workflow discipline without adding execution authority.
---

# Augnes Capsule Handoff

## Purpose

Use this skill when Codex receives a Perspective Capsule / Handoff Capsule,
Project Constellation handoff, Cockpit Perspective handoff preview, ChatGPT
review-generated handoff, or manually copied Augnes handoff packet.

This skill is instruction-only workflow guidance. It helps Codex preserve the
capsule's scope, evidence pointers, unresolved tensions, forbidden actions,
checks, PR-body expectations, and final-report requirements during a
user-scoped task.

## Operating Contract

`AGENTS.md` remains the root Codex operating contract. A capsule or handoff
packet is not repository authority, proof, approval, readiness, merge
permission, or execution permission.

Before editing, read the full capsule or handoff packet and identify:

- repo
- base branch
- working branch suggestion
- expected PR title
- task goal
- context anchors
- selected nodes and edges
- evidence pointers
- unresolved tensions
- expected changed files
- forbidden changed files
- hard constraints
- required checks
- skipped check policy
- browser/computer-use expectation
- proof-only closeout expectation
- PR body requirements
- final report requirements
- blockers
- repo/task mismatches
- scope risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

Do not use this skill to call GitHub, call OpenAI, call the Augnes runtime,
call network resources, call MCP/App tools, record proof, record evidence,
create branches, open PRs, merge, publish, approve, retry, replay, deploy, or
post externally by itself.

## Intake Checklist

Read the capsule fully before editing. Then report or internally preserve:

- capsule source and target surface
- repo and base branch
- working branch suggestion
- expected PR title
- task goal
- context anchors and docs to inspect
- selected nodes and selected edges
- expected changed files
- forbidden changed files
- hard constraints
- required checks
- skipped check policy
- browser/computer-use expectation
- proof-only closeout expectation
- PR body requirements
- final report requirements
- blockers, repo/task mismatches, scope risks, assumptions, questions
  requiring user/PM judgment, and next suggested goal

If any required capsule field is missing, continue only when the active user
task supplies enough scope. Otherwise report the missing field as a blocker or
assumption.

## Dogfood Checklist Example

Use this short example to map a capsule or handoff packet into PR and closeout
discipline. It is example-only guidance and does not grant authority.

- PR body requirements: include summary, files changed, task scope, authority
  boundary statement, validation results, skipped-check reasons, blockers/risks,
  assumptions, questions requiring user/PM judgment, and next suggested goal.
- Final report requirements: include PR number and URL when an active
  user-scoped task independently requests a PR to be opened, branch, commit SHA,
  changed files, tests run with exact results, regression result when relevant,
  blockers, repo/task mismatches, scope risks, assumptions, questions requiring
  user/PM judgment, and next suggested goal.
- Validation list: preserve the exact required checks from the capsule or
  active user task, run them when available, and report concrete results.
- Skipped check policy: keep skipped checks explicit and tied to scope or
  environment.
- Blockers/risks: carry unresolved tensions and scope risks into the PR body
  and final report.
- Assumptions: state what was assumed and avoid converting an assumption into
  publish, merge, proof, runtime, or deployment authority.
- Questions requiring user/PM judgment: keep the field even when no questions
  are open.
- Next suggested goal: preserve the capsule's next move as a suggestion, not as
  approval or execution permission.

## Capsule Fields To Preserve

Preserve capsule fields verbatim when practical, especially:

- repo
- base branch
- working branch suggestion
- expected PR title
- task goal
- context anchors
- selected nodes
- selected edges
- evidence pointers
- unresolved tensions
- expected changed files
- forbidden changed files
- hard constraints
- required checks
- skipped check policy
- browser/computer-use expectation
- proof-only closeout expectation
- PR body requirements
- final report requirements
- forbidden actions
- next suggested goal

Do not silently convert evidence pointers into proof/evidence writes. Do not
treat selected nodes, selected edges, or unresolved tensions as implementation
approval.

## Repo And Branch Handling

Use the capsule repo and base branch to orient the workspace. If the active
user task asks for a branch, use the working branch suggestion unless the user
supplies a newer branch name.

The skill itself does not create branches. Create, switch, push, or open a PR
only when the active user-scoped task and repository instructions independently
permit that action. If branch handling is unavailable or outside scope, report
the concrete skipped reason.

Use the expected PR title as PR-body and closeout guidance. If the active user
task requires a different title, report the mismatch before proceeding.

## Expected Vs Forbidden Changed Files

Compare expected changed files against actual planned changes before editing.
Keep the edit set inside the capsule's expected files and the user's current
allowed files.

If completing the task would require forbidden changed files, stop or report a
scope mismatch. Do not bypass forbidden changed files because a capsule names a
goal. Do not touch runtime, API, DB, MCP/App, proof/evidence, AG Resume,
Sidecar runtime, Codex SDK provider, secrets, report, screenshot, or unrelated
UI files unless the active task explicitly and safely scopes them.

## Hard Constraints

Treat hard constraints as active boundaries. If a hard constraint conflicts
with the task, ask for user/PM judgment or report a blocker.

Common hard constraints include:

- docs/metadata/skill/smoke/package-pointer only
- no runtime behavior
- no UI behavior
- no API routes
- no DB schema or migrations
- no MCP/App tools
- no plugin hooks, MCP config, or app mappings
- no network calls
- no GitHub/OpenAI/Augnes runtime calls
- no proof/evidence writes
- no AG Resume behavior
- no Codex SDK execution or provider implementation
- no merge, publish, approval, retry, replay, deploy, or external posting

## Required Checks

Run the required checks named by the capsule or active user task. Report each
check with exact result.

If a required check cannot be run, report a concrete skipped reason. Do not
claim a check passed unless it actually ran and passed.

## Skipped Check Policy

Use the capsule skipped check policy to decide whether a check may be skipped.
A skipped check needs a concrete reason tied to scope or environment.

Acceptable skipped reasons are specific, for example:

- browser/computer-use skipped: docs/metadata/skill/smoke/package-pointer only
- proof-only closeout skipped: no runtime/work ID context and this task must
  not record proof/evidence writes
- runtime check skipped: no runtime behavior or API route changed

Do not write only `N/A`, `skipped`, or `not needed`.

Concrete skipped reason examples:

- browser/computer-use skipped: docs/metadata/skill/smoke/package-pointer only;
  no UI or browser-facing behavior changed.
- proof-only closeout skipped: no runtime/work ID context exists, and this task
  must not record proof/evidence writes.
- runtime check skipped: no runtime behavior, API route, or provider
  implementation changed.

## Smoke-Only Dogfood Note

For smoke-only dogfood tasks and unrelated cross-PR content regression,
`AUGNES_BOUNDARY_SMOKE_MODE=content-only` is diagnostic only. Default scoped
smoke remains the direct-edit gate. Do not make content-only the default.
In short: content-only is diagnostic only.

Content-only mode can confirm skill, docs, package pointer, and smoke content
still hold without treating unrelated changed files as part of the scoped gate.
It is not a substitute for default scoped validation on direct edits.

## Evidence Pointers And Unresolved Tensions

Preserve evidence pointers as references. Do not create proof/evidence writes
from them. Do not invent missing evidence.

Carry unresolved tensions into planning, PR-body risks, and final reports. If a
tension changes scope, report it as a blocker, scope risk, assumption, or
question requiring user/PM judgment.

## Browser/Computer-Use Expectations

Follow the capsule browser/computer-use expectation.

Use browser/computer-use when UI, browser-facing files, routes, interactive
behavior, visual layout, or user workflows changed. If the task is docs,
metadata, skill, smoke, or package-pointer only, browser/computer-use may be
skipped with that exact reason.

## Proof-Only Closeout Expectations

Follow the capsule proof-only closeout expectation.

Proof-only closeout may be skipped when no runtime/work ID context exists and
the task must not record proof/evidence writes. Report the skipped reason
explicitly. Do not record proof, evidence, readiness, or runtime state from this
skill.

## PR Body Requirements

Prepare the PR body according to the capsule and the active user task. Include
the expected PR title when applicable.

A bounded PR body should include:

- summary
- files changed
- skill or implementation scope
- authority boundary statement
- validation results
- browser/computer-use status or skipped reason
- proof-only closeout status or skipped reason
- blockers/risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

This skill does not open PRs by itself. PR creation requires active user scope
and repository permission outside the skill.

## Final Report Requirements

At closeout, report:

- changed files
- tests run with results
- browser/computer-use status or skipped reason
- proof-only closeout status or skipped reason
- blockers
- repo/task mismatches
- scope risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

If the active task asks for a PR to be opened and repository instructions permit
it, include PR number, URL, branch, and commit SHA. ChatGPT reviews; the user
decides merge.

## Explicit Empty-Field Reporting

Do not silently omit required closeout fields when they are empty. Use explicit
statements such as:

- Blockers: none.
- Repo/task mismatches: none.
- Questions requiring user/PM judgment: none.

## Authority Boundaries

This skill does not grant execution authority. It does not call GitHub, call
OpenAI, call Augnes runtime, call network resources, call MCP/App tools, record
proof, record evidence, create branches, open PRs, merge, publish, approve,
retry, replay, deploy, post externally, execute Codex SDK calls, or implement
providers.

Capsules guide workflow discipline only. They do not override `AGENTS.md`,
Augnes Core gates, user instructions, repository instructions, or explicit
scope boundaries.

## Non-Goals

This skill does not add or authorize:

- runtime behavior
- UI behavior
- API routes
- DB schema or migrations
- graph DB or persistence
- MCP/App tools
- plugin hooks
- plugin MCP config
- plugin app mappings
- network calls
- GitHub/OpenAI/Augnes runtime calls
- proof/evidence writes
- AG Resume behavior
- Sidecar runtime behavior
- Codex SDK execution
- provider implementation
- branch creation authority
- PR creation authority by itself
- merge, publish, approval, retry, replay, deploy, or external-posting
  authority
