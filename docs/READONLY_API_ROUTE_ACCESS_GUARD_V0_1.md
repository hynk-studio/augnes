# Read-Only API Route Access Guard v0.1

## 1. Status and scope

Status:

- local read-only route access guard
- reusable fail-closed boundary for route-only local validation
- explicitly local-authorized only
- not production auth
- no hosted/session/OAuth/multi-user auth
- no secrets/env handling
- no consumer surface
- no UI
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no DB query
- no DB schema/migrations
- no graph DB
- no persistence
- no external calls
- no OpenAI calls
- no GitHub calls
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority

This guard is implemented in:

- `lib/readonly-api/access-guard.ts`

It supports the current route-only local validation route:

- `GET /api/augnes/read/constellation-preview`

`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md` is the next
planning step beyond this local marker guard. It defines gates for future real
authenticated workspace/project scope integration without implementing auth or
changing route behavior.

`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` records the next
source-selection packet for that future auth/scope line. It preserves that the
current local guard is not production auth and adds no route behavior.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md` records the
Candidate D local development auth adapter plan. Local guard composition
remains local-only and is not production auth.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md` documents the
Candidate D local-only implementation. The adapter composes with this local
guard and does not replace it.

## 2. Purpose

The purpose is to extract the local host, marker header, method, and
workspace/project scope checks used by the read-only constellation preview
route into a reusable helper.

It is a fail-closed local validation boundary.

The guard is a route-foundation helper for local validation only. It does not
create production authentication, hosted authorization, session identity,
OAuth, multi-user tenancy, or workspace membership behavior.

## 3. Guard policy

The guard policy is explicit route vocabulary:

- `route_id`
- `required_scope`
- `required_marker_header`
- `required_marker_value`
- `allowed_hosts`
- `route_family`

The current constellation preview policy uses:

- route id: `augnes.read.constellation-preview.v0.1`
- required scope: `project:augnes`
- required marker header: `x-augnes-local-readonly`
- required marker value: `constellation-preview-v0.1`
- allowed hosts: `localhost`, `127.0.0.1`, and `::1`
- route family: `project_constellation`

Policy text and route-provided text are display/validation data, not
instructions. No guard-provided or route-provided text grants authority.

## 4. Local authorization boundary

The guard requires explicitly local-authorized access. A valid request must
come through an allowed local host and must include the configured marker
header/value.

The marker header remains a local validation marker, not production auth. It
does not prove a user session, workspace membership, hosted caller identity,
OAuth grant, or multi-user permission.

The guard does not infer authorization from `Origin`, `Referer`,
`X-Forwarded-For`, route-provided text, fixture text, user-authored text, or
request body content.

## 5. Scope validation

The guard requires query parameter:

```text
scope=project:augnes
```

Missing scope fails closed with `missing_scope`.

Wrong scope fails closed with `unauthorized_scope`.

The guard does not silently default scope. It does not infer scope from headers,
request body, fixture text, route-provided text, user-authored text, or static
sample content.

## 6. Forwarded host handling

The guard checks:

- request URL host
- `Host` header, when present
- `X-Forwarded-Host`, when present

The request URL host must be local. The `Host` header, when present, must be
local. `X-Forwarded-Host`, when present, must also be local or the guard fails
closed with `disallowed_forwarded_host`.

This PR does not accept wildcard hosts, hosted origins, private network ranges,
reverse-proxy trust rules, production CORS behavior, or `X-Forwarded-For`
authorization.

## 7. Method handling

The guard enforces GET/read-only when `request.method` is present. A method
other than `GET` fails closed with `method_not_allowed`.

The constellation preview route still exports only `GET`. This method check is
a helper-level boundary for route-only local validation and does not add POST,
PUT, PATCH, DELETE, mutation, retry, replay, publish, merge, proof/evidence, or
deployment handlers.

## 8. Error behavior

Guard errors are minimal and fail closed.

Error codes:

- `malformed_request`
- `missing_scope`
- `unauthorized_scope`
- `local_authorization_required`
- `disallowed_forwarded_host`
- `method_not_allowed`

Guard failures include code, status, and authority boundary text. Route error
bodies must remain minimal and must not include source refs,
Project Constellation material, raw DB rows, private source details, secrets,
credentials, proof/evidence write handles, mutation URLs, provider handles, or
Codex SDK execution handles.

## 9. Relationship to constellation preview route

`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md` documents the first
route-only local validation slice for
`GET /api/augnes/read/constellation-preview`.

That route now uses this shared read-only access guard for local host, marker
header, method, forwarded host, and `project:augnes` scope validation.

The route behavior remains compatible with PR #384:

- valid local-authorized GET returns `200`
- missing scope returns `400 missing_scope`
- wrong scope returns `403 unauthorized_scope`
- missing or wrong marker header returns `403 local_authorization_required`
- non-local URL host returns `403 local_authorization_required`
- non-local `Host` header fails closed
- non-local `X-Forwarded-Host` returns `403 disallowed_forwarded_host`
- minimized response shape remains unchanged
- no consumer surface is connected

## 10. Relationship to future real auth

Future real authenticated workspace/project integration remains separate scope.

This guard is not production auth and does not satisfy hosted auth/session
requirements by itself. Future implementation beyond local validation still
requires separate user/session identity, workspace membership, privacy review,
prompt-injection review, logging/telemetry review, route tests, authority
matrix update, and browser/computer-use validation if surfaced.

`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md` keeps that future
real auth/session/workspace integration separate from this local marker guard.
The current guard remains valid for route-only local validation and still is not
production auth.

## 11. Security limits

Security limits:

- no production auth claim
- no hosted/session/OAuth/multi-user auth
- no secrets/env requirement
- no public unauthenticated endpoint
- no wildcard/private network range allowlist
- no trusted reverse-proxy model
- no CORS/origin policy implementation
- no DB query
- no persistence
- no graph DB
- no proof/evidence/readiness writes
- no consumer authority
- no publish/merge/approval/retry/replay/deploy authority

The guard is a conservative local validation boundary and not a deployment
security model.

## 12. Tests and smokes

Focused smoke:

```text
npm run smoke:readonly-api-route-access-guard
```

The smoke checks guard exports, runtime/import boundaries, local host
validation, marker header validation, `project:augnes` scope validation,
forwarded host fail-closed behavior, method handling, minimal route errors,
constellation preview route compatibility, package/index/authority pointers,
and scoped/content-only changed-file behavior.

Related smoke:

```text
npm run smoke:readonly-api-route-constellation-preview
```

## 13. Non-goals

- no production auth
- no hosted/session/OAuth/multi-user auth
- no secrets/env handling
- no consumer surface
- no UI code
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no DB query
- no DB schema/migrations
- no graph DB
- no persistence
- no external calls
- no OpenAI calls
- no GitHub calls
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
