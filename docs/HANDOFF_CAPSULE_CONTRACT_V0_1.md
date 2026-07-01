# Handoff Capsule / Codex Launch Card Contract v0.1

## 1. Status and Scope

Status: Phase 7B Handoff Capsule / Codex Launch Card core and GET-only read
routes v0.1.

Scope: Phase 7A contract, type, pure helper, public-safe fixtures, static
smoke, package script pointer, and latest-index pointer plus Phase 7B GET-only
local read-only preview routes and thin source composition.

Handoff Capsule and Codex Launch Card are reviewable transfer packets. They
prepare context for another surface. They do not send, launch, execute, post,
merge, publish, or mutate state.

Phase 7A adds no UI changes, no API routes, no MCP/App tools, no DB schema or
migration, no DB writes, no provider/OpenAI calls, no GitHub API actuation from
Augnes product code, no Codex execution from Augnes product code, no
proof/evidence writes, no memory mutation, no durable Perspective state apply,
no product-write behavior, no scheduler/autonomy runner, no handoff send, no
branch/PR creation behavior from Augnes product code, no merge, no publish, no
retry, no replay, no deploy, and no external side effects.

Codex itself may still create a normal development branch and PR through the
ordinary repository workflow when an active operator prompt explicitly scopes
that work. Augnes product code does not gain branch, PR, GitHub, Codex,
provider, send, proof, evidence, state, memory, merge, publish, retry, replay,
or deploy authority from this contract.

## 2. Purpose

`HandoffCapsule` is a portable, bounded, read-only context packet for moving
Augnes perspective and work context to another surface.

`CodexLaunchCard` is a Codex-targeted, reviewable packet derived from a
`HandoffCapsule`. It is not Codex execution. It is not branch creation. It is
not PR creation. It is not a launch action.

HandoffCapsule is not handoff send. CodexLaunchCard is not Codex execution.
Suggestions are not commands. User/operator judgment remains unresolved unless
explicitly decided outside the packet.

## 3. GuideBrief Separation

Phase 7A preserves the GuideBrief separation exactly:

- Observed: source-backed observations only.
- Inferred: derived interpretation with confidence and caveats.
- Suggested: advisory next steps only.
- Needs user judgment: unresolved decisions surfaced, not decided.

Codex may implement only what the active operator/user prompt explicitly
scopes. GuideBrief suggestions and Launch Card suggestions are not commands by
themselves.

## 4. HandoffCapsule Shape

`HandoffCapsule` includes:

- `runtime: "augnes"`
- `capsule_version: "handoff_capsule.v0.1"`
- `scope`
- `capsule_id`
- `created_at`
- `source_guide_brief_ref`
- `source_snapshot_refs`
- `target_surface`
- `target_actor`
- `handoff_intent`
- `status`
- `title`
- `summary`
- `thesis`
- `observed_context`
- `inferred_context`
- `suggested_context`
- `needs_user_judgment`
- `source_refs`
- `selected_delta_refs`
- `evidence_refs`
- `artifact_refs`
- `diagnostic_refs`
- `constraints`
- `forbidden_actions`
- `expected_inputs`
- `expected_outputs`
- `validation_expectations`
- `staleness`
- `authority_boundary`
- `target_rendering`
- `gaps`
- `next_phase_notes`
- `public_safety`

Allowed target surfaces:

- `chatgpt_review`
- `codex_handoff`
- `documentation_handoff`
- `research_handoff`
- `agent_workplane_preview`
- `future_agent_handoff`

Allowed target actors:

- `user`
- `operator`
- `chatgpt`
- `codex`
- `future_agent`
- `documentation_agent`
- `research_agent`

Allowed handoff intents:

- `review`
- `implementation_preparation`
- `research_preparation`
- `documentation_preparation`
- `planning`
- `status_transfer`
- `next_session_resume`

## 5. CodexLaunchCard Shape

`CodexLaunchCard` includes:

- `runtime: "augnes"`
- `card_version: "codex_launch_card.v0.1"`
- `scope`
- `launch_card_id`
- `created_at`
- `source_capsule_id`
- `source_guide_brief_ref`
- `repo`
- `base_branch`
- `branch_suggestion`
- `expected_pr_title`
- `task_goal`
- `task_summary`
- `context_anchors`
- `observed_context`
- `inferred_context`
- `suggestions_for_codex`
- `unresolved_user_judgment`
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
- `source_refs`
- `staleness`
- `authority_boundary`
- `status`
- `next_phase_notes`
- `public_safety`

Allowed `status` values:

- `preview_only`
- `needs_review`
- `blocked`
- `ready_for_manual_copy`
- `ready_for_future_launch_review`

No status may mean "executed"; every status can only describe
review/preparation state.

## 5.1 Phase 7B GET-Only Read Routes

Phase 7B exposes Handoff Capsule and Codex Launch Card preview JSON through
GET-only local read-only routes:

```text
GET /api/augnes/read/handoff-capsule?scope=project:augnes&target=codex_handoff
x-augnes-local-readonly: handoff-capsule-v0.1
```

```text
GET /api/augnes/read/codex-launch-card?scope=project:augnes
x-augnes-local-readonly: codex-launch-card-v0.1
```

Route behavior:

- exports `GET` only and exports no `POST`, `PUT`, `PATCH`, `DELETE`, or other
  mutating handler
- uses `runtime = "nodejs"` and `dynamic = "force-dynamic"`
- returns JSON with `cache-control: no-store`
- returns the matching `x-augnes-local-readonly` marker response header
- requires exact `scope=project:augnes`
- Handoff Capsule route requires exact `target=codex_handoff`
- fails closed on missing scope, invalid scope, missing marker, invalid marker,
  and invalid target
- returns structured read errors with route authority boundary notes
- returns preview JSON only
- preserves Handoff Capsule and Codex Launch Card authority boundaries

Source composition is owned by `lib/handoff/handoff-capsule-source.ts`. The
source helper uses the existing GuideBrief local read-only source helper and
the Phase 7A `buildHandoffCapsule(input)` and `buildCodexLaunchCard(input)`
builders. It may combine runtime GuideBrief read-model data with shaped
operator/sample defaults for repo/task fields, but those defaults must be
disclosed as route-composed preview fields and must not claim live task
assignment, execution state, proof, evidence, or account artifacts.

Phase 7B adds no DB schema/migration, DB write, provider/OpenAI call, GitHub
actuation, Codex execution, proof/evidence write, memory mutation, durable
Perspective state apply, handoff send, branch/PR creation, scheduler/autonomy
runner, product-write, or external side effects.

Phase 7C Web preview UI is deferred. Phase 7D ChatGPT App/MCP tool is
deferred. Phase 7E Codex skill alignment is deferred.

## 6. Source Refs

The source refs model can represent:

- `guide_brief_ref`
- `current_working_perspective_ref`
- `delta_projection_ref`
- `workplane_ref`
- `perspective_snapshot_refs`
- `delta_ids`
- `batch_ids`
- `evidence_refs`
- `artifact_refs`
- `handoff_refs`
- `diagnostic_refs`
- `route_refs`
- `docs_refs`
- `repo_refs`

Required docs refs for fixtures and/or default builder inputs:

- `docs/GUIDEBRIEF_CONTRACT_V0_1.md`
- `docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`
- `docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md`
- `docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md`
- `docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`

Source refs are pointers only. They do not create proof, evidence, readiness,
approval, execution authority, source-of-truth state, or external side effects.

## 7. Authority Boundary

Every HandoffCapsule and CodexLaunchCard must include an authority boundary
where all execution, write, send, launch, and external authority booleans
default to false:

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
- `can_create_mcp_tool: false`
- `can_create_ui_action: false`
- `can_post_external_comment: false`

Authority boundary notes must include:

- Capsule is preview-only.
- Launch Card is reviewable preparation only.
- No execution authority.
- No GitHub actuation.
- No provider calls.
- No proof/evidence writes.
- No state/memory mutation.
- No handoff send.
- No background work.
- User/operator prompt is required before any future execution path.

The authority boundary denies all execution/write/external side effects.

## 8. Builders

Phase 7A exposes deterministic, input-driven builders:

- `buildHandoffCapsule(input)`
- `buildCodexLaunchCard(input)`
- `buildHandoffObservedContext(guideBrief, selections)`
- `buildHandoffInferredContext(guideBrief, selections)`
- `buildHandoffSuggestedContext(guideBrief, selections)`
- `buildHandoffJudgmentContext(guideBrief, selections)`
- `buildHandoffSourceRefs(guideBrief, selections)`
- `buildHandoffConstraints(input)`
- `buildCodexExpectedFiles(input)`
- `buildCodexForbiddenFiles(input)`
- `buildCodexRequiredChecks(input)`
- `buildCodexPrBodyRequirements(input)`
- `buildCodexFinalReportRequirements(input)`
- `buildHandoffCapsuleAuthorityBoundary()`
- `buildCodexLaunchCardAuthorityBoundary()`

Builder constraints:

- Deterministic.
- Input-driven.
- No DB reads in core builder.
- No DB writes.
- No fetch.
- No GitHub calls.
- No Codex calls.
- No provider/OpenAI calls.
- No route dependency.
- No UI dependency.

## 9. Public Safety

Public-safe fixtures must include a public safety block confirming:

- no private conversation
- no hidden reasoning
- no local private paths
- no secrets/tokens
- no raw provider output
- no raw retrieval output
- no real account artifacts

Fixtures are synthetic samples. They must not be presented as live runtime
state, hidden conversation content, proof, evidence, or account artifacts.

## 10. Validation

`npm run smoke:handoff-capsule-v0-1` checks:

- required files exist
- package script exists
- latest index pointer exists
- required boundary wording exists
- type exports expected names
- helper exports expected builders
- fixtures parse
- `HandoffCapsule` exists
- `CodexLaunchCard` exists
- Observed/Inferred/Suggested/Judgment separation is preserved
- CodexLaunchCard includes expected files, forbidden files, required checks,
  skipped-check policy, PR body requirements, and final report requirements
- Handoff Capsule and Codex Launch Card are preview-only / review-only
  preparation
- no execution/send/launch authority exists
- all authority boundary booleans deny writes, execution, external calls,
  send, launch, and posting
- helper does not mutate DB
- helper does not call provider/OpenAI/GitHub/Codex
- no UI files changed in Phase 7A
- no API route files changed in Phase 7A
- no MCP/App tool files changed in Phase 7A
- no DB migrations changed
- changed-file boundary is focused

Phase 7A browser validation is not required because this phase adds no UI.

## 11. Next Phase Readiness

Phase 8 Autonomy Contract can consume the card/capsule only as preview input
if:

- HandoffCapsule exists.
- CodexLaunchCard exists.
- builder, fixture, and smoke pass.
- source refs and authority boundary are explicit.
- launch card is preview-only.
- no execution, send, write, or external authority exists.

Any route, UI, ChatGPT App/MCP tool, Codex skill alignment, send behavior,
launch behavior, execution behavior, proof/evidence write, durable state apply,
or autonomy runner requires a separate explicit operator task prompt.
