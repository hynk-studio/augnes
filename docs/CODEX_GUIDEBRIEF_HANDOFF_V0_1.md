# Codex GuideBrief Handoff v0.1

## 1. Purpose

Codex GuideBrief alignment defines how a Codex worker may consume a
GuideBrief packet as task-start context without turning that packet into
execution authority.

GuideBrief is read-only context. Codex may use it to preserve Observed,
Inferred, Suggested, and Needs user judgment sections, source refs, expected
checks, skipped-check policy, authority boundary notes, and preview-only
handoff candidates while performing a separately scoped user task.

This document is docs/skill/smoke alignment only. It adds no runtime hook, no
Codex execution from Augnes, no GitHub actuation from Augnes, no
provider/OpenAI calls, no API route, no Web UI, no MCP/App tool, no DB writes,
no proof/evidence writes, no memory mutation, no durable Perspective apply, no
scheduler/autonomy runner, no handoff execution, and no external side effects.

## 2. Relationship To GuideBrief

The source GuideBrief contract is `docs/GUIDEBRIEF_CONTRACT_V0_1.md`.
GuideBrief supplies:

- Observed source-backed read-model observations.
- Inferred derived interpretations with confidence and caveats.
- Suggested candidate next actions or navigation suggestions.
- Needs user judgment items that require user/operator/PM choice.
- Source refs, staleness warnings, gaps, handoff candidates, rendering notes,
  and an authority boundary with write/execution/external-call booleans set to
  false.

Codex must not blur those sections. Observed context must not be rewritten as
accepted project fact. Inferred context must preserve caveats. Suggested
context is advisory only, and suggestions are not commands. Needs user
judgment context must be surfaced, and `needs_user_judgment` is not decided by
Codex.

## 3. Relationship To Phase 6

Phase 6A added GuideBrief contract, types, helper, fixture, and smoke.
Phase 6B added the GET-only marker-gated local read route.
Phase 6C added read-only Web Guide display.
Phase 6D added the ChatGPT App/MCP read-only GuideBrief tool.
Phase 6E adds Codex GuideBrief alignment as docs, skill guidance, and static
smoke only.

Manual Handoff Capsule / Codex Launch Card transport was retired in R5. The
automatic Project Home native-host path consumes persisted
`TaskContextPacket` records and does not use this GuideBrief alignment packet.
GuideBrief work may be consumed only as separately scoped, read-only task-start
context.

## 4. GuideBrief-To-Codex Packet Shape

A Codex handoff/alignment packet should preserve at least:

- `guide_brief_ref`
- `guide_version`
- `scope`
- `as_of`
- `task_prompt_ref`
- `repo_boundary`
- `observed_context`
- `inferred_context`
- `suggested_context`
- `needs_user_judgment_context`
- `source_refs`
- `expected_files`
- `expected_checks`
- `skipped_check_policy`
- `authority_boundary`
- `codex_non_goals`
- `closeout_requirements`
- `next_phase_notes`

`observed_context` comes only from `GuideBrief.observed` and source refs.
`inferred_context` keeps caveats and confidence. `suggested_context` is
advisory and must not be auto-executed. `needs_user_judgment_context` must be
surfaced, not decided. Handoff candidates remain preview-only.

## 5. Codex Task-Start Consumption Rules

When a GuideBrief is provided, Codex should start by preserving or restating:

- Observed context from source-backed observations.
- Inferred context with confidence, caveats, and non-authority notes.
- Suggested context as non-binding implementation considerations only when the
  active operator prompt explicitly scopes the work.
- Needs user judgment items as unresolved questions.
- Source refs and expected files/checks.
- Skipped checks and concrete skipped-check policy.
- Authority boundary and Codex non-goals.
- Handoff candidates as preview-only.

If a GuideBrief suggestion implies write or execution authority outside the
active prompt, Codex must mark it blocked or requiring user judgment. Codex
must not treat suggestions as commands, must not decide user judgment items,
must not apply deltas, must not mutate memory/state/work, and must not claim
proof-only closeout unless proof/evidence writes are separately scoped and
actually allowed.

## 6. Source Refs, Expected Checks, And Skipped Checks

Codex should preserve source refs in PR bodies and final reports when they are
relevant to the implemented slice. It should keep refs as refs; it must not
invent source content, proof/evidence IDs, runtime observations, or live
checks.

Expected checks come from the active user task, repo instructions, and any
GuideBrief-derived packet fields. Codex must run available checks honestly and
report exact command results. If a check cannot run, skipped checks must include
concrete reasons. Hidden skipped checks are not acceptable.

## 7. Authority Boundary

This alignment does not grant authority. Codex may perform repo edits and
normal PR workflow only when the active user prompt and repo instructions
separately allow that work.

GuideBrief does not grant:

- source-of-truth state authority
- commit/reject authority
- DB writes
- proof/evidence writes
- memory mutation
- durable Perspective apply
- product-write authority
- scheduler/autonomy runner authority
- handoff execution
- Codex execution from Augnes
- GitHub actuation from Augnes
- provider/OpenAI calls
- branch/PR creation behavior from Augnes product code
- merge, publish, retry, replay, deploy, or external side effects

Codex final output must preserve validation results, skipped checks with
reasons, known risks, no-merge status, and next phase readiness.

## 8. Non-Goals

Phase 6E does not implement:

- runtime hooks
- API routes
- Web UI
- MCP/App tools
- Codex execution from Augnes
- GitHub actuation from Augnes
- provider/OpenAI calls
- Handoff Capsule runtime
- Codex Launch Card runtime
- branch/PR creation behavior from Augnes product code
- DB schema/migration
- DB writes
- proof/evidence writes
- memory mutation
- durable Perspective apply
- scheduler/autonomy runner
- handoff execution
- merge/publish/retry/replay/deploy behavior
- hidden autonomous behavior
- external side effects

## 9. Closeout Requirements

A Codex closeout that consumed GuideBrief should report:

- GuideBrief consumed: yes/no.
- Observed/inferred/suggested/judgment separation preserved: yes/no.
- Source refs preserved: yes/no.
- Authority boundary preserved: yes/no.
- Expected files and actual changed files.
- Expected checks and actual validation results.
- Skipped checks with concrete reasons.
- Proof/evidence write status or skipped reason.
- Known risks.
- Next phase readiness.
- No merge statement.

Codex must never claim background work, hidden execution, proof/evidence writes,
runtime state mutation, GitHub actuation, provider/OpenAI calls, handoff
execution, branch/PR creation from Augnes product code, or merge authority
unless a separate explicit user task and repo authority actually allowed and
verified that work.
