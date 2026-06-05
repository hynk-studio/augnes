# Read-Only API Route Local Dev Auth Adapter v0.1

## 1. Status and scope

Status:

- Candidate D local-only adapter implementation
- strict debug mode route validation implementation
- default local preview does not require these declaration headers
- not production auth
- not hosted auth
- not OAuth
- not session identity
- not workspace membership
- no secrets/env handling
- no DB query
- no DB schema/migrations
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

This implementation adds:

- `lib/readonly-api/local-dev-auth-adapter.ts`

It composes with:

- `lib/readonly-api/access-guard.ts`
- `lib/readonly-api/constellation-preview.ts`
- `app/api/augnes/read/constellation-preview/route.ts`

Candidate D is implemented only as optional local-only strict debug validation.
It does not connect a consumer surface and is not required for the default
local Project Constellation preview.

`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md` defines the next gate
for any future real hosted/session/workspace auth implementation. Candidate D
remains local-only and is not the real auth gate.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` defines
the local-only consumer scope decision after the real auth gate. It preserves
that Candidate D remains local-only and not production auth, and it does not
connect a consumer.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` defines the
future Cockpit local-only route preview plan. Candidate D remains local-only
and not production auth.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md` documents the
Cockpit local-only route preview implementation that consumes this local-only
route line. Candidate D local-only semantics remain unchanged: not production
auth, not hosted auth, not session identity, and not workspace membership.

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` records the
closed local-only route/Cockpit consumer milestone. Candidate D remains
local-only and not production auth after the closeout.

## 2. Route and adapter summary

The route remains:

```text
GET /api/augnes/read/constellation-preview
```

The route still requires:

- local URL host
- local `Host` header when present
- local `X-Forwarded-Host` when present
- GET method
- `x-augnes-local-readonly: constellation-preview-v0.1`
- `scope=project:augnes`

Strict debug mode additionally requires a Candidate D local operator
declaration. The declaration is local-only and is not production auth, hosted
auth, OAuth, session identity, or workspace membership.

There is no public unauthenticated endpoint.
The local operator declaration cannot prove hosted identity or hosted
workspace/project membership.

## 3. Local-only declaration headers

Strict debug declaration headers:

```text
x-augnes-local-operator-ref: operator:local-dev
x-augnes-local-workspace-ref: workspace:local-dev
x-augnes-local-project-scope: project:augnes
```

Optional display-only header:

```text
x-augnes-local-operator-label
```

If the optional label is present, the adapter trims and bounds it as a safe
short string. The label is display data only. It does not grant authority, does
not prove hosted identity, does not prove workspace/project membership, and is
not used to infer scope.

No tokens, passwords, bearer credentials, secrets, env variables, OAuth tokens,
session secrets, or provider credentials are used.

## 4. Relationship to existing local guard

The local dev adapter composes with the existing local guard only when strict
debug mode is requested. It does not replace the local guard.

The strict debug validation order is:

1. Run `validateReadonlyApiLocalAccess`.
2. If the local guard fails, preserve existing fail-closed route behavior.
3. If the local guard passes and strict mode is requested, run
   `validateReadonlyApiLocalDevAuthAdapter`.
4. Return strict-mode success only when both pass.

The current local guard remains local-only and not production auth. The
Candidate D adapter remains local-only and not production auth.

## 5. Relationship to type-only auth/scope adapter boundary

This implementation maps Candidate D to the type vocabulary in:

```text
types/readonly-api-auth-scope.ts
docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md
```

The adapter imports that vocabulary as type-only. It returns the planned
`ReadonlyApiAuthScopeDecisionV0` shape for local-only validation. The route
does not return the full auth decision payload in successful responses.

## 6. Success decision mapping

A successful local dev adapter decision maps to:

- `ok: true`
- `route_id: augnes.read.constellation-preview.v0.1`
- `route_family: project_constellation`
- `source_kind: local_development_auth_adapter_candidate`
- `authorized_scope: project:augnes`
- `local_guard_composed: true`
- `identity_ref.identity_ref: operator:local-dev`
- `identity_ref.identity_source_kind: local_development_auth_adapter_candidate`
- `identity_ref.identity_proof_label: local_development_declaration_only`
- `identity_ref.raw_identity_payload_returned: false`
- `workspace_ref.workspace_ref: workspace:local-dev`
- `workspace_ref.workspace_source_kind: local_development_auth_adapter_candidate`
- `workspace_ref.membership_proof_label: local_project_scope_declaration_only`
- `workspace_ref.raw_membership_graph_returned: false`
- `project_ref.project_ref: project:augnes`
- `project_ref.project_scope: project:augnes`
- `project_ref.project_source_kind: local_development_auth_adapter_candidate`
- `project_ref.membership_proof_label: local_project_scope_declaration_only`
- `project_ref.raw_project_payload_returned: false`
- `forbidden_fields_removed`
- `authority_boundary`

The success mapping is local-only. It cannot prove hosted caller identity and
cannot prove hosted workspace/project membership.

## 7. Failure decision mapping

Adapter failures fail closed with minimal safe labels:

- missing local operator identity header: `missing_identity`, `403`
- invalid local operator identity header: `invalid_identity`, `403`
- missing workspace declaration header: `missing_workspace`, `403`
- invalid workspace declaration header: `unauthorized_workspace`, `403`
- missing project scope declaration header: `missing_project`, `403`
- wrong project scope declaration header: `unauthorized_project`, `403`
- local guard failure in direct adapter calls: `local_guard_failed`

Existing local guard failures keep their current route-level codes where
applicable:

- `missing_scope`
- `unauthorized_scope`
- `local_authorization_required`
- `disallowed_forwarded_host`
- `method_not_allowed`
- `malformed_request`

Route error bodies remain minimal:

- `response_version`
- `error: code/status`
- `authority_boundary`

Error bodies do not include source refs, Project Constellation material, auth
decision payloads, raw private data, or private source details.

## 8. Route behavior compatibility

The successful default route response remains minimized and returns:

- `response_version`
- `boundary_class`
- `meta`
- `source_refs`
- `project_constellation`
- `evidence_pointers`
- `unresolved_tensions`
- `next_action_candidates`

The successful route response does not return:

- full auth decision payload
- `perspective_capsule_preview`
- `copyable_handoff_preview`
- `whole_perspective`
- consumer-specific fields
- mutation handles
- proof/evidence write handles

The marker-only local request is sufficient by default. Strict debug mode
marker-only requests fail closed with `missing_identity`.

## 9. Response minimization

The adapter validates local-only declarations only in strict debug mode and
does not add auth payloads to the route response. Successful responses remain
Project Constellation read-model responses from the static public-safe
fixture.

The adapter returns bounded decision data internally for validation only. Route
responses do not expose raw identity payloads, raw membership graphs, raw
project payloads, or local operator label authority.

## 10. Forbidden fields

The adapter and route remove or never return:

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

## 11. Privacy and prompt-injection handling

Route-provided text, fixture text, local operator labels, project labels,
capsule text, evidence pointer labels, and user-authored records are untrusted
display data.

No route-provided text grants authority. No local operator label grants
authority. No declaration header text grants hosted identity, workspace
membership, proof/evidence authority, Codex execution authority, branch/PR
authority, merge authority, publish authority, retry/replay authority, or
deploy authority.

## 12. Logging and telemetry handling

This implementation adds no logging or telemetry store. Future logging must not
become a secondary store for private route payloads, local operator
declarations, session secrets, OAuth tokens, provider credentials, raw DB rows,
or private membership graphs.

## 13. Authority matrix note

The local dev adapter implementation is local-only and grants no production
auth, hosted auth, OAuth, session identity, workspace membership, consumer
authority, write authority, proof/evidence authority, DB query authority, graph
DB authority, persistence authority, publish authority, merge authority,
retry/replay/deploy authority, approval authority, branch/PR authority, or
Codex execution authority.

## 14. Tests and smokes

Focused smoke:

```text
npm run smoke:readonly-api-route-local-dev-auth-adapter
```

Related smokes:

```text
npm run smoke:readonly-api-route-constellation-preview
npm run smoke:readonly-api-route-access-guard
npm run smoke:readonly-api-route-local-dev-auth-adapter-plan
npm run smoke:readonly-api-route-local-only-consumer-scope-decision
npm run smoke:cockpit-local-only-constellation-route-preview-plan
```

## 15. Browser/computer-use status

Browser/computer-use may be skipped for this PR because it is route-only and
connects no UI/browser-facing consumer. No screenshots or browser reports are
required for this implementation slice.

## 16. Local route manual check status

Local route manual checks should use both the existing local read marker and
the Candidate D local operator declaration headers. Marker-only requests should
fail closed after this PR.

## 17. Proof-only closeout status

Proof-only closeout may be skipped when no runtime/work ID context exists. This
PR must not record proof/evidence/readiness writes.

## 18. Non-goals

- no production auth
- no hosted auth
- no OAuth
- no session identity implementation
- no workspace membership implementation
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
