# Read-Only API Route Auth Scope Adapter Boundary v0.1

## 1. Status and scope

Status:

- type/docs/smoke/package-pointer only
- type-only auth/scope adapter boundary
- no auth implementation
- no production auth
- no hosted auth
- no OAuth
- no session identity implementation
- no workspace membership implementation
- no runtime schema
- no API route behavior change
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

This boundary defines type vocabulary for a future fail-closed auth/scope
adapter for:

```text
GET /api/augnes/read/constellation-preview
```

The current route remains local-only until a separate implementation PR changes
it.

## 2. Purpose

The purpose is to create a type-only vocabulary and review boundary before any
future auth/scope adapter implementation. The type file is:

```text
types/readonly-api-auth-scope.ts
```

The boundary records the request, decision, success, failure, error-code,
identity, workspace, project, source-kind, forbidden-field, and authority
boundary vocabulary that future implementation must satisfy. It does not
validate requests, resolve sessions, prove identity, prove workspace/project
membership, query records, read secrets, or change route behavior.

## 3. Relationship to source selection

`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` selected Candidate E:
keep the route local-only and defer real auth source selection because no
current repo-local source proves both caller identity and workspace/project
membership for this route line.

This adapter boundary is the recommended next artifact after Candidate E. It
does not select a concrete source. Future implementation still requires a
concrete source selected by user/PM before route behavior changes.
In exact boundary terms, future implementation still requires a concrete source selected by user/PM.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md` maps Candidate D
to this type boundary at planning level only. It is docs/smoke/package-pointer
only, adds no adapter implementation, and preserves that Candidate D is
local-only and not production auth.

## 4. Type boundary overview

`types/readonly-api-auth-scope.ts` exports type/interface vocabulary only.

Required exports:

- `ReadonlyApiAuthScopeAdapterBoundaryV0`
- `ReadonlyApiAuthScopeRequestV0`
- `ReadonlyApiAuthScopeDecisionV0`
- `ReadonlyApiAuthScopeSuccessV0`
- `ReadonlyApiAuthScopeFailureV0`
- `ReadonlyApiAuthScopeErrorCodeV0`
- `ReadonlyApiAuthScopeIdentityRefV0`
- `ReadonlyApiAuthScopeWorkspaceRefV0`
- `ReadonlyApiAuthScopeProjectRefV0`
- `ReadonlyApiAuthScopeSourceKindV0`
- `ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0`
- `ReadonlyApiAuthScopeForbiddenFieldV0`

The type file has no runtime imports. It is not runtime schema, not DB schema,
not API contract, not auth implementation, not source-of-truth, and not
consumer authority.

## 5. Request type boundary

`ReadonlyApiAuthScopeRequestV0` defines a future adapter input vocabulary:

- `route_id`
- `route_family`
- `requested_scope`
- `requested_project`
- `requested_workspace`
- `request_method`
- optional `local_guard_result_ref`
- `source_kind`

The request type does not parse HTTP requests, read headers, read bodies,
validate methods, infer workspace/project scope, query sessions, or invoke the
local access guard. It is vocabulary only.

## 6. Decision type boundary

`ReadonlyApiAuthScopeDecisionV0` is a discriminated union of:

- `ReadonlyApiAuthScopeSuccessV0`
- `ReadonlyApiAuthScopeFailureV0`

The union represents planned fail-closed decision shape. It does not implement
decision logic, authentication, authorization, session lookup, workspace lookup,
project lookup, or route behavior.

## 7. Success result boundary

`ReadonlyApiAuthScopeSuccessV0` includes:

- `ok: true`
- `route_id`
- `route_family`
- `identity_ref`
- `workspace_ref`
- `project_ref`
- `authorized_scope`
- `source_kind`
- `local_guard_composed`
- `authority_boundary`
- `forbidden_fields_removed`

A future success result must only contain bounded references and safe labels.
It must not return secrets, session secrets, OAuth tokens, credentials,
raw private membership graphs, raw DB rows, raw private user text,
provider credentials, mutation URLs, proof/evidence write handles, Codex SDK
execution handles, or approval/publish/merge controls.

## 8. Failure result boundary

`ReadonlyApiAuthScopeFailureV0` includes:

- `ok: false`
- `code`
- `status`
- `safe_error_label`
- `authority_boundary`
- `forbidden_fields_removed`

Failure results must fail closed and remain minimal. They must not leak source
details, private route payloads, session secrets, OAuth tokens, provider
credentials, raw DB rows, raw membership graphs, or route-provided text.

## 9. Error code boundary

`ReadonlyApiAuthScopeErrorCodeV0` includes:

- `missing_identity`
- `invalid_identity`
- `missing_session`
- `invalid_session`
- `missing_workspace`
- `unauthorized_workspace`
- `missing_project`
- `unauthorized_project`
- `missing_scope`
- `ambiguous_scope`
- `stale_scope`
- `cross_workspace_scope`
- `unavailable_auth_source`
- `malformed_request`
- `method_not_allowed`
- `local_guard_failed`
- `forbidden_field_detected`

These codes are planned vocabulary only. They do not create route responses,
status handling, logging, session behavior, workspace behavior, or DB queries.

## 10. Identity/workspace/project refs

Reference types:

- `ReadonlyApiAuthScopeIdentityRefV0`
- `ReadonlyApiAuthScopeWorkspaceRefV0`
- `ReadonlyApiAuthScopeProjectRefV0`

These refs must remain bounded references and proof labels. They must not
return raw identity payloads, raw workspace membership graphs, raw project
payloads, credentials, session secrets, OAuth tokens, or raw private user text.

## 11. Source kind boundary

`ReadonlyApiAuthScopeSourceKindV0` includes:

- `local_guard_only`
- `augnes_local_session_candidate`
- `local_operator_session_candidate`
- `chatgpt_app_mcp_context_candidate`
- `local_development_auth_adapter_candidate`
- `future_external_auth_candidate`

Source kinds are candidate vocabulary. They do not select a source, implement a
source, create hosted auth, create OAuth, create sessions, or prove workspace
membership.

## 12. Forbidden fields boundary

`ReadonlyApiAuthScopeForbiddenFieldV0` includes:

- `secrets`
- `credentials/auth/env`
- `raw DB rows`
- `raw private user text`
- `hidden reasoning / chain-of-thought`
- `proof/evidence write handles`
- `mutation URLs`
- `approval/publish/merge controls`
- `Codex SDK execution handles`
- `provider credentials`
- `session secrets`
- `OAuth tokens`
- `workspace private membership graph`

Forbidden fields must be removed or never returned. No route-provided text
grants authority.

## 13. Local guard composition boundary

The current local guard remains documented by
`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`.

The local guard may compose but cannot replace real auth. A future adapter
must define whether the local guard remains an additional local-development
gate, a route-first validation gate, or a separate precondition. The marker
header and local host checks are not production auth, not hosted auth, not
OAuth, not session identity, and not workspace membership.

There must be no public unauthenticated endpoint.

## 14. Future implementation requirements

Future implementation still requires:

- concrete auth/session/workspace source selected by user/PM
- route-level adapter implementation in a separate scoped PR
- fail-closed auth/session/workspace evidence
- privacy review
- prompt-injection review
- logging/telemetry review
- response minimization recheck
- authority matrix update
- focused route/auth smokes
- no consumer surface unless separately approved

This type boundary does not satisfy those implementation requirements by
itself.

## 15. Future smoke requirements

Future implementation smokes should verify:

- missing identity fails closed
- invalid identity fails closed
- missing session fails closed
- invalid session fails closed
- missing workspace fails closed
- unauthorized workspace fails closed
- missing project fails closed
- unauthorized project fails closed
- missing scope fails closed
- ambiguous scope fails closed
- stale scope fails closed
- cross-workspace scope fails closed
- unavailable auth source fails closed
- malformed request fails closed
- method mismatch fails closed
- local guard failure is preserved if composed
- forbidden fields are removed or never returned
- no mutation/control handles
- no public unauthenticated endpoint

These smokes are future implementation requirements, not implemented here.

## 16. Authority and non-authority boundary

Authority boundary:

- type-only
- not runtime schema
- not auth implementation
- not production auth
- not hosted auth
- not OAuth
- not session identity implementation
- not workspace membership implementation
- not route behavior change
- not consumer authority
- not proof/evidence write authority
- not DB query authority
- not source-of-truth
- no route behavior change
- no consumer surface
- no DB query
- no secrets/env handling
- no proof/evidence/readiness writes
- no Codex SDK execution
- no graph DB
- no persistence
- no merge/publish/approval/retry/replay/deploy authority

Evidence pointers remain pointer-only. No route-provided text grants authority.

## 17. Validation and smoke plan

Required validation for this packet:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-auth-scope-adapter-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-auth-scope-adapter-boundary`
- `npm run smoke:readonly-api-route-auth-source-selection`
- `npm run smoke:readonly-api-route-auth-scope-integration-plan`
- `npm run smoke:readonly-api-route-access-guard`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

Browser/computer-use may be skipped because this PR is
type/docs/smoke/package-pointer only and touches no UI/browser-facing files.

Local route manual check may be skipped because this PR does not change route
behavior.

Proof-only closeout may be skipped when no runtime/work ID context exists and
this PR must not record proof/evidence/readiness writes.

## 18. Non-goals

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
