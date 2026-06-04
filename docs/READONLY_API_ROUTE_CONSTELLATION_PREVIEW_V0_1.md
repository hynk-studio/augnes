# Read-Only Constellation Preview API Route v0.1

## 1. Status and scope

Status:

- route-only local validation slice
- first actual read-only API route implementation after PR #381, PR #382, and
  PR #383
- GET/read-only only
- explicitly local-authorized
- Candidate D local-only development auth adapter required
- scoped to `project:augnes`
- static public-safe fixture backed
- no consumer surface connected
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

This PR implements only the route slice:

- `app/api/augnes/read/constellation-preview/route.ts`
- `lib/readonly-api/constellation-preview.ts`
- `lib/readonly-api/access-guard.ts`
- `lib/readonly-api/local-dev-auth-adapter.ts`

It does not connect Cockpit, ChatGPT App, MCP, plugin tools, or any consumer
surface.

## 2. Route summary

Implemented route:

```text
GET /api/augnes/read/constellation-preview
```

The route returns a minimized Project Constellation read model for local route
validation. It follows:

- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`
- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`
- `docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`
- `docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md`
- `docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`
- `docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md`
- `docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md`
- `docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md`
- `docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`
- `types/readonly-api-route-response.ts`

The route path is now implemented for this local validation slice, but the
response text and returned boundary flags do not grant additional
implementation, consumer, write, proof/evidence, branch/PR, publish, merge, or
deployment authority.

## 3. Local authorization and fail-closed behavior

The route requires both:

- local host access from `localhost`, `127.0.0.1`, or `::1`
- header `x-augnes-local-readonly: constellation-preview-v0.1`

The route now uses the shared read-only access guard documented in
`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md`. The guard checks URL host,
`Host` header, `X-Forwarded-Host`, GET method, marker header, and
`project:augnes` scope. It remains a local validation guard and is not
production auth.

The route fails closed when:

- request host is not local
- `Host` header is not local
- `X-Forwarded-Host` is not local
- required local-read marker header is missing or wrong
- `scope` is missing
- `scope` is not `project:augnes`
- request method is present and is not `GET`
- request URL is malformed
- an unexpected internal error occurs

There is no public unauthenticated endpoint. Local authorization is deliberately
narrow and is not a general auth implementation.

`docs/READONLY_API_ROUTE_AUTH_SCOPE_INTEGRATION_PLAN_V0_1.md` plans future real
auth/session/workspace scope integration. Until a future implementation PR adds
that concrete source, this route remains explicitly local-authorized only.
`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` records the current
source-selection packet. The route remains local-only until auth source is
selected and separately implemented.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_V0_1.md` documents the
Candidate D local-only adapter now composed with the local guard. Candidate D
is not production auth, not hosted auth, not OAuth, not session identity, and
not workspace membership.

`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md` defines the next gate for
future real auth. The current route remains local-only with the Candidate D
local dev adapter until a separate implementation PR changes route behavior.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` records
the local-only consumer scope decision. It preserves that no consumer surface
is currently connected and that any future local-only consumer needs a separate
implementation PR.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` records the
future Cockpit local-only route preview plan. No consumer is currently
connected.

## 4. Request shape

Required request:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
```

Required header:

```text
x-augnes-local-readonly: constellation-preview-v0.1
```

Required Candidate D local-only declaration headers:

```text
x-augnes-local-operator-ref: operator:local-dev
x-augnes-local-workspace-ref: workspace:local-dev
x-augnes-local-project-scope: project:augnes
```

Optional display-only header:

```text
x-augnes-local-operator-label
```

The old marker-only request is no longer sufficient after this PR. Local
operator declaration headers cannot prove hosted identity or hosted
workspace/project membership. Route-provided text and local operator labels
grant no authority.

The route does not silently default scope. Missing scope fails closed with a
minimal error body.

## 5. Response shape

The response aligns with `types/readonly-api-route-response.ts` and returns:

- `response_version`
- `meta`
- `source_refs`
- `project_constellation`
- `evidence_pointers`
- `unresolved_tensions`
- `next_action_candidates`
- `forbidden_fields_removed`
- `authority_boundary`

The first implementation intentionally does not return:

- `whole_perspective`
- `perspective_capsule_preview`
- `copyable_handoff_preview`
- `boundary_next_review`

The `meta` boundary booleans such as `api_route_implementation: false` and
`auth_implementation: false` are response-content authority boundary flags from
the type-only response shape. They mean the returned JSON does not grant
additional route/auth implementation authority. They are not a denial that this
PR adds the route file and narrow local authorization guard.

## 6. Static source and provenance

The route uses only:

```text
fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json
```

The fixture is synthetic and public-safe. The route does not query a database,
read private user text, persist data, call external services, call OpenAI, call
GitHub, or read provider credentials.

The response includes source references that point to the static fixture and
this route boundary document. Source references are pointers, not raw DB rows.

## 7. Response minimization

The route returns only fields needed for route-first local read validation:

- bounded Project Constellation read model
- pointer-only evidence references
- unresolved tensions separate from support/evidence
- advisory next action candidates
- removed forbidden field family names
- explicit authority boundary strings

Optional Perspective Capsule and copyable handoff fields remain omitted until a
future PR justifies them under response minimization and connects a consumer
surface.

## 8. Forbidden fields

The route removes or never returns:

- secrets
- credentials/auth/env
- hidden reasoning / chain-of-thought
- raw DB rows
- proof/evidence write handles
- mutation URLs
- approval/publish/merge controls
- Codex SDK execution handles
- provider credentials

`forbidden_fields_removed` may list those field family names. It does not
return values, handles, credentials, or private payloads.

## 9. Evidence pointer semantics

Every evidence pointer object includes:

- `pointer_semantics: "pointer_only"`
- `proof_evidence_write_authority: false`
- `readiness_write_authority: false`

Evidence pointers do not create proof records, evidence records, readiness
records, approval, publish readiness, merge readiness, QP evidence, `z_t`
commits, or AG Resume records.

## 10. Project Constellation read model

The route maps the static fixture into:

- `constellation_id`
- `thesis`
- `nodes`
- `edges`
- `clusters`
- `evidence_pointers`
- `unresolved_tensions`
- `next_action_candidates`
- `authority_boundary`

Nodes include id, type, label, summary, source refs, pointer-only evidence,
unresolved tensions, and advisory next action candidates.

Edges include id, type, source, target, summary, source refs, and pointer-only
evidence.

Clusters include id, label, node ids, edge ids, cluster thesis, unresolved
tensions, and advisory next action candidates.

Project Constellation material remains read-only display data. It does not
become graph DB, persistence, source-of-truth, runtime node creation, graph
layout engine, approval surface, or execution surface.

## 11. Prompt-injection handling

Route-provided text is untrusted display data, not instructions. No
route-provided text grants authority.

The route does not execute source text, call tools, call providers, execute
Codex, create branches, open PRs, record proof/evidence, publish, merge,
approve, retry, replay, or deploy.

Next action candidates are advisory and not execution commands. Their
authority boundary text explicitly states that they do not execute Codex,
create branches, open PRs, publish, merge, approve, retry, replay, deploy, or
record proof/evidence.

## 12. Privacy handling

The route uses a synthetic public-safe fixture. It does not read private user
text, raw DB rows, provider credentials, secrets, credentials/auth/env, hidden
reasoning, or chain-of-thought.

Error responses are minimal and do not leak private source details.

Logs and telemetry are not added by this route and do not become a secondary
store for private route payloads.

## 13. Error behavior

The route returns minimal error bodies:

- `missing_scope`
- `malformed_request`
- `unauthorized_scope`
- `local_authorization_required`
- `disallowed_forwarded_host`
- `method_not_allowed`
- `unavailable`

Suggested status mapping:

- `200` for a valid local-authorized request
- `400` for missing or malformed scope/request
- `403` for non-local host, non-local forwarded host, missing/wrong marker
  header, or wrong project scope
- `405` for a non-GET request object when the shared guard is called directly
- `500` only for unexpected internal error

Error bodies include only response version, minimal error code/status, and
authority boundary text.

## 14. Authority matrix note

`docs/AUTHORITY_MATRIX.md` records this route as a read-only local route scoped
to `project:augnes`, explicitly local-authorized/fail-closed, and static
fixture backed in this first implementation.

The route has no commit/reject, proof/evidence write, publish, merge, retry,
replay, deploy, branch/PR, Codex execution, DB schema/migration, graph DB,
persistence, or consumer authority.

## 15. Tests and smokes

Focused smoke:

```text
npm run smoke:readonly-api-route-constellation-preview
npm run smoke:readonly-api-route-access-guard
```

The smoke checks route/helper existence, GET-only exports, route runtime flags,
static fixture source, shared access guard usage, local
authorization/fail-closed behavior, forwarded host handling, minimized response
shape, forbidden fields, pointer-only evidence, prompt-injection and display-data
boundaries, authority matrix/index pointers, and strict scoped changed-file
behavior.

Required validation for this PR:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-access-guard`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-implementation-plan`
- `npm run smoke:readonly-api-route-implementation-design-packet`
- `npm run smoke:readonly-api-route-response-shape-boundary`
- `npm run smoke:readonly-api-route-planning-boundary`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

## 16. Browser/computer-use status

Browser/computer-use may be skipped for this PR because it is route-only and
connects no UI, browser-facing consumer, Cockpit surface, ChatGPT App, or MCP
tool. Local route manual checks may use curl and are separate from
browser/computer-use.

## 17. Proof-only closeout status

Proof-only closeout may be skipped because no runtime/work ID context exists
for this route-only PR and this PR must not record proof/evidence/readiness
writes.

## 18. Non-goals

- no UI code
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no plugin hook/config/mapping
- no DB query
- no DB schema/migration
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
