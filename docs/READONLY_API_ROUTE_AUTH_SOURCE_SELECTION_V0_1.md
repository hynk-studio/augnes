# Read-Only API Route Auth Source Selection v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- auth source selection packet only
- repo-local investigation and planning record
- no auth implementation
- no production auth implementation
- no hosted auth
- no OAuth
- no session identity implementation
- no workspace membership implementation
- no DB query implementation
- no DB schema/migrations
- no API route behavior change
- no route file change
- no route handler change
- no lib runtime helper change
- no secrets/env handling
- no consumer surface
- no UI
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no external calls
- no OpenAI calls
- no GitHub calls
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no graph DB
- no persistence
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority

This packet applies to future authenticated workspace/project scope source
selection for:

```text
GET /api/augnes/read/constellation-preview
```

The route remains local-only unless a separate implementation PR changes it.

## 2. Purpose

The purpose is to inspect existing repo-local session, workspace, auth-adjacent,
local runtime, ChatGPT App/MCP, Augnes Core state scope, route security, and
authority matrix surfaces, then decide whether any current source is concrete
enough for a future fail-closed auth/scope adapter implementation.

This document follows:

- `docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`
- `docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`
- `docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`
- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`
- `docs/AUTHORITY_MATRIX.md`

It records source selection only. It does not implement auth/session/workspace
behavior, route behavior, DB reads, or a consumer surface.

## 3. Source selection thesis

The thesis is:

- a future route auth/scope adapter needs a concrete source that proves caller
  identity and workspace/project membership
- current repo-local session and scope records are useful continuity metadata
  and local Core records, but they do not prove caller identity or membership
  for this route line
- the current local read-only guard remains the right operational boundary for
  route-only local validation
- the next implementation should stay deferred until a concrete
  auth/session/workspace source is selected
- the safest next artifact is a future type-only auth/scope adapter boundary,
  not route behavior change

Recommended decision: use Candidate E. Keep the route local-only, keep no
consumer connected, and do not implement auth yet.

## 4. Existing repo-local candidates inspected

Inspected repo-local surfaces:

| Surface | Files inspected | Relevant finding | Source-selection result |
| --- | --- | --- | --- |
| Current read-only local route guard | `lib/readonly-api/access-guard.ts`, `docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md` | Local URL host, `Host`, `X-Forwarded-Host`, GET method, marker header, and `project:augnes` scope checks exist. The guard says it is not production auth. | Valid local validation guard, not a real auth/session/workspace source. |
| Constellation preview route | `docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md`, `lib/readonly-api/constellation-preview.ts` | Route is explicitly local-authorized, static fixture backed, and no consumer is connected. | Keep unchanged; no route behavior change in this packet. |
| Auth/scope integration plan | `docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md` | Prior plan recommends keeping the route local-only until a concrete source is selected. | This packet confirms that recommendation after inspection. |
| Session binding helper and routes | `lib/session-binding.ts`, `app/api/sessions/bind/route.ts`, `app/api/sessions/trace/route.ts`, `scripts/smoke-session-binding.mjs` | Existing sessions have `scope`, `surface`, `actor`, work refs, PR refs, and summary metadata. Binding requires an existing session row and records continuity metadata. | Useful continuity model, but not identity proof or workspace/project membership proof. |
| DB scope model | `lib/db/schema.sql`, `lib/db.ts`, `lib/work.ts`, `lib/state/brief.ts` | Many records carry `scope`, with default `project:augnes` in local Core tables and helpers. | Scope taxonomy exists, but membership and caller identity are not proven by the scope string alone. |
| Codex session workflow | `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` | Workflow uses optional existing session binding and says it is not a new session runtime. | Supports route-local continuity, not route auth. |
| ChatGPT App/MCP planning | `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md`, `docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md` | Future read-only surfaces and bridge tools are documented, but consumer/auth context is not implemented for this route line. | Candidate remains future context only. |
| Authority matrix | `docs/AUTHORITY_MATRIX.md` | Current route and local access guard grant no consumer, write, proof/evidence, publish, merge, Codex, DB query, graph DB, or persistence authority. | Selection must preserve those limits. |

No inspected repo-local surface currently supplies both identity proof and
workspace/project membership proof for this read-only route line.

## 5. Candidate A: Augnes local session/workspace model

Description:

- Use an existing Augnes local session/workspace model if the repo contains a
  concrete source that can prove identity and workspace/project membership.

Inspection result:

- `lib/session-binding.ts` defines sessions with `scope`, `surface`, `actor`,
  related work, related PR, summary, handoff, and evidence-pack references.
- `app/api/sessions/bind/route.ts` binds metadata to an existing session row.
- `app/api/sessions/trace/route.ts` reads bounded session trace data.
- `scripts/smoke-session-binding.mjs` verifies continuity binding and trace
  behavior over local runtime records.
- `lib/db/schema.sql` defines `sessions` and many scoped local Core records.

Fit:

- Good for continuity, trace, and local review context.
- Good evidence that `project:augnes` is a real local scope vocabulary.

Gap:

- A session row does not prove the caller is the session owner.
- `actor` is metadata, not authenticated identity.
- `surface` is metadata, not workspace membership.
- `scope` is a record label, not permission proof.
- Existing session binding can update metadata; it is not a route caller auth
  source for the constellation preview route.

Decision:

- Do not select Candidate A for route auth implementation yet.
- A future type-only auth/scope adapter boundary should define what a usable
  local session/workspace source would need to prove before this candidate is
  reconsidered.

## 6. Candidate B: local runtime operator session binding

Description:

- Bind a route caller to a local runtime operator session for route-only local
  validation.

Inspection result:

- `docs/CODEX_SESSION_ADAPTER_V0_2_WORKFLOW.md` documents optional session
  binding, current state/work reads, evidence rows, evidence packs, and session
  traces.
- The workflow says v0.2 is not a new session runtime and does not create
  sessions automatically.
- Local bridge docs describe local read tools and stronger proof/proposal tools,
  but they do not turn local bridge usage into route auth.

Fit:

- Could preserve local route-first validation.
- Could make operator continuity more explicit in a future local-only adapter.

Gap:

- It is still local-oriented.
- It does not prove hosted caller identity.
- It does not prove workspace/project membership.
- It could be misread as production auth unless kept behind explicit boundary
  language and tests.

Decision:

- Do not select Candidate B for this route yet.
- Reconsider only if user/PM selects a local-only auth source and accepts that
  it is not production auth.

## 7. Candidate C: future ChatGPT App/MCP authenticated context

Description:

- Use a future ChatGPT App/MCP authenticated context as the route caller
  identity and workspace/project source.

Inspection result:

- `docs/CHATGPT_APP_MCP_READONLY_SURFACE_BOUNDARY_V0_1.md` describes future
  read-only user-facing decision support for Project Constellation and capsule
  material.
- `docs/CODEX_MCP_AUGNES_BRIDGE_USAGE_V0_1.md` documents local MCP bridge usage
  and read tool boundaries.
- The current route has no consumer surface and no ChatGPT App/MCP tool
  connected.

Fit:

- This could align with a later first consumer surface if a concrete
  authenticated context is selected.

Gap:

- No concrete route auth context exists in this repo today for this route line.
- Selecting this now would couple auth source selection to a consumer surface.
- The current route-first plan intentionally avoids consumer coupling.

Decision:

- Do not select Candidate C now.
- Keep ChatGPT App/MCP context as a future consumer/auth option after route-level
  auth/scope boundaries pass.

## 8. Candidate D: explicit local development auth adapter

Description:

- Add an explicit local development auth adapter that remains local-only and is
  clearer than the marker header alone.

Inspection result:

- Current local guard already validates local host, marker header, method,
  forwarded host, and `project:augnes` scope.
- No separate explicit local development auth adapter exists in repo today.

Fit:

- Could clarify local operator intent in a future local-only route slice.
- Could be statically tested before a route behavior change if designed as a
  type-only/source-boundary first.

Gap:

- It would still be local-only.
- It would still not be production auth.
- It would not prove hosted workspace membership unless backed by a concrete
  source.

Decision:

- Do not implement Candidate D in this PR.
- If user/PM wants local-only hardening before real auth, add a future
  type-only adapter boundary first.

## 9. Candidate E: defer real auth source and keep route local-only

Description:

- Keep the current route local-only and defer real auth/scope implementation
  until a concrete source is selected.

Fit:

- Matches PR #386 recommendation.
- Preserves current route behavior.
- Avoids inventing auth semantics.
- Avoids coupling the route to a consumer surface.
- Keeps the local guard as a clear route-only validation boundary.
- Allows a future type-only auth/scope adapter boundary before implementation.

Decision:

- Select Candidate E.
- Keep the route local-only.
- Keep no consumer connected.
- Do not implement auth yet.

## 10. Selection criteria

Selection criteria:

| Criterion | Required for implementation? | Current finding |
| --- | --- | --- |
| concrete source exists in repo today | Yes | No concrete source was found that proves identity and membership for this route line. |
| can prove identity | Yes | Current session/actor fields are metadata, not proof of caller identity. |
| can prove workspace/project membership | Yes | Current scope fields do not prove membership. |
| supports `project:augnes` or explicit project scope mapping | Yes | Scope vocabulary exists; permission mapping does not. |
| can fail closed | Yes | Current local guard can fail closed; real auth source is not selected. |
| does not require secrets/env in this docs-only PR | Yes | Candidate E satisfies this. |
| does not couple first route implementation to a consumer surface | Yes | Candidate E satisfies this. |
| does not require DB schema/migration in this PR | Yes | Candidate E satisfies this. |
| can be tested with static smoke before route behavior change | Yes | Candidate E plus future type-only adapter boundary satisfies this. |
| has clear privacy/prompt-injection/logging boundaries | Yes | Future boundary must define these before implementation. |

## 11. Candidate comparison matrix

| Candidate | Concrete source today | Identity proof | Workspace/project membership proof | Consumer coupling | Secrets/env needed in this PR | DB/schema needed in this PR | Static smoke before route change | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Candidate A: Augnes local session/workspace model | Partial session/scope records only | No | No | No | No | No | Yes, if type-only boundary is added first | Defer |
| Candidate B: local runtime operator session binding | Partial local continuity workflow only | No | No | No | No | No | Yes, if local-only boundary is added first | Defer |
| Candidate C: future ChatGPT App/MCP authenticated context | No | No | No | Yes | Not in this PR | Not in this PR | Yes, after context is selected | Defer |
| Candidate D: explicit local development auth adapter | No | No | No | No | No | No | Yes, with type-only boundary first | Defer |
| Candidate E: defer real auth source and keep route local-only | Yes as a decision, not auth source | Not applicable | Not applicable | No | No | No | Yes | Select |

## 12. Recommended decision

Recommended decision: select Candidate E.

Keep the route local-only. Keep no consumer connected. Do not implement auth
yet. Recommend a future type-only auth/scope adapter boundary before any route
behavior change.

The future type-only boundary should define:

- identity source contract
- workspace source contract
- project source contract
- scope mapping contract for `project:augnes`
- fail-closed result shape
- minimal error shape
- privacy boundary
- prompt-injection boundary
- logging boundary
- static smoke requirements
- exact future implementation file candidates

## 13. Why implementation is still deferred

Implementation is still deferred because the investigation did not find a
concrete repo-local source that proves both caller identity and
workspace/project membership for this route line.

Reasons:

- session rows are continuity records
- `actor` is metadata
- `surface` is metadata
- `scope` is a record label
- session binding requires an existing session row but does not authenticate a
  route caller
- ChatGPT App/MCP authenticated context is future planning, not current route
  source
- local runtime operator binding remains local-oriented and not production auth

Future implementation requires concrete auth/session/workspace evidence before
route behavior changes.

In smoke terms, future implementation requires concrete auth/session/workspace
evidence before any auth/scope adapter changes route behavior.

## 14. Required next implementation gates

Required gates before any route auth/scope implementation:

1. User/PM selects a concrete auth/session/workspace source.
2. Add a type-only auth/scope adapter boundary, if the selected source still
   needs source contract definition.
3. Define exact route adapter files and no-consumer scope.
4. Define fail-closed error codes for missing identity, invalid session,
   missing workspace, unauthorized workspace, missing project, unauthorized
   project, ambiguous scope, stale scope, cross-workspace scope, and unavailable
   auth source.
5. Define static smokes before route behavior change.
6. Define route-level smokes before consumer integration.
7. Recheck response minimization, privacy, prompt-injection, logging, and
   authority matrix boundaries.
8. Keep browser/computer-use validation reserved for a later consumer surface
   unless user/PM selects a UI/App/MCP consumer in separate scope.

Likely future files for a type-only/source-boundary PR:

- `types/readonly-api-auth-scope.ts`
- `docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md`
- `scripts/smoke-readonly-api-route-auth-scope-adapter-boundary.mjs`
- `docs/00_INDEX_LATEST.md`
- `package.json`

Likely future files for a later implementation PR, only after source selection:

- selected adapter helper under a narrow `lib/readonly-api/...` path
- selected route integration file
- focused route/auth smokes
- docs updates
- authority matrix update
- package script pointer

These are future candidates, not changed by this PR.

## 15. Relationship to local access guard

`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md` remains the current route-only
local validation boundary.

The local guard:

- checks local URL host
- checks `Host`
- checks `X-Forwarded-Host`
- checks GET method
- checks marker header
- checks `scope=project:augnes`
- fails closed
- is not production auth
- is not hosted/session/OAuth/multi-user auth
- is not workspace membership

This source selection packet does not replace the local guard. It selects no
new auth source for implementation. Future real auth integration must describe
how it composes with or replaces the local marker guard in a separate
implementation scope.

## 16. Relationship to constellation preview route

`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md` remains the current
route baseline.

Route status remains:

- GET/read-only only
- explicitly local-authorized
- `scope=project:augnes`
- static fixture backed
- no DB query
- no route behavior change
- no consumer surface
- no UI
- no MCP/App tool
- no proof/evidence/readiness writes
- no Codex execution
- no branch/PR, merge, publish, approval, retry, replay, or deploy authority

The route remains local-only until auth source is selected and separately
implemented.

## 17. Authority and non-authority boundary

This source selection is planning-only and does not grant consumer authority.

Authority boundary:

- no auth implementation
- no production auth
- no hosted auth
- no OAuth
- no session identity implementation
- no workspace membership implementation
- no route behavior change
- no route file change
- no route handler change
- no lib runtime helper change
- no DB query
- no DB schema/migrations
- no secrets/env handling
- no consumer surface
- no UI
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no external calls
- no OpenAI calls
- no GitHub calls
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no graph DB
- no persistence
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority

No route-provided text grants authority. Evidence pointers remain pointer-only.
The local guard remains not production auth.

## 18. Validation and smoke plan

Required validation for this packet:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-auth-source-selection`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-auth-source-selection`
- `npm run smoke:readonly-api-route-auth-scope-integration-plan`
- `npm run smoke:readonly-api-route-access-guard`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

Recommended supplemental diagnostics:

- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-user-intent-validation`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Local route manual check may be skipped because this PR does not change route
behavior.

Proof-only closeout may be skipped when no runtime/work ID context exists and
this PR must not record proof/evidence/readiness writes.

## 19. Non-goals

- no auth implementation
- no production auth
- no hosted auth
- no OAuth
- no session identity implementation
- no workspace membership implementation
- no DB schema/migrations
- no DB query implementation
- no API route behavior change
- no route file change
- no route handler change
- no lib runtime helper change
- no secrets/env handling
- no consumer surface
- no UI code
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no external calls
- no OpenAI calls
- no GitHub calls
- no fetch/XMLHttpRequest
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no graph DB
- no persistence
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
