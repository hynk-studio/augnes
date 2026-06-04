# Read-Only API Route Planning Boundary v0.1

## Status and scope

Status: planning note for future read-only Augnes API routes that could support
ChatGPT App/MCP read-only surfaces.

Scope is docs/smoke/package-pointer only:

- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`
- `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md`
- `docs/00_INDEX_LATEST.md`
- `scripts/smoke-readonly-api-route-planning-boundary.mjs`
- `package.json`

This note is repo-local, non-SSOT, read-only, non-authoritative, and planning
only. It does not implement any API route. It does not add runtime behavior, UI
code, ChatGPT App tool implementation, MCP tool implementation, DB schema/
migrations, graph DB, persistence, proof/evidence writes, AG Resume behavior,
Codex SDK execution/provider behavior, GitHub/OpenAI/Augnes runtime calls,
network calls, auth implementation, external calls, branch creation authority,
PR creation authority by itself, or merge/publish/approval/retry/replay/deploy
authority.

## Purpose

The purpose is to define the planning boundary for future read-only API routes
that could support a ChatGPT App/MCP read-only surface. The routes described
here would be user-facing decision support inputs only.

No API route is implemented in this PR. No endpoint, route file, handler,
schema, server behavior, auth behavior, persistence, or external call exists as
part of this planning note.

## Relationship to ChatGPT App/MCP read-only surface

`docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md` names a future
read-only API route as an implementation gate for a future ChatGPT App/MCP
surface. This note defines that route gate before any route, MCP tool, ChatGPT
App component, or runtime endpoint exists.

Future ChatGPT App/MCP work must treat this note as planning context only. It
does not satisfy the separate implementation gates for an API route PR, auth/
security review, privacy review, prompt-injection review, browser/computer-use
validation, authority matrix update, or smoke and test coverage.

## Candidate read-only route families

Future GET/read-only route families could be scoped around:

- Whole Perspective summary
- Project Constellation read model
- Perspective Capsule / Handoff Capsule preview
- evidence pointer list
- unresolved tension list
- boundary / next review packet
- copyable handoff text packet

Candidate route families are vocabulary only. They are not route paths, API
contracts, database queries, tool schemas, or source-of-truth definitions.

`types/readonly-api-route-response.ts` defines the type-only response shape
boundary for these future route families. It is required before endpoint
implementation as response vocabulary only. It does not implement any API route,
does not add runtime behavior, does not add auth implementation, does not add DB
schema, does not add MCP/App tool, does not add proof/evidence writes, and does
not add Codex SDK execution.

## Allowed response concepts

Future read-only routes may display bounded derived concepts such as:

- Whole Perspective summary
- Project Constellation read model
- nodes
- edges
- clusters
- evidence pointers
- unresolved tensions
- next action candidates
- Perspective Capsule / Handoff Capsule preview
- copyable handoff text
- boundary / next review

Allowed response concepts must remain derived, bounded, and non-authoritative.
They must not imply write capability, source-of-truth status, proof/evidence
acceptance, execution authority, or publish/merge readiness.

## Forbidden response concepts

Future read-only routes must not expose:

- secrets
- raw private user text beyond scoped Augnes records
- hidden reasoning / chain-of-thought
- raw DB rows
- credentials/auth/env
- proof/evidence write handles
- mutation URLs
- approval/publish/merge controls
- Codex SDK execution handles
- provider credentials

Forbidden response concepts remain forbidden even for GET/read-only routes. A
read-only transport does not make unsafe content safe.

## Evidence pointer semantics

Evidence pointers are pointers only. A future read-only route may include an
evidence pointer label, type, target reference, or bounded summary only after
separate privacy and provenance review.

Evidence pointers do not create proof/evidence/readiness records. They do not
write evidence, approve evidence, mark readiness, or bypass AG Resume proof/
evidence gates.

## Perspective Capsule semantics

Perspective Capsule / Handoff Capsule route material remains conceptual and
non-authoritative. A future route may render capsule preview fields for user
inspection, but it must not launch handoff execution, execute Codex, create a
branch, create a PR, record proof, record evidence, or create publish/merge
authority.

## Project Constellation semantics

Project Constellation route material remains read-only, non-authoritative, and
evidence-pointer-based. It may describe nodes, edges, clusters, evidence
pointers, unresolved tensions, and next action candidates.

It must not become graph DB, persistence, runtime node creation, source of
truth, graph layout engine, approval surface, or Project Constellation runtime
behavior.

## Auth/security gates

Even GET/read-only routes need auth/security/privacy boundaries. Future route
implementation requires separate auth/security review, privacy review,
prompt-injection review, workspace authorization review, and explicit handling
for scoped Augnes records.

Future routes must not expose credentials/auth/env, secrets, provider
credentials, hidden reasoning / chain-of-thought, raw DB rows, or private user
text beyond scoped Augnes records.

## Browser/computer-use gates

If a future route is surfaced in UI, ChatGPT Apps, MCP tools, or browser-facing
previews, browser/computer-use validation is required in that implementation
PR. This planning note does not perform browser/computer-use validation because
it does not touch UI or browser-facing files.

## Implementation gates

Future route implementation requires separate gates for:

- API route PR
- auth/security review
- privacy review
- prompt-injection review
- browser/computer-use validation if surfaced in UI
- authority matrix update
- smoke and test coverage

Future implementation must be GET/read-only only unless separately scoped.
Even GET/read-only routes need auth/security/privacy boundaries before
implementation.

`docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md` defines the read-only API
route review checklist for those gates. The checklist is required before future
route implementation, and future implementation PRs must answer its auth/session,
privacy, prompt-injection, provenance, response minimization, evidence pointer,
capsule, Project Constellation, browser/computer-use, and authority matrix
items before merge. No API route is implemented by the checklist or this
planning boundary.

`docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md` is the next
pre-route implementation design artifact. It is docs/smoke/package-pointer only
and does not implement a route. It applies this planning boundary, the review
checklist, `types/readonly-api-route-response.ts`, and the PR #381
Project Constellation user-intent validation baseline before any future route
implementation PR. It adds no API route, route file, handler, API contract,
runtime behavior, UI, auth implementation, DB schema/migrations, MCP/App tool,
proof/evidence write, AG Resume behavior, Codex SDK execution/provider
behavior, graph DB, persistence, or merge/publish/approval/retry/replay/deploy
authority.

## Validation and smoke plan

Required validation for this planning note:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-planning-boundary`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:readonly-api-route-response-shape-boundary`
- `npm run smoke:readonly-api-route-implementation-design-packet`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-planning-boundary`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`
- `git diff --check`
- `git diff --cached --check`

`npm run smoke:readonly-api-route-planning-boundary` is a deterministic static
read smoke. It checks this planning note, the ChatGPT App/MCP surface pointer,
the index pointer, the package script pointer, required read-only route
concepts, forbidden response concepts, implementation gates, authority boundary
phrases, no forbidden positive authority grants, and changed-file boundaries.

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
- no proof/evidence writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no GitHub/OpenAI/Augnes runtime calls
- no network calls
- no auth implementation
- no external calls
- no proof/evidence/readiness records
- no mutation URLs
- no approval/publish/merge controls
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
