# Capsule Handoff Skill Dogfood Report v0.1

## Status And Scope

Status: initial dogfood report for `augnes-capsule-handoff`.

This report evaluates whether the instruction-only skill is practical for
consuming Perspective Capsule / Handoff Capsule material in a small bounded
Codex PR workflow.

Scope is docs/smoke/package-pointer only:

- `docs/CAPSULE_HANDOFF_SKILL_DOGFOOD_REPORT_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `scripts/smoke-capsule-handoff-skill-dogfood-report.mjs`
- `scripts/smoke-augnes-capsule-handoff-skill.mjs` as a narrow adjacent
  smoke allowlist update required by the exact validation command.
- `package.json`

The dogfood task does not add runtime behavior, UI behavior, API routes, DB
schema or migrations, MCP/App tools, plugin hooks, plugin MCP config, plugin
app mappings, GitHub/OpenAI/Augnes runtime calls, network calls, proof/evidence
writes, AG Resume behavior, Codex SDK execution/provider behavior, branch
creation authority, PR creation authority by itself, or
merge/publish/approval/retry/replay/deploy authority.

## Dogfood Source

The dogfood source is the user-scoped handoff for the PR titled
`docs/dogfood: add Capsule Handoff skill dogfood report v0.1`, plus the
instruction-only skill at
`plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md`.

Context anchors used:

- PR #367 added a read-only copyable Perspective Capsule / Handoff Capsule
  preview in Cockpit.
- PR #369 added the `augnes-capsule-handoff` instruction-only plugin skill.
- This PR records whether the skill is practical for consuming handoff material.

The source is treated as workflow guidance and user scope, not as proof,
readiness, merge approval, execution permission, or runtime authority.

## Capsule/Handoff Fields Used

The skill helped preserve these fields from the active handoff:

- repo: `hynk-studio/augnes`
- base branch: `main`
- working branch suggestion:
  `codex/capsule-handoff-skill-dogfood-report-v0-1`
- expected PR title:
  `docs/dogfood: add Capsule Handoff skill dogfood report v0.1`
- task goal: dogfood the `augnes-capsule-handoff` skill and record findings.
- context anchors: PR #367, PR #369, the skill file, Perspective Capsule /
  Handoff Capsule material, and this report.
- expected changed files: this report, docs index, dogfood smoke, and
  `package.json`; validation also required a narrow adjacent allowlist update in
  `scripts/smoke-augnes-capsule-handoff-skill.mjs`.
- forbidden changed files: `AGENTS.md`, `components/**`, `app/**`, `db/**`,
  `migrations/**`, `apps/augnes_apps/**`, API route files, MCP/App tool files,
  plugin hooks/config/mappings, secrets/env files, `reports/browser/**`,
  `screenshots/**`, proof/evidence recording implementation files, AG Resume
  implementation files, Sidecar runtime implementation files, and Codex SDK
  provider/runtime implementation files.
- hard constraints: docs/smoke/package-pointer only, no runtime behavior, no
  UI, no API, no DB, no MCP/App, no proof/evidence writes, no AG Resume, no
  Codex SDK execution/provider behavior, no network calls, no branch/PR creation
  authority by itself, and no merge/publish authority.
- required checks: `npm run typecheck`,
  `npm run smoke:capsule-handoff-skill-dogfood-report`,
  `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:capsule-handoff-skill-dogfood-report`,
  `npm run smoke:augnes-capsule-handoff-skill`,
  `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`,
  `git diff --check`, and `git diff --cached --check`.
- skipped check policy: browser/computer-use may be skipped only with a concrete
  docs/smoke/package-pointer reason; proof-only closeout may be skipped only
  with a concrete no runtime/work ID context reason.
- evidence pointers: the referenced PR anchors and local docs/skill paths are
  pointers only, not proof/evidence writes.
- unresolved tensions: the skill can guide a user-scoped PR workflow, but it
  does not itself create branch, PR, merge, publish, proof, or runtime authority.
- browser/computer-use expectation: skipped for this docs/smoke/package-pointer
  task because no UI/browser-facing files or behavior changed.
- proof-only closeout expectation: skipped because there is no runtime/work ID
  context and this PR must not record proof/evidence writes.
- PR body requirements: summary, files changed, dogfood scope, authority
  boundary statement, validation results, browser/computer-use skipped reason,
  proof-only closeout skipped reason, blockers/risks, assumptions, questions
  requiring user/PM judgment, and next suggested goal.
- final report requirements: PR number and URL, branch, commit SHA, changed
  files, tests run with exact results, regression test result, blockers,
  repo/task mismatches, scope risks, assumptions, questions requiring user/PM
  judgment, and next suggested goal.
- blockers: none identified at report-writing time.
- repo/task mismatches: the exact required
  `npm run smoke:augnes-capsule-handoff-skill` command initially rejected the
  dogfood report/smoke as adjacent changed files; this was resolved with a
  narrow smoke-only allowlist update.
- scope risks: accidental broadening into runtime/UI/plugin-hook/proof behavior
  or treating the skill as execution authority.
- assumptions: the active user task independently authorizes branch creation,
  PR creation, and publishing for this PR; the skill itself does not.
- questions requiring user/PM judgment: none identified at report-writing time.
- next suggested goal: use this report to decide whether the skill needs wording
  refinements before broader capsule handoff dogfood.

## What The Skill Helped Preserve

The skill was practical for turning a long handoff packet into an edit
discipline:

- It made repo, base branch, working branch suggestion, expected PR title, task
  goal, and context anchors explicit before editing.
- It forced expected changed files and forbidden changed files to be compared
  before implementation.
- It kept hard constraints visible while adding the smoke/package pointer.
- It separated required checks from skipped check policy.
- It preserved evidence pointers and unresolved tensions as reportable context
  instead of converting them into proof/evidence writes.
- It kept browser/computer-use and proof-only closeout handling explicit.
- It carried PR body requirements and final report requirements into closeout.
- It provided slots for blockers, repo/task mismatches, scope risks,
  assumptions, questions requiring user/PM judgment, and next suggested goal.

## Friction / Ambiguity Observed

The skill was useful, but a few points needed judgment:

- The skill does not prescribe a reusable smoke helper shape, so this task used
  existing `smoke-boundary-common.mjs` patterns.
- The skill says the expected PR title should be preserved; the active task also
  supplied a concrete expected title, so there was no title conflict.
- The skill distinguishes user-scoped branch/PR handling from skill authority.
  That distinction is correct, but it must remain explicit in PR bodies and
  final reports.
- Evidence pointers and unresolved tensions are useful fields even when the
  dogfood task has no runtime evidence to record.

## Validation Behavior

The dogfood smoke is static and local. It checks report sections, required
handoff fields, authority-boundary wording, docs/index pointers, package script
pointer, and changed-file boundaries.

Default scoped mode remains strict:

- changed-file allowlist enforcement is enabled.
- untracked-file boundary enforcement is enabled.
- forbidden changed-path enforcement is enabled.

`AUGNES_BOUNDARY_SMOKE_MODE=content-only` remains explicit and diagnostic:

- changed-file allowlist enforcement is skipped.
- untracked-file boundary enforcement is skipped.
- forbidden changed-path enforcement is skipped.
- report/docs/package content checks still run.

## Browser/Computer-Use Handling

Browser/computer-use is skipped for this PR because it is
docs/smoke/package-pointer only and touches no UI implementation,
browser-facing files, routes, interactive behavior, visual layout, or user
workflow behavior.

## Proof-Only Closeout Handling

Proof-only closeout is skipped because no runtime/work ID context exists and
this PR must not record proof/evidence writes.

The report preserves evidence pointers as references only. It does not create
proof, evidence, readiness, runtime state, or Augnes work records.

## Authority Boundary Observations

The skill was effective at keeping authority boundaries visible:

- It does not grant runtime behavior.
- It does not grant UI behavior.
- It does not grant API route behavior.
- It does not grant DB schema/migration behavior.
- It does not grant MCP/App tool behavior.
- It does not grant plugin hook/config/mapping behavior.
- It does not grant GitHub/OpenAI/Augnes runtime call authority.
- It does not grant network call authority.
- It does not grant proof/evidence write authority.
- It does not grant AG Resume behavior.
- It does not grant Codex SDK execution/provider behavior.
- It does not grant branch creation authority.
- It does not grant PR creation authority by itself.
- It does not grant merge/publish/approval/retry/replay/deploy authority.

## Suggested Skill Improvements

Suggested follow-ups:

- Add a short dogfood checklist example that maps a capsule packet into a PR
  body and final report.
- Add a note that smoke-only dogfood tasks should keep content-only boundary
  mode diagnostic rather than default.
- Add examples of acceptable concrete skipped reasons for browser/computer-use
  and proof-only closeout.
- Clarify how to report "no blockers" and "no questions requiring user/PM
  judgment" without dropping those fields.

## Non-Goals

This report does not implement runtime behavior, UI behavior, API routes, DB
schema/migrations, MCP/App tools, plugin hooks, plugin MCP config, plugin app
mappings, GitHub/OpenAI/Augnes runtime calls, network calls, proof/evidence
writes, AG Resume behavior, Codex SDK execution/provider behavior, branch
creation authority, PR creation authority by itself,
merge/publish/approval/retry/replay/deploy authority, Project Constellation UI
behavior, or Perspective Capsule runtime behavior.
