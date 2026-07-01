# GuideBrief Contract v0.1

## 1. Status and Scope

Status: Phase 6A GuideBrief / Cross-Surface Guide Core v0.1.

Scope: contract, type, pure helper, public-safe fixture, static smoke, package
script pointer, and latest-index pointer only.

Phase 6A adds no route work, no UI work, no MCP/App tool work, no Codex Guide
skill, no Handoff Capsule implementation, no Codex Launch Card, no DB schema or
migration, no DB write, no provider/OpenAI call, no GitHub actuation, no Codex
execution, no proof/evidence write, no memory mutation, no durable Perspective
state apply, no product-write behavior, no scheduler/autonomy runner, no merge,
publish, retry, replay, deploy, or external side effect.

GuideBrief is a read-only guide packet. It may observe, infer, suggest, and
identify `needs_user_judgment`. It may not act.

## 2. Purpose

GuideBrief is a portable read-only guide packet for Augnes Web, ChatGPT App,
Codex, future agent surfaces, and future handoff/capsule work.

It bridges existing read models without becoming a new source of truth:

- `CurrentWorkingPerspective`
- `AugnesDeltaProjectionReadModel`
- lightweight Agent Workplane context
- Human Surface and Perspective Timeline rendering expectations
- Perspective Capsule / Handoff Capsule refs

GuideBrief lets downstream surfaces render a compact guide while preserving
source refs, staleness, gaps, review pressure, handoff candidates, and authority
boundaries. It does not create any action surface.

## 3. Top-Level Shape

`GuideBrief` includes:

- `runtime: "augnes"`
- `guide_version: "guide_brief.v0.1"`
- `scope`
- `as_of`
- `source_surfaces`
- `observed`
- `inferred`
- `suggested`
- `needs_user_judgment`
- `current_perspective_summary`
- `delta_summary`
- `workplane_summary`
- `review_queue_summary`
- `handoff_candidates`
- `staleness_warnings`
- `surface_rendering_notes`
- `source_refs`
- `gaps`
- `authority_boundary`
- `next_phase_notes`

The packet is deterministic for supplied inputs. The Phase 6A helper performs
no DB reads, DB writes, route calls, fetches, provider/OpenAI calls, GitHub
calls, Codex execution, proof/evidence writes, memory mutation, durable
Perspective apply, scheduler/autonomy runner behavior, or external side
effects.

In exact boundary terms: no DB reads, no DB writes, no provider/OpenAI calls,
no GitHub calls, no Codex execution, no proof/evidence writes, and no external
side effects.

## 4. Observed / Inferred / Suggested / Needs User Judgment

GuideBrief keeps four separate sections. This separation is mandatory.

### Observed

Observed items are source-backed facts from supplied read models or supplied
refs. Examples include current thesis, active goal count, review queue counts,
source/fallback status, delta projection gap count, and available Workplane
panels.

Observed items include:

- `observation_id`
- `kind`
- `summary`
- `source_refs`
- `related_delta_ids`
- `confidence: "observed"`
- `notes`

Observed items are read-model observations only. They are not source-of-truth
state.

### Inferred

Inferred items are derived interpretations. They are not source facts.

Inferred items include:

- `inference_id`
- `summary`
- `basis_observation_ids`
- `source_refs`
- `confidence: "low" | "medium" | "high"`
- `caveats`
- `non_authority_notes`

Inferred items must preserve caveats and must not be promoted into accepted
project facts, evidence, approval, or readiness.

### Suggested

Suggested items are candidate next actions or navigation suggestions only. They
are not commands and do not execute.

Suggested items include:

- `suggestion_id`
- `title`
- `summary`
- `suggested_surface`
- `suggested_actor`
- `priority`
- `required_checks`
- `blocked_by`
- `source_refs`
- `related_delta_ids`
- `authority_boundary_summary`

Allowed suggested surfaces are:

- `human_home`
- `perspective_timeline`
- `agent_workplane`
- `chatgpt_app`
- `codex_handoff`
- `future_guide_panel`
- `future_autonomy_contract`

Suggestions must not be treated as user decisions, route calls, UI actions,
MCP/App tools, Codex launches, handoff sends, GitHub calls, provider calls, or
write behavior.

### Needs User Judgment

`needs_user_judgment` items are unresolved decisions requiring a user,
operator, or PM choice. GuideBrief must not answer them on behalf of the user.

Judgment items include:

- `judgment_id`
- `question`
- `why_it_matters`
- `options`
- `source_refs`
- `related_delta_ids`
- `urgency`
- `blocked_until_decided`

## 5. Source Mapping

GuideBrief maps supplied `CurrentWorkingPerspective` fields into:

- `current_perspective_summary`
- observed current thesis and active goal counts
- open questions and user judgment prompts
- active risks and research pressure
- staleness warnings
- source refs for perspective snapshot, diagnostics, delta ids, and batch ids

GuideBrief maps supplied `AugnesDeltaProjectionReadModel` fields into:

- `delta_summary`
- observed delta gap counts
- review pressure
- important delta refs
- handoff refs
- evidence and artifact pointer refs
- projection gap warnings

GuideBrief maps supplied lightweight Agent Workplane context into:

- `workplane_summary`
- observed available panels
- source/fallback status
- bounded trace diagnostics notes
- Workplane authority boundary notes

GuideBrief maps Human Surface and Perspective Timeline context into rendering
notes only in Phase 6A. It does not add or change UI.

Minimum `source_refs` preserve:

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

Minimum docs refs:

- `docs/AUGNES_CURRENT_WORKING_PERSPECTIVE_V0_1.md`
- `docs/AUGNES_DELTA_PROJECTION_READ_MODEL_V0_1.md`
- `docs/AGENT_WORKPLANE_V0_1.md`
- `docs/HUMAN_SURFACE_V0_1.md`
- `docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md`

## 6. Surface Rendering Notes

GuideBrief rendering notes are advisory read-only notes for consumers:

- Human Surface: compact summary and user judgment prompts.
- Perspective Timeline: preserve delta chronology and selected-delta context.
- Agent Workplane: show trace/diagnostic refs while keeping raw logs bounded or
  collapsed.
- ChatGPT App: keep Observed, Inferred, Suggested, and Needs user judgment
  separated.
- Codex: preserve repo/task boundaries, expected files/checks, skipped checks,
  and authority boundary.
- Future agent surface: render GuideBrief as read-only context unless
  separately scoped.

Rendering notes do not implement those surfaces. They do not add routes,
components, MCP/App tools, Codex skills, or future agent behavior.

## 7. Handoff Candidates

Handoff candidates are preview-only. They may be derived from delta projection
handoff refs, Current Working Perspective next candidates, and supplied
handoff refs.

Handoff candidates include:

- `handoff_candidate_id`
- `target_surface`
- `title`
- `summary`
- `source_refs`
- `related_delta_ids`
- `required_context`
- `blocked_by`
- `authority_boundary`
- `status: "preview_only" | "needs_review" | "blocked"`

Allowed target surfaces are:

- `chatgpt_review`
- `codex_handoff`
- `documentation_handoff`
- `research_handoff`
- `agent_workplane_preview`
- `future_agent_handoff`

Handoff candidates do not send handoffs, execute Codex, create branches, open
PRs, call GitHub, call providers, write proof/evidence, persist records, or
launch future agents.

## 8. Authority Boundary

Every GuideBrief must include `authority_boundary`.

Default authority fields all deny writes, execution, and external calls:

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
- `can_launch_autonomy: false`
- `can_create_mcp_tool: false`
- `can_create_ui_action: false`

Authority notes must state:

- GuideBrief is read-only.
- Observed items are read-model observations only.
- Inferred items are derived interpretations only.
- Suggested items are candidate next actions only.
- Needs user judgment items must not be decided by the guide.
- Handoff candidates are preview-only.
- Codex and ChatGPT surfaces require separate scoped implementation.

## 9. Phase Boundaries

Phase 6A scope is contract/type/helper/fixture/smoke only.

Deferred work:

- Phase 6B GuideBrief GET-only read route is deferred.
- Phase 6C Web Guide UI is deferred.
- Phase 6D ChatGPT App/MCP Guide tool is deferred.
- Phase 6E Codex Guide alignment is deferred.
- Phase 7 Handoff Capsule / Codex Launch Card may consume GuideBrief only
  after separate scoped authority paths are defined and approved.

Phase 6A does not start Phase 6B, 6C, 6D, 6E, or Phase 7.

## 10. Validation and Smoke Plan

`npm run smoke:guide-brief-v0-1` checks:

- required Phase 6A files exist
- package script pointer exists
- latest index pointer exists
- required contract and boundary wording exists
- type exports exist and remain type-only
- helper exports exist and remain side-effect-free
- fixture parses and preserves Observed/Inferred/Suggested/Needs user judgment
  separation
- surface rendering notes include Human Surface, Perspective Timeline, Agent
  Workplane, ChatGPT App, Codex, and future agent surface
- fixture minimum counts are present
- handoff candidates are preview-only and have no send/execute authority
- all authority boundary booleans deny writes, execution, external calls, and
  future action surfaces
- no UI files, API route files, MCP/App files, DB migrations, provider/OpenAI
  or GitHub runtime files, proof/evidence write files, or autonomy runner files
  are changed
- changed-file boundary remains focused on Phase 6A files plus exact
  historical smoke allowlist compatibility edits

Browser validation is not required for Phase 6A because Phase 6A adds no UI
changes.
