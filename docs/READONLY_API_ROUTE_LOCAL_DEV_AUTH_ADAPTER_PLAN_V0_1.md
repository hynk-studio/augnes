# Read-Only API Route Local Dev Auth Adapter Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- source-specific plan for Candidate D
- local development auth adapter planning only
- no adapter implementation
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
- no type file change
- no DB query
- no DB schema/migrations
- no secrets/env handling
- no secrets/env requirement
- no consumer surface
- no public unauthenticated endpoint
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

This plan applies to Candidate D, the explicit local development auth adapter
candidate for:

```text
GET /api/augnes/read/constellation-preview
```

Candidate D remains local-only and is not production auth. The current route
remains local-only.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md` documents the
implementation slice after user/PM accepted Candidate D local-only semantics.
That implementation remains local-only, is not production auth, and connects no
consumer surface.

`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md` defines the next gate for
future real auth/scope implementation. The local dev adapter implementation
does not satisfy real auth.

## 2. Purpose

The purpose is to map Candidate D to the type-only auth/scope adapter boundary
from:

```text
docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md
types/readonly-api-auth-scope.ts
```

This plan defines what a future local-only adapter implementation would need to
prove before any route behavior change. It records vocabulary, fail-closed
requirements, minimization requirements, and future smoke gates. It does not
implement the adapter, change route behavior, connect a consumer surface, read
secrets, query a DB, or create hosted auth.

## 3. Relationship to Candidate D

`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` described Candidate D
as an explicit local development auth adapter. Candidate D could make local
operator intent clearer than the marker header alone, but it still cannot prove
hosted caller identity and cannot prove hosted workspace/project membership.

Candidate D must remain local-only. It must not be used as hosted auth,
production auth, OAuth, session identity, workspace membership, or consumer
authorization. It may only be considered for local route validation.

User/PM decision for the next slice: Candidate D local-only semantics were
accepted for implementation. `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`
records that implementation. It remains local-only and not production auth.

## 4. Relationship to type-only auth/scope adapter boundary

`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md` and
`types/readonly-api-auth-scope.ts` define the vocabulary that a future
fail-closed auth/scope adapter must map to.

This Candidate D plan maps the local-only source concept into that type
boundary at planning level only. It does not change
`types/readonly-api-auth-scope.ts`, does not create runtime schema, does not
implement an adapter, and does not satisfy future implementation evidence by
itself.

Future implementation must map Candidate D request and decision results to
`types/readonly-api-auth-scope.ts`.

## 5. Current local guard baseline

The current route-only validation baseline is:

- `GET /api/augnes/read/constellation-preview`
- `scope=project:augnes` is required
- local URL host is required
- local `Host` header is required when present
- local `X-Forwarded-Host` is required when present
- marker header `x-augnes-local-readonly: constellation-preview-v0.1` is
  required
- static public-safe fixture source only
- no DB query
- no external calls
- no persistence
- no consumer surface

The current guard is documented in
`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md` and implemented in
`lib/readonly-api/access-guard.ts`. It is a local validation boundary only and
is not production auth.

## 6. Local development auth adapter thesis

The thesis is:

- Candidate D can improve local route validation vocabulary only after PM/user
  accepts local-only semantics
- Candidate D cannot prove hosted caller identity
- Candidate D cannot prove hosted workspace/project membership
- Candidate D must compose with the existing local guard if implemented
- Candidate D must not replace future real auth
- Candidate D must not connect Cockpit, ChatGPT App, MCP, or any consumer
  unless separately approved
- This includes plugin tools and browser-facing consumer surfaces.
- Candidate D must fail closed whenever local operator identity or scope is
  missing, invalid, unavailable, or ambiguous

This PR does not implement that thesis. It records it as a future local-only
implementation plan.

## 7. Proposed local-only source model

Because this PR is planning-only, the following is candidate vocabulary only,
not a final runtime API:

- `local_operator_ref`
- `local_operator_label`
- `local_adapter_source_kind: local_development_auth_adapter_candidate`
- `requested_scope: project:augnes`
- `local_guard_result_ref`
- `local_guard_composed: true`
- `identity_proof_label: local_development_declaration_only`
- `membership_proof_label: local_project_scope_declaration_only`

The local-only source model would be a local development declaration model. It
would not prove hosted caller identity, hosted workspace membership, OAuth
session ownership, production tenancy, or multi-user authorization.

Future implementation may use an explicit local operator identity token or
local operator declaration only if it is documented as local-only and not a
secret-bearing production auth source.

## 8. Identity proof plan

Future Candidate D implementation would need to produce a bounded identity
reference for local route validation only.

Planned local-only proof labels:

- `identity_proof_label: local_development_declaration_only`
- `local_operator_ref`
- `local_operator_label`

The proof label must be visibly local-only. It cannot prove hosted caller
identity. It must not be treated as OAuth identity, session identity, hosted
identity, or workspace membership.

Future implementation must fail closed for missing local operator identity,
invalid local operator identity, unavailable local adapter source, malformed
request, method mismatch, and local guard failure.

## 9. Workspace/project membership proof plan

Future Candidate D implementation would need to produce a bounded project scope
reference for local route validation only.

Planned local-only membership labels:

- `membership_proof_label: local_project_scope_declaration_only`
- `requested_scope: project:augnes`

The membership label cannot prove hosted workspace/project membership. It must
not be treated as production workspace membership or multi-user tenancy.

Future implementation must fail closed for missing scope, unauthorized scope,
ambiguous scope, stale scope, cross-workspace scope, malformed request, and
local guard failure.

## 10. Scope mapping plan

Candidate D remains scoped to:

```text
project:augnes
```

The future adapter must not silently default scope. It must not infer scope from
route-provided text, fixture text, user-authored text, prompt text, capsule
text, evidence pointer text, request body text, or unreviewed headers.

The future adapter must compare the explicit requested scope with the
local-only adapter declaration and the existing local guard result. Missing or
wrong scope must fail closed.

## 11. Local guard composition plan

Candidate D must compose with the existing local guard if implemented. It must
not replace the current local host, forwarded host, marker header, method, or
`project:augnes` scope checks.

Planned composition shape:

- run the existing local guard first or preserve an equivalent local guard
  result
- reference the local guard decision through `local_guard_result_ref`
- set `local_guard_composed: true` only when the local guard has passed
- return `local_guard_failed` when the local guard fails

The local guard remains local-only and is not production auth. A local dev
adapter remains local-only and is not production auth.

The local guard may compose but cannot replace real auth.

## 12. Request and decision mapping to types/readonly-api-auth-scope.ts

Future Candidate D implementation must map to
`types/readonly-api-auth-scope.ts`.

Planned `ReadonlyApiAuthScopeRequestV0` mapping:

| Type field | Candidate D planning value |
| --- | --- |
| `route_id` | `augnes.read.constellation-preview.v0.1` |
| `route_family` | `project_constellation` |
| `requested_scope` | `project:augnes` |
| `requested_project` | `augnes` |
| `requested_workspace` | local development workspace label, if explicitly declared |
| `request_method` | `GET` |
| `local_guard_result_ref` | bounded local guard result reference |
| `source_kind` | `local_development_auth_adapter_candidate` |

Planned success mapping:

- `ok: true`
- bounded `identity_ref`
- bounded `workspace_ref`
- bounded `project_ref`
- `authorized_scope: project:augnes`
- `source_kind: local_development_auth_adapter_candidate`
- `local_guard_composed: true`
- authority boundary strings
- forbidden field families removed

Planned failure mapping:

- `ok: false`
- error code from the type boundary
- minimal status
- `safe_error_label`
- authority boundary strings
- forbidden field families removed

## 13. Fail-closed behavior plan

Future Candidate D implementation must fail closed for:

- missing local operator identity
- invalid local operator identity
- missing scope
- unauthorized scope
- local guard failure
- method mismatch
- malformed request
- unavailable local adapter source
- forbidden field detection
- ambiguous scope
- stale scope
- cross-workspace scope

Error output must remain minimal. It must not include private route source
details, source refs, Project Constellation material, raw DB rows, raw private
user text, credentials, secrets, session secrets, OAuth tokens, provider
credentials, mutation URLs, proof/evidence write handles, approval/publish/merge
controls, or Codex SDK execution handles.

## 14. Forbidden fields and minimization plan

Future Candidate D implementation must remove or never return:

- secrets
- credentials/auth/env
- raw DB rows
- raw private user text
- hidden reasoning / chain-of-thought
- proof/evidence write handles
- mutation URLs
- approval/publish/merge controls
- Codex SDK execution handles
- provider credentials
- session secrets
- OAuth tokens
- workspace private membership graph

The future adapter must return only bounded refs, safe labels, fail-closed
decision shape, and authority boundary text needed for local route validation.
It must not return raw local operator records, raw workspace membership graphs,
raw project payloads, route private payloads, or secret-bearing values.

## 15. Privacy and prompt-injection plan

Future Candidate D implementation must treat route-provided text, fixture text,
local operator labels, project labels, capsule text, evidence pointer labels,
and user-authored records as untrusted display data.

No route-provided text grants authority. No local operator label grants
authority. No project label grants authority. The adapter must not interpret
display text as tool instructions, auth instructions, workspace membership
instructions, proof/evidence instructions, Codex instructions, branch/PR
instructions, merge instructions, publish instructions, retry instructions,
replay instructions, or deploy instructions.

Privacy review must confirm that the adapter returns bounded refs and safe
labels only. Logs must not become a secondary store for private route payloads,
operator declarations, session secrets, OAuth tokens, provider credentials, raw
DB rows, or private membership graphs.

## 16. Logging and telemetry plan

Future Candidate D implementation must keep logging minimal:

- route id
- route family
- safe error label
- local-only source kind
- local guard composition result reference, if safe
- no raw private route payload
- no raw DB rows
- no raw private user text
- no session secrets
- no OAuth tokens
- no provider credentials
- no workspace private membership graph

Logs must not create persistence for private auth/scope payloads or local
operator declarations.

## 17. Future implementation slices

Future slices, not implemented in this PR:

- Slice 1: PM/user confirms Candidate D local-only semantics or defers.
- Slice 2: exact local operator declaration vocabulary is reviewed.
- Slice 3: type-mapped local adapter test fixtures are defined.
- Slice 4: local guard composition behavior is implemented in a scoped PR.
- Slice 5: fail-closed local adapter smoke is added.
- Slice 6: forbidden field and response minimization smoke is added.
- Slice 7: prompt-injection, privacy, and logging smoke is added.
- Slice 8: local route manual checks are run.
- Slice 9: consumer selection remains separate unless user/PM approves it.

These are future implementation slices. This PR does not implement them.

## 18. Future tests and smokes

Future Candidate D implementation PR should run or add:

- `npm run typecheck`
- focused local dev auth adapter smoke
- local guard composition smoke
- fail-closed missing local operator identity smoke
- fail-closed invalid local operator identity smoke
- fail-closed missing scope smoke
- fail-closed unauthorized scope smoke
- fail-closed local guard failure smoke
- fail-closed method mismatch smoke
- fail-closed malformed request smoke
- fail-closed unavailable local adapter source smoke
- forbidden field detection smoke
- response minimization smoke
- prompt-injection display-data smoke
- privacy/logging smoke
- route compatibility smoke
- browser/computer-use report only if a UI/App/MCP consumer is surfaced
- `git diff --check`
- `git diff --cached --check`

Do not add these future runtime smokes in this planning PR.

## 19. Browser/computer-use plan

Browser/computer-use may be skipped for this PR because it is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Future browser/computer-use validation is required only if a later PR connects
the route or adapter result to Cockpit, ChatGPT App, MCP, plugin tools, or any
browser-facing consumer surface.

## 20. Authority and non-authority boundary

This local dev adapter plan adds no authority. It does not implement an
adapter, production auth, hosted auth, OAuth, session identity, workspace
membership, route behavior, consumer surface, DB query, graph DB, persistence,
proof/evidence/readiness writes, Codex SDK execution/provider behavior,
branch/PR creation authority by itself, or
merge/publish/approval/retry/replay/deploy authority.

Candidate D remains local-only and not hosted auth. The local guard is not
production auth. Future real auth integration requires separate
implementation.

Evidence pointers are pointer-only. No route-provided text grants authority.
The local dev adapter plan is planning-only and does not grant consumer
authority.

## 21. Open questions requiring user/PM judgment

- Does user/PM accept Candidate D local-only semantics for a future adapter
  implementation?
- After this implementation slice, should the route keep Candidate D local-only
  validation until a real hosted or Augnes workspace membership source exists?
- What exact local operator declaration vocabulary is acceptable if Candidate D
  proceeds?
- Should any future Candidate D implementation remain route-only with no
  consumer surface?

Updated answer after user/PM decision: implement Candidate D only as local-only
route validation, preserve no consumer surface, and keep future real auth
separate.

## 22. Validation and smoke plan

Required validation for this PR:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-local-dev-auth-adapter-plan`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-local-dev-auth-adapter-plan`
- `npm run smoke:readonly-api-route-auth-scope-adapter-boundary`
- `npm run smoke:readonly-api-route-auth-source-selection`
- `npm run smoke:readonly-api-route-auth-scope-integration-plan`
- `npm run smoke:readonly-api-route-access-guard`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

Supplemental diagnostics:

- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-user-intent-validation`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`

## 23. Non-goals

- no adapter implementation
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
- no type file change
- no DB query
- no DB schema/migrations
- no secrets/env handling
- no consumer surface
- no UI code
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
