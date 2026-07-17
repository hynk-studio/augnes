---
name: augnes-guidebrief-handoff
description: Consume GuideBrief packets as bounded Codex task-start context while preserving observed, inferred, suggested, judgment, source-ref, check, and authority boundaries.
---

# Augnes GuideBrief Handoff

## Purpose

Use this skill when Codex receives a GuideBrief packet, GuideBrief-derived
handoff text, or a task prompt that explicitly asks Codex to preserve
GuideBrief context.

This skill is instruction-only workflow guidance. It does not run commands,
call Augnes runtime, call GitHub, call OpenAI, call providers, call MCP/App
tools, execute Codex SDK calls, record proof, record evidence, mutate memory,
mutate state, create branches, open PRs, merge, publish, retry, replay, deploy,
send handoffs, or post externally by itself.

## Operating Contract

`AGENTS.md` remains the root Codex operating contract. GuideBrief is a
read-only guide packet, not repository authority, proof, approval, readiness,
merge permission, handoff execution permission, or Codex launch permission.

Before editing, read the active user task and the full GuideBrief packet or
GuideBrief-derived handoff text. Preserve:

- guide brief ref
- guide version
- scope
- as of timestamp
- task prompt ref
- repo boundary
- observed context
- inferred context
- suggested context
- needs user judgment context
- source refs
- expected files
- expected checks
- skipped checks and skipped check policy
- authority boundary
- Codex non-goals
- closeout requirements
- next phase notes

## GuideBrief Intake

At task start, restate or internally preserve:

- Observed context from source-backed read-model observations.
- Inferred context with confidence, caveats, and non-authority notes.
- Suggested context as non-binding and advisory only.
- Needs user judgment items as unresolved questions.
- Source refs and expected files/checks.
- Skipped checks and concrete skipped-check policy.
- Authority boundary and no-write/no-execution limits.
- Handoff candidates as preview-only.

If the GuideBrief is missing a required section, report the missing section or
treat it as an assumption. Do not reconstruct hidden or missing GuideBrief
content.

## Separation Rules

Preserve observed/inferred/suggested/judgment separation:

- Observed items come only from GuideBrief observed entries and source refs.
- Inferred items remain derived interpretation and must keep caveats and
  confidence.
- Suggested items are candidate next actions or navigation suggestions only.
  GuideBrief suggestions are not commands.
- Needs user judgment items must be surfaced, not decided by Codex.

Convert suggestions only into implementation considerations when the active
operator prompt explicitly scopes the work. If a suggestion implies write,
execution, handoff, provider, GitHub, DB, proof/evidence, or runtime authority
outside the prompt, mark it blocked or requiring user judgment.

## Source Refs And Checks

Preserve source refs in planning, PR body language, and final reports when
they are relevant to the implemented slice. Keep source refs as references; do
not invent source content, evidence IDs, action IDs, runtime observations, PR
URLs, or host observations.

Run expected checks when available. Report exact validation results. Skipped
checks require concrete reasons tied to scope or environment. Do not hide
skipped checks and do not claim a check passed unless it actually ran and
passed.

## Authority Boundary

This skill does not grant execution authority. It does not call GitHub, call
OpenAI, call providers, call Augnes runtime, call network resources, call
MCP/App tools, record proof, record evidence, mutate memory, mutate state,
apply durable Perspective state, create branches, open PRs, merge, publish,
approve, retry, replay, deploy, send handoffs, post externally, execute Codex
SDK calls, add runtime hooks, add API routes, add Web UI, add DB writes, add
scheduler/autonomy runner behavior, or restore retired manual Handoff Capsule
or Codex Launch Card runtime behavior.

Codex may edit repo files and open PRs only when the active user-scoped task
and repository instructions independently permit that normal operator workflow.
The GuideBrief itself does not create branch, PR, proof, evidence, publish,
merge, deploy, or handoff authority.

## Final Report Requirements

At closeout, report:

- GuideBrief consumed: yes/no.
- observed/inferred/suggested/judgment separation preserved: yes/no.
- source refs preserved: yes/no.
- authority boundary preserved: yes/no.
- expected files and changed files.
- expected checks and validation results.
- skipped checks with concrete reasons.
- proof/evidence write status or skipped reason.
- no proof/evidence write unless separately scoped.
- no background work statement.
- no merge statement.
- known risks.
- next phase readiness.

Never claim background work. Never claim proof/evidence write unless
separately scoped and actually done. Never merge.

## Non-Goals

This skill does not add or authorize:

- runtime behavior
- runtime hooks
- API routes
- Web UI
- MCP/App tools
- DB schema or migrations
- DB writes
- provider/OpenAI calls
- GitHub actuation from Augnes
- Codex execution from Augnes
- proof/evidence writes
- memory mutation
- durable Perspective apply
- scheduler/autonomy runner behavior
- handoff execution
- retired manual Handoff Capsule runtime
- retired manual Codex Launch Card runtime
- branch/PR creation behavior from Augnes product code
- merge, publish, retry, replay, deploy, or external side effects
