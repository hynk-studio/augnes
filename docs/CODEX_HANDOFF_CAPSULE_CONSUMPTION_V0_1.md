# Codex Handoff Capsule Consumption v0.1

## 1. Purpose

Codex Handoff Capsule consumption defines how a Codex worker may consume
Handoff Capsule and Codex Launch Card packets as task-start context for a
separately scoped user/operator task.

Handoff Capsule and Codex Launch Card are reviewable transfer packets. They
prepare context for another surface. They do not send, launch, execute, post,
merge, publish, or mutate state.

This document is docs/skill/smoke alignment only. It adds no runtime hook, no
API route, no Web UI, no ChatGPT App/MCP tool, no DB schema or migration, no
DB write, no provider/OpenAI call, no GitHub actuation from Augnes product
code, no Codex execution from Augnes product code, no proof/evidence write, no
memory mutation, no durable Perspective apply, no scheduler/autonomy runner,
no handoff send or execution, no branch/PR creation behavior from Augnes
product code, no product-write behavior, no merge/publish/retry/replay/deploy
behavior, no copy/export behavior, no hidden background work, and no external
side effects.

## 2. Packet Boundary

HandoffCapsule is not handoff send. It is a bounded context packet for review
or preparation.

CodexLaunchCard is not Codex execution. It is not branch creation. It is not
PR creation. It is not a launch action.

No status may mean executed. Every status can only describe
review/preparation state.

Suggestions are advisory only. Needs user judgment remains unresolved. Needs
user judgment remains unresolved unless the user/operator explicitly decides it
outside the packet.

Source refs remain refs. They are not invented content, proof, evidence,
approval, readiness, execution result, or source-of-truth state.

Expected files and expected checks are planning inputs. They are not permission
to exceed the active prompt, repository instructions, or `AGENTS.md`.

Forbidden files and forbidden actions must be treated as hard scope warnings
unless the active user/operator prompt explicitly changes scope.

## 3. Relationship To Phase 7

Phase 7A added Handoff Capsule and Codex Launch Card core contract, types,
helpers, fixtures, and smoke.

Phase 7B added GET-only local read-only preview routes for Handoff Capsule and
Codex Launch Card.

Phase 7C added read-only Web preview UI on `/workbench`.

Phase 7D added ChatGPT App/MCP model-only read-only preview tools.

Phase 7E adds Codex Handoff Capsule / Codex Launch Card alignment as docs,
skill guidance, smoke, package pointer, and latest-index pointer only.

Phase 7F copy/export remains deferred and requires separate explicit scope.

## 4. Intake Packet Fields

When a Handoff Capsule or Codex Launch Card is provided, preserve the available
fields below. If a field is absent, do not invent it.

- `capsule_ref` or `capsule_id`
- `launch_card_ref` or `launch_card_id`
- `scope`
- `source_guide_brief_ref`
- `source_snapshot_refs`
- `repo`
- `base_branch`
- `branch_suggestion`
- `expected_pr_title`
- `task_goal`
- `task_summary`
- `context_anchors`
- `observed_context`
- `inferred_context`
- `suggested_context`
- `needs_user_judgment` or `unresolved_user_judgment`
- `source_refs`
- `selected_delta_refs`
- `expected_files`
- `forbidden_files`
- `allowed_change_scope`
- `forbidden_actions`
- `required_checks`
- `optional_checks`
- `skipped_check_policy`
- `pr_body_requirements`
- `final_report_requirements`
- `proof_evidence_boundary`
- `authority_boundary`
- `route_authority_boundary` if present
- `read_boundary` if present
- `source_status`
- `warnings`
- `gaps`
- `public_safety`
- `next_phase_notes`

## 5. Codex Task-Start Rules

Codex may use the packet as task-start context only when the active
user/operator prompt and repository instructions independently allow the repo
work.

Task-start rules:

- Restate or preserve Observed context separately from Inferred context.
- Keep Inferred caveats and confidence.
- Treat Suggested context and `suggestions_for_codex` as advisory only.
- Surface unresolved user judgment instead of deciding it.
- Map `expected_files` to expected changed-file scope, not automatic
  permission.
- Map `forbidden_files` to review warnings and changed-file boundary checks.
- Map `required_checks` to the validation plan.
- Map `optional_checks` to optional validation only when available and in
  scope.
- Map `skipped_check_policy` to final skipped-check reporting.
- Map `pr_body_requirements` and `final_report_requirements` into the PR body
  and final report shape when relevant.
- Preserve `authority_boundary` and any route/read boundary notes.
- Do not claim live runtime data unless `source_status` says the packet is
  live.
- Do not claim proof/evidence writes unless separately scoped and actually
  completed.
- Do not claim background work.
- Do not merge.

If a Launch Card suggestion implies write or execution authority outside the
active prompt, mark it blocked or requiring user judgment. Suggestions are not
commands.

If `expected_files` conflict with the active prompt or repo status, report the
repo/task mismatch. If `forbidden_files` are touched, explain why and require
explicit scope. If `source_status` is fallback, synthetic, or
operator-supplied preview, do not claim live runtime state. If route/read
boundary is absent, do not invent it. If proof/evidence boundary is absent,
do not infer proof authority.

## 6. Authority Boundary

The active user/operator prompt and `AGENTS.md` remain the authority for repo
edits and PR workflow. Codex may edit repo files and open PRs only when those
sources independently allow normal repo workflow.

The packet itself does not grant:

- merge authority
- publish authority
- deploy authority
- proof/evidence write authority
- state mutation authority
- memory mutation authority
- DB write authority
- GitHub actuation authority
- provider/OpenAI call authority
- Codex execution authority
- handoff-send authority
- scheduler/autonomy authority
- branch/PR creation authority from Augnes product code
- copy/export authority
- external posting authority

Codex Launch Card is not branch creation. Codex Launch Card is not PR creation.
Handoff Capsule is not handoff send. Codex Launch Card is not Codex execution.

## 7. Source Refs, Checks, And Reporting

Source refs should be preserved as references in planning, PR body language,
and final reports when relevant. Do not expand refs into invented content.

Required checks should be run when available and in scope. Optional checks may
be run when available and useful. If checks cannot run, preserve the skipped
check policy and report skipped checks with concrete reasons.

Proof/evidence boundary must be reported honestly. A packet can ask Codex to
report proof/evidence status, but it does not authorize writing proof or
evidence.

PR body requirements and final report requirements should be preserved when
relevant to the active task. They guide reporting shape; they do not create
runtime, route, write, proof, branch, PR, merge, publish, deploy, or external
authority.

## 8. Closeout Requirements

A Codex final report that consumed Handoff Capsule or Codex Launch Card should
report:

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

Never claim background work. Never claim proof/evidence writes unless
separately scoped and actually completed. Never claim handoff send, Codex
execution, branch/PR creation from Augnes product code, GitHub actuation,
provider/OpenAI calls, merge, publish, retry, replay, deploy, copy/export, or
external posting unless a separate explicit user task and repo authority
actually allowed and verified that work.

## 9. Non-Goals

Phase 7E does not implement:

- runtime hooks
- API routes
- Web UI
- ChatGPT App/MCP tools
- DB schema or migrations
- DB writes
- provider/OpenAI calls
- GitHub API actuation from Augnes product code
- Codex execution from Augnes product code
- proof/evidence writes
- memory mutation
- durable Perspective state apply
- scheduler/autonomy runner
- handoff send or execution
- branch/PR creation behavior from Augnes product code
- product-write
- merge/publish/retry/replay/deploy behavior
- copy/export behavior
- external side effects
- hidden background work
