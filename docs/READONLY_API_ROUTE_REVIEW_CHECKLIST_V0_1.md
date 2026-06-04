# Read-Only API Route Review Checklist v0.1

## Status and scope

Status: checklist-only planning boundary for future read-only Augnes API route
implementation that could support ChatGPT App/MCP read-only surfaces.

Scope is docs/smoke/package-pointer only:

- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`
- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `scripts/smoke-readonly-api-route-review-checklist.mjs`
- `package.json`

This checklist is repo-local, non-SSOT, read-only, non-authoritative, and
planning only. This is a checklist only. It does not implement any API route. It
does not add runtime behavior, UI code, ChatGPT App tool implementation, MCP
tool implementation, DB schema/migrations, graph DB, persistence, auth
implementation, external calls,
proof/evidence writes, AG Resume behavior, Codex SDK execution/provider
behavior, branch creation authority, PR creation authority by itself, or
merge/publish/approval/retry/replay/deploy authority.

## Purpose

The purpose is to define the auth/security/privacy/prompt-injection/provenance
review checklist that future read-only API route implementation PRs must satisfy
before any endpoint exists or merges.

No route is implemented by this checklist. No endpoint, route file, handler,
schema, server behavior, auth behavior, persistence, network call, or external
call exists as part of this checklist.

## Checklist usage

The checklist rule is: future route implementation must answer each checklist item before merge.
Answers belong in the implementation PR body, design note, review artifact, or
test evidence as appropriate.

Checklist usage requirements:

- identify the route path being proposed
- identify whether the route is GET/read-only only
- cover Prompt-injection review, Data provenance, Response minimization,
  Logging and telemetry, Browser/computer-use validation, and Authority matrix
  status
- answer every auth/session, privacy, prompt-injection, data provenance,
  response minimization, evidence pointer, capsule, Project Constellation,
  logging/telemetry, browser/computer-use, and authority matrix item
- report skipped checks with concrete reasons
- stop or request separate scope if any answer requires runtime write behavior,
  proof/evidence writes, Codex execution, mutation controls, or publish/merge
  authority

## Auth and session boundary

Future route implementation must answer:

- who can call the route
- what workspace/project scope is allowed
- whether user/session identity is required
- how unauthorized access fails closed
- how cross-workspace access is prevented
- how service/internal access, if any, is scoped and audited
- how auth/session errors are represented without leaking private information
- confirmation that there is no public unauthenticated endpoint

The default expectation is fail-closed auth/session handling. A read-only route
does not justify public unauthenticated access by itself.

## Privacy boundary

Future route implementation must answer:

- no secrets
- no credentials/auth/env
- no raw private user text unless explicitly scoped
- no hidden reasoning/chain-of-thought
- how the response excludes secrets
- how the response excludes credentials/auth/env
- how raw private user text is excluded unless explicitly scoped
- how hidden reasoning/chain-of-thought is excluded
- how raw DB rows are excluded
- how the response keeps a minimal response payload
- how scoped Augnes records are bounded to the requesting user/workspace/project
- how private references are redacted or summarized when needed

The route response must not expose secrets, credentials/auth/env, raw private
user text unless explicitly scoped, hidden reasoning/chain-of-thought, raw DB
rows, or excess payload fields.

## Prompt-injection boundary

Future route implementation must answer:

- how no tool instructions from untrusted records are executed
- how evidence/capsule text is treated as display data, not instructions
- how route-provided text avoids granting authority
- how prompt-injection review was performed for user-authored records
- how potentially adversarial text is labeled, escaped, summarized, or isolated
- how downstream ChatGPT App/MCP surfaces avoid interpreting returned content as
  tool instructions

Route-provided text does not create execution authority, write authority,
approval authority, publish authority, merge authority, deploy authority, or
proof/evidence write authority.

## Data provenance boundary

Future route implementation must answer:

- which source records are identified
- how derived state is separated from committed state
- how evidence pointers are labeled as pointers
- where confidence/limits are visible where applicable
- how stale or missing source records are represented
- how Project Constellation and Perspective Capsule material is traced back to
  bounded Augnes records or static fixtures

The route must distinguish source records, derived view data, pointer-only
evidence, and user-facing summaries.

## Response minimization boundary

Future route implementation must answer:

- only fields needed for the read-only surface
- no mutation URLs
- no write handles
- no approval/publish/merge controls
- no Codex SDK execution handles
- no provider credentials
- which fields are needed for the read-only surface
- why each returned field is necessary
- how the response excludes mutation URLs
- how the response excludes write handles
- how the response excludes approval/publish/merge controls
- how the response excludes Codex SDK execution handles
- how the response excludes provider credentials
- how payload size and field count stay bounded

The response should include only fields needed for a read-only surface.

## Evidence pointer boundary

Evidence pointers are pointer-only. Future route implementation must answer:

- no proof/evidence/readiness record creation
- no acceptance or readiness marking
- how evidence pointers are labeled as pointers
- how pointer targets are scoped to authorized records
- how pointer summaries avoid leaking private raw text
- how pointer absence or uncertainty is represented
- how the route avoids proof/evidence/readiness record creation
- how the route avoids acceptance or readiness marking

Evidence pointers do not create proof/evidence/readiness records. They do not
accept evidence, mark readiness, approve evidence, or bypass AG Resume
proof/evidence gates.

## Perspective Capsule boundary

Perspective Capsule / Handoff Capsule material remains conceptual and
non-authoritative. Future route implementation must answer:

- no Codex launch
- no PR/branch creation
- how capsule fields are rendered for inspection only
- how capsule text avoids launching Codex
- how capsule text avoids PR/branch creation
- how capsule text avoids proof/evidence writes
- how capsule text avoids approval/publish/merge/deploy authority
- how unresolved tensions and questions remain visible

Capsule material must not launch handoff execution, execute Codex, create a
branch, create a PR, record proof, record evidence, approve readiness, publish,
merge, retry, replay, or deploy.

## Project Constellation boundary

Project Constellation material remains read-only and non-authoritative. Future
route implementation must answer:

- no runtime node creation
- no source-of-truth
- how nodes are represented as read-only view data
- how edges are represented as read-only view data
- how clusters are represented as read-only view data
- how unresolved tensions and next action candidates remain advisory
- how the route avoids graph DB behavior
- how the route avoids persistence
- how the route avoids runtime node creation
- how the route avoids source-of-truth claims

Project Constellation route material must not become graph DB, persistence,
runtime node creation, source-of-truth, graph layout engine, approval surface,
or Project Constellation runtime behavior.

## Logging and telemetry boundary

Future route implementation must answer:

- what request metadata is logged
- what response metadata is logged
- how logs exclude secrets
- how logs exclude credentials/auth/env
- how logs exclude raw private user text unless explicitly scoped
- how logs exclude hidden reasoning/chain-of-thought
- how retention, access, and deletion expectations are documented

Telemetry must support diagnosis without becoming a secondary store for private
route payloads.

## Browser/computer-use validation boundary

Future route implementation must answer:

- whether the route is surfaced in UI, ChatGPT Apps, MCP tools, or
  browser-facing previews
- whether browser/computer-use validation is required
- which URL or surface was inspected
- which read-only fields were verified
- which forbidden controls or write affordances were absent
- which browser/computer-use checks were skipped with reasons

If the route is surfaced in UI, ChatGPT Apps, MCP tools, or browser-facing
previews, browser/computer-use validation is required in that implementation
PR.

## Authority matrix boundary

Future route implementation must answer:

- whether the authority matrix needs an update
- whether the route is GET/read-only only
- whether any write, mutation, approval, publish, merge, retry, replay, deploy,
  proof/evidence, AG Resume, or Codex SDK behavior is introduced
- whether any skipped authority matrix update has a concrete reason
- who must review any authority change before merge

Checklist completion does not grant authority. Any authority change requires a
separate approved scope.

## Required implementation PR evidence

Future route implementation PRs must include:

- route path
- auth/session design
- response schema or sample
- comparison against `types/readonly-api-route-response.ts`, the type-only response shape
- forbidden fields review
- privacy review result
- prompt-injection review result
- data provenance summary
- browser/computer-use report if surfaced in UI
- tests/smokes run
- skipped checks with reasons
- authority matrix update status or skipped reason
- remaining blockers/risks
- questions requiring user/PM judgment

Future route implementation PRs should include or compare against the type-only
response shape in `types/readonly-api-route-response.ts`. That type boundary
does not implement any API route, does not add runtime behavior, does not add
auth implementation, and does not add proof/evidence writes.

`docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md` is the next
pre-route artifact before any candidate route implementation. It applies this
checklist, `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`,
`types/readonly-api-route-response.ts`, and the PR #381 user-intent validation
baseline where applicable. The packet is docs/smoke/package-pointer only and
does not implement a route. Future route implementation PRs must still answer
this checklist before merge, including comparison against
`types/readonly-api-route-response.ts` and the PR #381 user-intent validation
baseline where applicable.

## Validation and smoke plan

Required validation for this checklist PR:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:readonly-api-route-response-shape-boundary`
- `npm run smoke:readonly-api-route-implementation-design-packet`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:readonly-api-route-planning-boundary`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`
- `git diff --check`
- `git diff --cached --check`

`npm run smoke:readonly-api-route-review-checklist` is a deterministic static
read smoke. It checks this checklist, the planning boundary pointer, the index
pointer, the package script pointer, required checklist concepts, authority
boundary phrases, no forbidden positive authority grants, and changed-file
boundaries.

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.
Proof-only closeout may be skipped when no runtime/work ID context exists and
this PR performs no proof/evidence writes.

## Non-goals

- no API route implementation
- no runtime behavior
- no UI code
- no ChatGPT App tool implementation
- no MCP tool implementation
- no DB schema/migrations
- no graph DB
- no persistence
- no auth implementation
- no external calls
- no proof/evidence writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
- no public unauthenticated endpoint
- no raw DB rows
- no mutation URLs
- no write handles
- no approval/publish/merge controls
- no proof/evidence/readiness records
