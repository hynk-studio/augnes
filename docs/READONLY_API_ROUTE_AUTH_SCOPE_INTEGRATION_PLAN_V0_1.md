# Read-Only API Route Auth Scope Integration Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- auth/scope integration planning only
- no production auth implementation
- no hosted auth
- no OAuth
- no session identity implementation
- no multi-user tenancy implementation
- no workspace membership implementation
- no secrets/env handling
- no API route behavior change
- no route file change
- no route handler change
- no DB query
- no DB schema/migrations
- no graph DB
- no persistence
- no external calls
- no OpenAI calls
- no GitHub calls
- no consumer surface
- no UI
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority

This plan applies to the future real authenticated workspace/project scope
integration for:

```text
GET /api/augnes/read/constellation-preview
```

It does not change that route in this PR.

## 2. Purpose

The purpose is to define the next implementation plan and gates for replacing
or wrapping the local validation guard from
`docs/READONLY_API_ROUTE_ACCESS_GUARD_V0_1.md` with a real authenticated
workspace/project scope source in a later PR.

This plan uses `docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md` as the
current route baseline. It answers the next PM/user judgment question at
planning level only: which auth/session/workspace source should govern the
read-only route before any consumer surface connects.

`docs/READONLY_API_ROUTE_AUTH_SOURCE_SELECTION_V0_1.md` is the next step
before any auth/scope adapter implementation. It inspects repo-local
session/workspace/auth-adjacent surfaces and records source selection at
planning level only, without implementing auth or changing route behavior.

`docs/READONLY_API_ROUTE_AUTH_SCOPE_ADAPTER_BOUNDARY_V0_1.md` and
`types/readonly-api-auth-scope.ts` define type vocabulary only for a future
fail-closed adapter. They do not implement auth, session identity, workspace
membership, or route behavior.

`docs/READONLY_API_ROUTE_LOCAL_DEV_AUTH_ADAPTER_PLAN_V0_1.md` maps Candidate D
to the type-only adapter boundary at planning level only. Candidate D remains
local-only and future real auth remains separate.

## 3. Current local guard baseline

PR #384 implemented the first route-only local read validation slice for:

```text
GET /api/augnes/read/constellation-preview
```

PR #385 extracted the current local guard into
`lib/readonly-api/access-guard.ts`.

Current baseline:

- GET/read-only route only
- no consumer surface
- `scope=project:augnes` required
- URL host must be local
- `Host` header, when present, must be local
- `X-Forwarded-Host`, when present, must be local
- marker header `x-augnes-local-readonly: constellation-preview-v0.1` required
- static public-safe fixture only
- no DB query
- no external calls
- no persistence
- minimized response aligned with `types/readonly-api-route-response.ts`

The current local guard remains valid for route-only local validation. It is
explicitly local-authorized only. It is not production auth, not hosted auth,
not hosted/session/OAuth/multi-user auth, not workspace membership, not
secrets/env handling, and not a consumer surface.

## 4. Real auth/scope integration thesis

The thesis is:

- keep the current route local-only until a concrete auth/session/workspace
  source is selected
- separate future real auth/session/workspace integration from the local marker
  guard
- preserve the existing `project:augnes` route behavior until a user/PM supplies
  a real workspace/project scope source
- fail closed for any missing, stale, ambiguous, unavailable, or unauthorized
  identity/scope condition
- connect no Cockpit, ChatGPT App, MCP, plugin tool, or browser-facing consumer
  until route-level auth/scope smokes pass

This plan is planning-only and does not implement auth/session/workspace
behavior.

## 5. Candidate authenticated scope source

This repo does not yet have a confirmed production auth/session/workspace source
for this route line. The plan therefore defines options rather than
implementation:

| Option | Candidate source | Fit | Risks | Decision |
| --- | --- | --- | --- | --- |
| Option A | Existing Augnes local session/workspace model, if a concrete source is identified. | Could reuse a repo-local model if it has explicit project membership semantics. | Source may not exist or may not match route security needs. | Do not choose until concrete source and tests are identified. |
| Option B | Local runtime operator session binding, route-only and local. | Could preserve route-only validation while adding a stronger operator identity concept. | Still local-oriented; may not become production auth. | Possible future local-only implementation if PM accepts local scope. |
| Option C | Future hosted ChatGPT App/MCP authenticated context. | Could align with future consumer surfaces. | Not implemented now; consumer coupling can blur route-level validation. | Defer until a consumer/auth source is selected in separate scope. |
| Option D | Explicit local development auth adapter, not production auth. | Could make local development intent clearer than a marker header alone. | Still not production auth; could be misread as sufficient for hosted use. | Possible but should remain clearly local-only. |
| Option E | Defer consumer auth and keep route local-only until a real source exists. | Safest because it avoids inventing auth without a concrete source. | Slower path to hosted/consumer use. | Recommended default. |

Recommended default: use Option E for now. Keep the route local-only and create
a separate implementation PR only after a concrete auth/session/workspace source
is selected. This is boring, which is exactly why it is safe.

## 6. Session identity plan

Future implementation must identify a concrete session identity source before
route behavior changes.

The future PR must answer:

- where session identity comes from
- whether the source is local-only, hosted, ChatGPT App, MCP, or Augnes runtime
- how missing session fails closed
- how invalid session fails closed
- how stale session fails closed
- how unavailable auth source fails closed
- how session errors avoid leaking private route source details

This planning PR does not implement session identity.

## 7. Workspace/project membership plan

Future implementation must identify a concrete workspace/project membership
source before route behavior changes.

The future PR must answer:

- how workspace is identified
- how project is identified
- how workspace/project membership is checked
- how `project:augnes` maps to real membership
- how unauthorized workspace fails closed
- how unauthorized project fails closed
- how cross-workspace scope fails closed
- how ambiguous scope fails closed

Keep `project:augnes` as the default route scope until a user/PM supplies a real
workspace/project scope source.

## 8. Request scope validation plan

Future implementation must continue to require explicit request scope. It must
not silently infer workspace/project scope from:

- route-provided text
- fixture text
- user-authored text
- headers other than explicitly reviewed auth/session headers
- request body text
- prompt or capsule text
- evidence pointer labels
- next action candidate text

The future route must validate the requested scope against the selected
auth/session/workspace source and must fail closed when scope is missing,
stale, ambiguous, unauthorized, unavailable, or cross-workspace.

## 9. Fail-closed behavior plan

Future implementation must fail closed for:

- missing identity
- missing workspace
- missing project
- unauthorized workspace
- unauthorized project
- stale scope
- ambiguous scope
- cross-workspace scope
- invalid session
- missing session
- unavailable auth source
- missing scope
- malformed request
- method mismatch
- non-local-only development gate mismatch, if retained

Error bodies must remain minimal and must not include source refs,
Project Constellation material, raw DB rows, private source details, secrets,
credentials, proof/evidence write handles, mutation URLs, provider handles, or
Codex SDK execution handles.

## 10. Local guard transition plan

Future real auth/session/workspace integration must be separate from the local
marker guard. The local guard may remain as an additional local-development
gate only if the future implementation documents how it composes with real
auth.

The local marker guard must not replace real auth. It must not be described as
production auth, hosted auth, session identity, workspace membership,
multi-user tenancy, OAuth, or consumer authorization.

There must be no public unauthenticated endpoint.

No secrets/env requirement is added in this planning PR. Future implementation
may require secrets/env only in a separate scoped implementation PR with
secret-handling review.

## 11. Route compatibility plan

Until a future implementation PR changes route behavior, the current route
must remain compatible with PR #384 and PR #385:

- valid local-authorized GET still returns `200`
- missing marker header still fails closed
- wrong scope still fails closed
- missing scope still fails closed
- non-local URL host still fails closed
- non-local `Host` header still fails closed
- non-local `X-Forwarded-Host` still fails closed
- response shape remains minimized
- no `perspective_capsule_preview`
- no `copyable_handoff_preview`
- no consumer surface

No Cockpit, ChatGPT App, MCP, or consumer should be connected in the auth
integration PR unless PM explicitly selects a first consumer in a later scope.

## 12. Response minimization impact

Auth/scope integration must not expand response payloads by default.

Future implementation should return only fields required for read-only decision
support and may add at most bounded auth/scope metadata needed for debugging or
review. It must not return raw DB rows, raw private user text beyond explicitly
scoped records, secrets, credentials/auth/env, mutation URLs,
proof/evidence/write handles, approval/publish/merge controls, Codex SDK
execution handles, provider credentials, or hidden reasoning.

The current minimized response profile remains the baseline.

## 13. Prompt-injection and privacy impact

Auth/scope integration must preserve the rule that route-provided text is
untrusted display data, not instructions.

Future implementation must not infer identity, workspace, project, or authority
from user-authored text, Project Constellation text, fixture text, capsule text,
handoff text, evidence pointer labels, unresolved tension text, or next action
candidate text.

Privacy review must verify that auth/session errors do not reveal whether
private projects, workspaces, records, or fixture-derived source targets exist.

## 14. Logging and telemetry impact

Future implementation must define what auth/scope metadata is logged and why.

Logs and telemetry must not become a secondary store for private route payloads,
raw private user text, secrets, credentials/auth/env, provider credentials, raw
DB rows, hidden reasoning, proof/evidence write handles, mutation URLs, or
Codex SDK execution handles.

This planning PR does not add logging or telemetry behavior.

## 15. Authority matrix impact

This plan adds no authority. It does not implement production auth, hosted auth,
session identity, workspace membership, consumer authority, write authority,
proof/evidence authority, Codex execution, DB query, graph DB, persistence,
publish, merge, retry, replay, deploy, or approval authority.

`docs/AUTHORITY_MATRIX.md` should treat this plan as a non-authoritative
planning pointer only.

## 16. Future implementation slices

Future slices:

- Slice 1: identify concrete auth/session/workspace source, no route behavior
  change
- Slice 2: type-only auth/scope decision boundary, if needed
- Slice 3: route-level auth/scope adapter implementation
- Slice 4: fail-closed auth/scope smoke
- Slice 5: response minimization recheck
- Slice 6: prompt-injection/privacy/logging recheck
- Slice 7: local route manual checks
- Slice 8: browser/computer-use only if a consumer is surfaced
- Slice 9: consumer selection PR, separate from auth/scope integration unless
  PM decides otherwise

These are future slices, not implemented now.

## 17. Future tests and smokes

Future implementation PRs should run or add:

- `npm run typecheck`
- focused auth/scope integration smoke
- fail-closed missing identity smoke
- fail-closed missing session smoke
- fail-closed invalid session smoke
- fail-closed missing workspace smoke
- fail-closed missing project smoke
- fail-closed unauthorized workspace smoke
- fail-closed unauthorized project smoke
- fail-closed cross-workspace scope smoke
- fail-closed unavailable auth source smoke
- workspace/project scope smoke
- response minimization smoke
- forbidden fields smoke
- prompt-injection display-data smoke
- privacy/logging smoke
- local route manual checks
- browser/computer-use report only if surfaced in UI/App/MCP
- `git diff --check`
- `git diff --cached --check`

Do not add these runtime/auth smokes in this planning PR.

## 18. Browser/computer-use plan

Browser/computer-use may be skipped for this planning PR because it is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Future browser/computer-use validation is required only if a consumer surface is
connected or if auth/session behavior is surfaced in UI, ChatGPT Apps, MCP
tools, or browser-facing previews.

## 19. Proof-only closeout plan

Proof-only closeout may be skipped for this planning PR when no runtime/work ID
context exists and the PR must not record proof/evidence/readiness writes.

Future implementation PRs still must preserve that auth/scope checks do not
create proof records, evidence records, readiness records, QP evidence, `z_t`
commits, AG Resume records, or publication readiness.

## 20. Open questions requiring user/PM judgment

Questions:

- Which concrete auth/session/workspace source should govern the read-only
  route?
- Should the next implementation stay route-only after auth/scope integration?
- Should the local marker guard remain as an additional local-development gate
  after real auth is introduced?
- Should any hosted ChatGPT App/MCP authenticated context be considered before a
  consumer is selected?
- Should optional Perspective Capsule / copyable handoff fields remain omitted
  until a consumer needs them?

## 21. Validation and smoke plan

Required validation for this plan PR:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-auth-scope-integration-plan`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-auth-scope-integration-plan`
- `npm run smoke:readonly-api-route-access-guard`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-implementation-plan`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

`npm run smoke:readonly-api-route-auth-scope-integration-plan` is a deterministic
plain Node static smoke. It checks required sections, candidate auth/scope
source options, safe default decision, fail-closed behavior, local guard
transition plan, future slices, docs/index pointers, package pointer,
scoped/content-only boundary behavior, and no forbidden positive authority
grants.

## 22. Non-goals

- no production auth implementation
- no hosted auth
- no OAuth
- no session identity implementation
- no multi-user tenancy implementation
- no workspace membership implementation
- no secrets/env handling
- no API route behavior change
- no route file change
- no route handler change
- no DB query
- no DB schema/migrations
- no graph DB
- no persistence
- no external calls
- no OpenAI calls
- no GitHub calls
- no fetch/XMLHttpRequest
- no consumer surface
- no UI code
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
