# ChatGPT App/MCP Read-Only Surface Boundary v0.1

## Status and scope

Status: boundary note plus first implemented read-only ChatGPT App/MCP contact
surface.

Scope for the first implemented contact surface is:

- `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md`
- `apps/augnes_apps/src/server.ts`
- `apps/augnes_apps/src/adapters/state-runtime-http.ts`
- `apps/augnes_apps/src/lib/state-runtime-types.ts`
- `apps/augnes_apps/public/console-widget.html`
- `apps/augnes_apps/docs/12_WORK_CONTRACT_CARD_RUNBOOK.md`
- `scripts/smoke-chatgpt-constellation-preview-surface.mjs`
- `package.json`

This note is repo-local, non-SSOT, read-only, and non-authoritative. The first
implementation adds exactly one read-only MCP/App tool,
`augnes_get_project_constellation_preview`, plus a widget panel that renders
the existing local Project Constellation preview. It does not add write tools,
new API routes, DB schema/migrations, graph DB, persistence, proof/evidence
writes, AG Resume behavior, Codex SDK execution/provider behavior,
GitHub/OpenAI/provider calls, branch or PR creation controls, or
merge/publish/approval/retry/replay/deploy authority.

## Purpose

The purpose is to expose the smallest useful ChatGPT App/MCP surface for
Augnes Project Constellation while preserving read-only decision support.
The v0.1 surface exposes Project Constellation, evidence pointers, unresolved
tensions, advisory next action candidates, and copyable handoff seed material.
Perspective Capsule and broader boundary / next review remain future work.

The surface is not an execution surface. It is a way for a human to inspect
bounded Augnes context inside ChatGPT without allowing ChatGPT, MCP, or Augnes
to mutate state, create records, execute Codex, or publish outcomes.

## Surface model

A future surface may present a bounded read-only packet derived from existing
Augnes materials. It may show:

- Whole Perspective
- Project Constellation
- nodes
- edges
- clusters
- evidence pointers
- unresolved tensions
- next action candidates
- Perspective Capsule / Handoff Capsule preview
- copyable handoff text

The surface model is display-only. It must not write Augnes state, create
runtime nodes, persist snapshots, update readiness, route actions, or claim
source-of-truth status.

It must not create proof/evidence/readiness records, must not execute Codex,
must not create branches or PRs, and must not approve, publish, merge, retry,
replay, or deploy.

## User-facing read-only capabilities

A future ChatGPT App/MCP surface may help a user:

- inspect a Whole Perspective summary
- compare Project Constellation nodes, edges, and clusters
- read evidence pointers without turning them into proof/evidence/readiness
  records
- review unresolved tensions and next action candidates
- inspect boundary / next review material
- select or manually copy handoff text
- understand authority boundaries before asking a separate tool or workflow to
  do work

These capabilities are user-facing decision support only. They do not grant
write authority, execution authority, approval authority, or publishing
authority.

## Project Constellation rendering expectations

Project Constellation rendering should remain symbolic, practical, and
read-only. It may show nodes, edges, clusters, cluster thesis, evidence
pointers, unresolved tensions, next action candidates, and boundary notes.

It must not add a graph DB, persistence, graph layout engine, runtime node
creation, save/rollback controls, API routes, MCP/App write tools, or Project
Constellation runtime behavior.

## Perspective Capsule rendering expectations

Perspective Capsule / Handoff Capsule rendering should preserve source,
target surface, thesis, selected nodes, selected edges, evidence pointers,
unresolved tensions, boundaries, forbidden actions, required checks, skipped
check policy, browser/computer-use expectation, proof-only closeout status or
skipped reason, PR body requirements, final report requirements, assumptions,
questions requiring user/PM judgment, and next suggested goal.

The capsule remains conceptual and non-authoritative. Rendering a capsule does
not execute a handoff packet, launch Codex, create a PR, or record proof or
evidence.

## Evidence pointers and unresolved tensions

Evidence pointers remain pointer-only. A future surface may display them,
group them, or quote their labels, but it must not create
proof/evidence/readiness records or mark evidence as accepted.

Unresolved tensions should remain visible. The surface should preserve tension
language, boundary notes, competing interpretations, missing checks, and known
risks so a user can decide what needs review next.

## Boundary / Next review

Boundary / Next review should summarize what is in scope, what is out of
scope, what checks are required, what checks are skipped with concrete reasons,
and what next action candidates remain available.

This review must not approve, publish, merge, retry, replay, deploy, create
branches, create PRs, record proof, record evidence, or execute Codex. It may
only help the user decide what separately scoped work to request.

## Copyable handoff expectations

Copyable handoff material should be manually selectable text. It may include
repo, base branch, working branch suggestion, expected PR title, task goal,
expected changed files, forbidden changed files, hard constraints, required
checks, skipped check policy, browser/computer-use expectation, proof-only
closeout status or skipped reason, PR body requirements, final report
requirements, blockers/risks, assumptions, questions requiring user/PM
judgment, and next suggested goal.

The handoff text must remain manual and read-only. This planning note does not
add copy buttons, clipboard API calls, execute buttons, launch Codex buttons,
create/open PR controls, proof/evidence recording controls, or publish/merge
controls.

## MCP/App tool scope and non-goals

The implemented v0.1 tool is read-only and widget-backed:

```text
augnes_get_project_constellation_preview
```

It reads the existing local route through the bridge adapter:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
x-augnes-local-readonly: constellation-preview-v0.1
```

This v0.1 contact surface does not implement:

- MCP write tool
- mutation tool
- new runtime route
- new API route
- DB query or schema
- graph DB
- persistence
- proof/evidence/readiness records
- Codex execution
- GitHub/OpenAI/provider calls
- branch or PR creation controls
- merge/publish/approval/retry/replay/deploy controls

Future additional MCP/App tools need separate approved scope,
implementation review, auth/security review, browser/computer-use validation,
and authority matrix updates before any broader surface exists.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` records
the read-only constellation preview route local-only consumer scope decision.
ChatGPT App/MCP consumers were deferred by that decision until separately
scoped. This v0.1 surface is the separately scoped read-only App/MCP contact
surface for the existing route.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` records a
Cockpit local-only route preview planning packet. The Cockpit planning packet
itself did not connect ChatGPT App/MCP.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md` records the
Cockpit local-only route preview implementation. The Cockpit preview remains
local-only; this App/MCP contact surface is a separate read-only consumer path.

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` records the
local Cockpit closeout. The closeout did not add App/MCP authority; the v0.1
tool here adds only a read-only consumer path.

## GuideBrief read-only tool

Phase 6D adds one additional read-only App/MCP tool:

```text
augnes_get_guide_brief
```

`augnes_get_guide_brief` is read-only and local-route backed. It consumes the
existing Phase 6B GuideBrief route through the state-runtime HTTP adapter:

```text
GET /api/augnes/read/guide-brief?scope=project:augnes
x-augnes-local-readonly: guide-brief-v0.1
```

The tool returns GuideBrief structured content and a compact summary for
ChatGPT. It preserves Observed/Inferred/Suggested/Needs user judgment
separation, states that suggestions are not actions, and states that
needs_user_judgment is not decided by the tool.

The tool does not expose a write surface. It does not add Codex execution,
GitHub/OpenAI/provider calls, proof/evidence writes, state mutation, memory
mutation, DB writes, branch or PR creation, handoff execution, approval,
publish, retry, replay, deploy, or external side effects.

## Authority boundaries

Authority boundaries:

- one read-only ChatGPT App/MCP tool only
- one widget panel only
- no write tool
- no new API route
- no DB schema or migration
- no graph DB
- no persistence
- no proof/evidence write
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no GitHub/OpenAI/provider calls
- no runtime write calls
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
- no proof/evidence/readiness record creation
- no Augnes state writes
- no source-of-truth claim

## Future implementation gates

Any future broader implementation requires separate gates for:

- additional read-only API routes
- additional ChatGPT App components
- additional MCP tools
- auth/security review
- browser/computer-use validation
- authority matrix update

future read-only API route planning is defined in
`docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`. That planning note does
not grant any broader route, tool, component, or runtime endpoint authority.

Additional gates may be required for data provenance, privacy, prompt-injection
handling, workspace authorization, rate limits, logging, and rollback of any
incorrect surface assumptions. This planning note does not satisfy those gates.

## Validation and smoke plan

Required validation for this contact surface:

- `npm run typecheck`
- `npm --prefix apps/augnes_apps run typecheck`
- `npm run smoke:chatgpt-constellation-preview-surface`
- `npm run smoke:chatgpt-work-contract-card`
- `npm run smoke:readonly-api-route-constellation-preview`
- `git diff --check`

`npm run smoke:chatgpt-constellation-preview-surface` is a deterministic
static read smoke. It checks the new package script pointer, callable tool,
read-only annotations, structured content field families, widget panel,
copyable handoff seed, existing Work Contract Card write-tool boundaries,
absence of GitHub/OpenAI/provider calls, and explicit fallback rendering.

Browser/computer-use or ChatGPT Developer Mode may be skipped when no local
MCP inspector, browser runtime, tunnel, or Developer Mode session is available.
Proof-only closeout may be
skipped when no runtime/work ID context exists and this surface performs no
proof/evidence writes.

## Non-goals

- no additional ChatGPT App tool implementation beyond
  `augnes_get_project_constellation_preview`
- no MCP write tool implementation
- no new API routes
- no DB schema/migrations
- no graph DB
- no persistence
- no proof/evidence writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no GitHub/OpenAI/provider calls
- no runtime write calls
- no write tools
- no proof/evidence/readiness records
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
