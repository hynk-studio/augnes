# GuideBrief Contract v0.1

## 1. Status and Scope

Status: Phase 6C GuideBrief / Cross-Surface Guide Core, GET-only read route,
and Web Guide read-only panel skeleton v0.1.

Scope: Phase 6A contract, type, pure helper, public-safe fixture, static smoke,
package script pointer, and latest-index pointer plus Phase 6B GET-only local
read-only route composition plus Phase 6C read-only Web Guide panel rendering.

Phase 6A adds no route work, no UI work, no MCP/App tool work, no Codex Guide
skill, no Handoff Capsule implementation, no Codex Launch Card, no DB schema or
migration, no DB write, no provider/OpenAI call, no GitHub actuation, no Codex
execution, no proof/evidence write, no memory mutation, no durable Perspective
state apply, no product-write behavior, no scheduler/autonomy runner, no merge,
publish, retry, replay, deploy, or external side effect.

Phase 6B adds only a GET-only local read-only route and route source
composition helper. It adds no UI work, no MCP/App tool work, no Codex Guide
skill, no Handoff Capsule implementation, no Codex Launch Card, no DB schema or
migration, no DB write, no provider/OpenAI call, no GitHub actuation, no Codex
execution, no proof/evidence write, no memory mutation, no durable Perspective
state apply, no product-write behavior, no scheduler/autonomy runner, no
handoff execution, no merge, publish, retry, replay, deploy, or external side
effect.

Phase 6C adds only read-only Web Guide display components and compact entries
on existing web surfaces. It adds no chat composer, chat execution, MCP/App
tool, Codex Guide skill, Handoff Capsule implementation, Codex Launch Card, DB
schema or migration, DB write, provider/OpenAI call, GitHub actuation, Codex
execution, proof/evidence write, memory mutation, durable Perspective state
apply, product-write behavior, scheduler/autonomy runner, handoff execution,
UI action authority, merge, publish, retry, replay, deploy, or external side
effect.

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

## 3.1 Phase 6B GET-Only Read Route

Phase 6B exposes GuideBrief through a local read-only route:

```text
GET /api/augnes/read/guide-brief?scope=project:augnes
```

The route requires the exact local read-only marker:

```text
x-augnes-local-readonly: guide-brief-v0.1
```

Route behavior:

- exports `GET` only and exports no `POST`, `PUT`, `PATCH`, `DELETE`, or other
  mutating handler
- requires exact `scope=project:augnes`
- requires exact `x-augnes-local-readonly: guide-brief-v0.1`
- fails closed on missing scope, invalid scope, missing marker, invalid marker,
  malformed request, or non-local access
- returns JSON with `cache-control: no-store`
- returns the local read-only marker response header
- composes GuideBrief JSON through `buildGuideBrief(input)` rather than
  duplicating GuideBrief construction in the route
- preserves the GuideBrief `authority_boundary` object with all write,
  execution, external-call, handoff-send, MCP/App, UI-action, and autonomy
  booleans set to `false`

Source composition is owned by `lib/guide/guide-brief-source.ts`. It uses
existing read-only runtime source helpers for:

- `CurrentWorkingPerspective`
- `AugnesDeltaProjectionReadModel`

The route source helper supplies lightweight Agent Workplane context for
`/workbench`, route refs for `/`, `/perspective`, and `/workbench`, docs refs,
and next-phase notes. It does not call route-to-route `fetch`, does not add a
new DB reader, does not create source records, and does not inspect UI runtime
or DOM state.

Phase 6B route and source composition add no write or external execution
behavior: no DB schema/migration, DB write, provider/OpenAI call, GitHub
actuation, Codex execution, proof/evidence write, memory mutation, durable
Perspective state apply, product-write, scheduler/autonomy runner, MCP/App
tool, UI action, handoff execution, merge, publish, retry, replay, deploy, or
external side effect.

## 3.2 Phase 6C Web Guide Read-Only Panel Skeleton

Phase 6C renders GuideBrief on existing web surfaces through shared display
components:

- `components/guide/guide-brief-panel.tsx`
- `components/guide/guide-brief-section.tsx`
- `components/guide/guide-brief-summary-card.tsx`
- `components/guide/guide-brief-boundary-card.tsx`
- `components/guide/guide-brief-mini-panel.tsx`

The Web Guide read path is `lib/guide/read-guide-brief-for-web.ts`, a thin
read-only wrapper over the Phase 6B route source helper. It does not call the
local API route with browser/client `fetch`, add polling, add server actions,
add route handlers, query DOM state, or create a new DB reader.

Entry points:

- `/`: compact Human Surface panel near the Current Working Perspective summary
  with Observed, Suggested, Needs user judgment, and staleness guidance.
- `/perspective`: compact guide rail inside the Perspective detail surface with
  delta/timeline relevance, staleness warnings, and judgment prompts.
- `/workbench`: compact Agent Workplane panel with Workplane guidance, handoff
  candidates as preview-only, bounded trace/staleness guidance, and authority
  boundary.

The Web Guide UI preserves the required separation:

- Observed remains source-backed read-model observations.
- Inferred remains derived interpretation only.
- Suggested remains candidate next actions or navigation suggestions only.
- Needs user judgment remains unresolved user/operator/PM decisions.

The Web Guide panel is read-only display only. It does not include a chat
composer, textarea, prompt input, action form, send button, apply button,
approve button, reject button, launch Codex button, create PR button, record
proof button, create evidence button, persist button, commit button, merge
button, deploy button, retry/replay button, publish button, copy handoff
button, or any control that implies action.

Phase 6C adds no ChatGPT App/MCP Guide tool, no Codex Guide skill, no Handoff
Capsule, no Codex Launch Card, no chat execution, no write route, no DB
schema/migration, no DB write, no provider/OpenAI call, no GitHub actuation,
no Codex execution, no proof/evidence write, no memory mutation, no durable
Perspective state apply, no scheduler/autonomy runner, no handoff execution,
no product-write, no merge/publish/retry/replay/deploy behavior, and no
external side effect.

Phase 6D ChatGPT App/MCP Guide tool, Phase 6E Codex Guide alignment, and Phase
7 Handoff Capsule / Codex Launch Card remain deferred.

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
notes. Phase 6C consumes those notes for read-only Web Guide display only and
does not add action controls or write behavior.

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

Rendering notes are not authority. Phase 6C implements only Web display
components for existing Augnes surfaces. Rendering notes still do not add
routes, MCP/App tools, Codex skills, handoff execution, future agent behavior,
or write controls.

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

Phase 6A historical deferred marker: Phase 6B GuideBrief GET-only read route is
deferred until a separate scoped route prompt.

Phase 6B scope is the GET-only local read-only route and route source
composition helper only. It does not add UI, MCP/App tools, Codex Guide skill,
Handoff Capsule, Codex Launch Card, write behavior, execution behavior, hidden
authority, or future handoff/autonomy behavior.

Phase 6C scope is the read-only Web Guide panel skeleton and existing-surface
entries only. It does not start Phase 6D, Phase 6E, or Phase 7.

Historical deferred markers:

- Phase 6C Web Guide UI is deferred until separate scoped UI prompt.
- Phase 6D ChatGPT App/MCP Guide tool is deferred.
- Phase 6E Codex Guide alignment is deferred.
- Phase 7 Handoff Capsule / Codex Launch Card may consume GuideBrief only
  after separate scoped authority paths are defined and approved.

Current deferred work after Phase 6C:

- Phase 6D ChatGPT App/MCP Guide tool remains deferred.
- Phase 6E Codex Guide alignment remains deferred.
- Phase 7 Handoff Capsule / Codex Launch Card remains deferred.

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

`npm run smoke:guide-brief-route-v0-1` checks the Phase 6B route boundary:

- required route, source helper, docs, index, package, and smoke files exist
- package script pointer exists
- the route exports `GET` and exports no mutating handlers
- the route requires exact `scope=project:augnes`
- the route requires `x-augnes-local-readonly: guide-brief-v0.1`
- the route returns `cache-control: no-store`
- the route returns GuideBrief JSON through the route source helper and
  `buildGuideBrief`
- missing or invalid scope and marker paths fail closed
- the source helper uses existing read-only runtime source helpers and does not
  call route-to-route `fetch`
- the route and source helper do not call provider/OpenAI/GitHub/Codex, create
  proof/evidence, mutate memory/Perspective/work/state, or write DB state
- no UI files, MCP/App tool files, DB migrations, provider/OpenAI/GitHub
  runtime files, proof/evidence write files, or autonomy runner files are
  changed

Browser validation is not required for Phase 6B because Phase 6B adds no UI
changes.

`npm run smoke:web-guide-panel-v0-1` checks the Phase 6C Web Guide panel
boundary:

- shared GuideBrief panel components exist
- the panel renders visible GuideBrief, Observed, Inferred, Suggested, Needs
  user judgment, Staleness warnings, Authority boundary, and Source refs labels
- visible boundary copy includes read-only guide packet, Suggestions are not
  actions, The guide does not decide user judgment items, Handoff candidates
  are preview-only, and No hidden execution authority
- the panel consumes the GuideBrief type and the web read wrapper consumes the
  Phase 6B route source helper
- `/`, `/perspective`, and `/workbench` render compact GuideBrief entries
- no chat composer, textarea, action form, positive write/execute controls,
  route handlers, MCP/App tool files, DB migrations, provider/OpenAI/GitHub
  runtime calls, Codex execution code, proof/evidence write code,
  scheduler/autonomy runner, handoff execution, or focused changed-file
  boundary drift is added

Browser validation is required for Phase 6C because Phase 6C adds UI display
components. The browser check should use a temp DB and inspect `/`,
`/perspective`, and `/workbench` at desktop and 390px mobile widths.
