# ChatGPT App/MCP Read-Only Surface Boundary v0.1

## Status and scope

Status: planning note for a future read-only ChatGPT App/MCP Augnes surface.

Scope is docs/smoke/package-pointer only:

- `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `scripts/smoke-chatgpt-app-mcp-readonly-surface-boundary.mjs`
- `package.json`

This note is repo-local, non-SSOT, read-only, non-authoritative, and planning
only. It does not add ChatGPT App tools, MCP tools, runtime behavior, UI code,
API routes, DB schema/migrations, graph DB, persistence, proof/evidence writes,
AG Resume behavior, Codex SDK execution/provider behavior, GitHub/OpenAI/Augnes
runtime calls, network calls, branch creation authority, PR creation authority
by itself, or merge/publish/approval/retry/replay/deploy authority.

## Purpose

The purpose is to describe how a future ChatGPT App/MCP surface could expose
Augnes Project Constellation, Perspective Capsule, evidence pointers, unresolved
tensions, boundary / next review, and copyable handoff material as read-only
user-facing decision support.

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

## MCP/App tool non-goals

This planning note does not implement:

- ChatGPT App tool implementation
- MCP tool implementation
- MCP read-only tool
- MCP write tool
- app component
- widget component
- runtime route
- API route
- write tool
- mutation tool
- external call
- GitHub/OpenAI/Augnes runtime call
- network call

Future MCP/App tools need separate approved scope, implementation review,
auth/security review, browser/computer-use validation, and authority matrix
updates before any tool surface exists.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` records
the read-only constellation preview route local-only consumer scope decision.
ChatGPT App/MCP consumers remain deferred unless separately scoped; this
boundary does not connect ChatGPT App or MCP to that route.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` records a
Cockpit local-only route preview planning packet. ChatGPT App/MCP remain
deferred while the Cockpit local-only preview is only planning.

## Authority boundaries

Authority boundaries:

- no ChatGPT App tool implementation
- no MCP tool implementation
- no runtime behavior
- no UI code
- no API route
- no DB schema or migration
- no graph DB
- no persistence
- no proof/evidence write
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no GitHub/OpenAI/Augnes runtime calls
- no network calls
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
- no proof/evidence/readiness record creation
- no Augnes state writes
- no source-of-truth claim

## Future implementation gates

Any future implementation requires separate gates for:

- read-only API route
- ChatGPT App component
- MCP read-only tool
- auth/security review
- browser/computer-use validation
- authority matrix update

future read-only API route planning is defined in
`docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`. No route, tool,
component, or runtime endpoint is implemented by that planning note or this
surface boundary.

Additional gates may be required for data provenance, privacy, prompt-injection
handling, workspace authorization, rate limits, logging, and rollback of any
incorrect surface assumptions. This planning note does not satisfy those gates.

## Validation and smoke plan

Required validation for this planning note:

- `npm run typecheck`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`
- `git diff --check`
- `git diff --cached --check`

`npm run smoke:chatgpt-app-mcp-readonly-surface-boundary` is a deterministic
static read smoke. It checks this planning note, the index pointer, the package
script pointer, required read-only surface terms, non-goals, authority boundary
phrases, and the changed-file boundary.

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.
Proof-only closeout may be
skipped when no runtime/work ID context exists and this PR performs no
proof/evidence writes.

## Non-goals

- no ChatGPT App tool implementation
- no MCP tool implementation
- no runtime behavior
- no UI code
- no API routes
- no DB schema/migrations
- no graph DB
- no persistence
- no proof/evidence writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no GitHub/OpenAI/Augnes runtime calls
- no network calls
- no write tools
- no proof/evidence/readiness records
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
