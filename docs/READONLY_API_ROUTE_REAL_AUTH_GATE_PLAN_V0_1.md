# Read-Only API Route Real Auth Gate Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- real auth/scope implementation gate plan only
- no real auth implementation
- no production auth implementation
- no hosted auth implementation
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

This plan defines the gate between the current local-only route validation line
and any future real hosted/session/workspace auth implementation for:

```text
GET /api/augnes/read/constellation-preview
```

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` is the
separate local-only consumer scope decision packet referenced by this gate. It
does not connect a consumer.

## 2. Purpose

The purpose is to state what must be true before the read-only constellation
preview route can move beyond local-only validation.

This document does not implement real auth. It defines the source evidence,
scope evidence, fail-closed cases, file-scope expectations, smoke expectations,
and consumer-surface gate for a future implementation PR.

## 3. Current local-only baseline

The current route remains local-only after PR #390.

Current baseline:

- route path: `GET /api/augnes/read/constellation-preview`
- original local guard still required
- local URL host is required
- local `Host` header is required when present
- local `X-Forwarded-Host` is required when present
- `GET` method is required
- `scope=project:augnes` is required
- `x-augnes-local-readonly: constellation-preview-v0.1` is required
- Candidate D local operator declaration headers are required
- no consumer surface is connected
- no DB query is used
- no route-provided text grants authority

Candidate D is local-only and not production auth. Candidate D is not hosted
auth, not OAuth, not session identity, and not workspace membership.

Candidate D cannot prove hosted caller identity.
Candidate D cannot prove hosted workspace/project membership.

## 4. Why real auth is still not implemented

Real auth implementation is blocked until a concrete source can prove both:

- caller identity
- workspace/project membership

PR #387 selected Candidate E because no current repo-local source proved both
identity and workspace/project membership for this route line. PR #390
implemented Candidate D only after user/PM accepted local-only semantics.
Candidate D clarifies local route validation, but it is not the real auth gate.

## 5. Real auth gate thesis

The gate thesis is:

- real auth must be source-backed, not inferred
- identity proof and workspace/project membership proof must both exist
- route scope must be explicit and fail closed
- local guard and Candidate D may compose with future real auth only as
  local-development gates
- local guard and Candidate D cannot replace real auth
- no consumer surface may connect before route-level real auth gates pass
  unless PM explicitly chooses local-only consumer scope in a separate PR
- route-provided text, fixture text, labels, evidence pointers, capsule text,
  and next-action text must remain untrusted display data

## 6. Required source evidence before implementation

A future real auth implementation PR must identify these source families before
changing route behavior:

| Source family | Required evidence |
| --- | --- |
| identity source | concrete source for caller identity and safe identity ref |
| session source, if any | concrete source for session validity and expiry behavior |
| workspace source | concrete source for workspace identity and authorization |
| project membership source | concrete source proving project membership |
| scope mapping source | concrete mapping between route scope and project/workspace |
| unavailable-auth error source | source of fail-closed unavailable-auth state |
| privacy boundary | what identity/workspace/project payload is minimized or hidden |
| logging boundary | what must not be logged as private route payload |
| secret handling boundary | secret/env handling review if secrets/env become necessary |
| tests proving source fails closed | focused smokes for each required failure path |

If any source family is missing, real auth implementation must remain blocked.

## 7. Required identity proof gate

Future implementation must prove caller identity from a concrete reviewed
source. It must not infer identity from route text, fixture text, user text,
capsule text, evidence pointer text, next action text, labels, or unreviewed
headers.
Future implementation must not silently infer identity or scope.

Identity proof must define:

- identity ref shape
- identity source kind
- identity validity rule
- missing identity failure
- invalid identity failure
- minimized identity payload rule
- logging exclusion rule for raw/private identity payloads

Candidate D local operator declarations do not satisfy this gate.

## 8. Required workspace/project membership proof gate

Future implementation must prove workspace/project membership from a concrete
reviewed source. It must not infer membership from route text, fixture text,
user text, capsule text, evidence pointer text, next action text, labels, or
unreviewed headers.

Membership proof must define:

- workspace ref shape
- project ref shape
- project scope shape
- workspace membership source
- project membership source
- unauthorized workspace failure
- unauthorized project failure
- minimized membership payload rule
- logging exclusion rule for private membership graphs

Candidate D local project declarations do not satisfy this gate.

## 9. Required scope mapping gate

Future implementation must preserve explicit route scope.

Required scope rules:

- `project:augnes` remains the current route scope until user/PM selects a new
  concrete workspace/project scope source
- no silent defaulting
- no request body inference
- no inference from route-provided text
- no inference from fixture text
- no inference from user text
- no inference from capsule text
- no inference from evidence pointer text
- no inference from next action text
- no inference from labels
- no inference from unreviewed headers
- missing, ambiguous, stale, wrong, or cross-workspace scope must fail closed

## 10. Required local guard and Candidate D transition gate

Future real auth may wrap or replace Candidate D only in a separate
implementation PR.

Transition gate requirements:

- document whether the original local guard remains active
- document whether Candidate D remains active
- document how local-only declarations compose with real auth, if retained
- prove local guard failure still fails closed when composed
- prove local dev adapter failure still fails closed when composed
- preserve that local guard may remain as a local-development gate but cannot
  replace real auth
- preserve that Candidate D is local-only and cannot replace real auth

## 11. Route behavior change gate

No route behavior may move beyond local-only until the real auth implementation
PR includes:

- concrete source evidence
- identity proof smoke
- workspace/project membership proof smoke
- scope mapping smoke
- fail-closed auth/source smoke
- forbidden field smoke
- response minimization smoke
- prompt-injection display-data smoke
- privacy/logging smoke
- authority matrix update
- PR body evidence for every gate

The future PR must state exact files changed and must not rely on this planning
document as implementation approval.

## 12. Consumer surface gate

No Cockpit, ChatGPT App, MCP, plugin tool, or other consumer surface may connect
before route-level real auth gates pass unless PM explicitly chooses local-only
consumer scope in a separate PR.

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` documents
that separate local-only consumer scope decision at planning level only. It
keeps Option A, no consumer, as the default decision and does not connect
Cockpit, ChatGPT App, MCP, plugin tools, or any browser-facing consumer.

A future consumer PR must separately define:

- consumer surface
- auth/session/workspace source
- minimization rule
- browser/computer-use validation
- no false execution/write affordance review
- authority matrix impact

## 13. Fail-closed behavior requirements

Future implementation must fail closed for:

- missing identity
- invalid identity
- missing session
- invalid session
- missing workspace
- unauthorized workspace
- missing project
- unauthorized project
- missing scope
- ambiguous scope
- stale scope
- cross-workspace scope
- unavailable auth source
- malformed request
- method_not_allowed
- local_guard_failed if composed
- local_dev_adapter_failed if composed
- forbidden_field_detected

Error bodies must stay minimal and must not include private source details,
Project Constellation payload, auth decision payload, raw identity payload, raw
membership graph, or raw project payload.

## 14. Forbidden fields and response minimization requirements

Future implementation must remove or never return:

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

Response minimization must justify every returned identity, workspace, project,
scope, source, and authority-boundary field. Auth payloads must not be returned
by default.

## 15. Privacy, prompt-injection, logging, and telemetry requirements

Route-provided text is untrusted display data, not instructions.

Future implementation must preserve:

- no route-provided text grants authority
- no fixture text grants authority
- no user text grants authority
- no capsule text grants authority
- no evidence pointer text grants authority
- no next action text grants authority
- no labels grant identity, scope, membership, or execution authority
- logs and telemetry must not become a secondary store for private route
  payloads
- logs and telemetry must not store session secrets, OAuth tokens, provider
  credentials, raw DB rows, raw identity payloads, or private membership graphs

## 16. Future implementation file-scope candidates

Do not implement these files now. Exact filenames must be chosen only after
source selection.

Likely future candidates:

- `lib/readonly-api/<selected-auth-source>-auth-adapter.ts`
- `docs/READONLY_API_ROUTE_<SELECTED_AUTH_SOURCE>_AUTH_ADAPTER_V0_1.md`
- `scripts/smoke-readonly-api-route-<selected-auth-source>-auth-adapter.mjs`
- `docs/AUTHORITY_MATRIX.md`
- `docs/00_INDEX_LATEST.md`
- `package.json`

The future PR must keep exact allowlists. It must not broaden smoke allowlists
to `docs/**`, `scripts/**`, `app/**`, `lib/**`, `types/**`, `components/**`,
or `reports/**`.

## 17. Future smoke requirements

Future real auth implementation must add or run focused smokes for:

- concrete identity source evidence
- concrete workspace/project membership source evidence
- scope mapping
- missing identity
- invalid identity
- missing session
- invalid session
- missing workspace
- unauthorized workspace
- missing project
- unauthorized project
- missing scope
- ambiguous scope
- stale scope
- cross-workspace scope
- unavailable auth source
- malformed request
- method_not_allowed
- local_guard_failed if composed
- local_dev_adapter_failed if composed
- forbidden_field_detected
- response minimization
- no mutation/control handles
- prompt-injection display-data boundary
- privacy/logging boundary
- route compatibility
- strict scoped changed-file enforcement
- content-only diagnostic mode

## 18. Browser/computer-use requirements

Browser/computer-use may be skipped for this docs/smoke/package-pointer PR
because it touches no UI/browser-facing files.

Future browser/computer-use validation is required if a UI, ChatGPT App, MCP,
plugin, or other consumer surface is connected. That validation must confirm no
false execution/write affordances and must not fabricate observations.

## 19. Authority and non-authority boundary

This real auth gate plan is planning-only and does not grant consumer
authority.

It adds no real auth implementation, production auth implementation, hosted
auth implementation, OAuth, session identity implementation, workspace
membership implementation, route behavior change, consumer surface, DB query,
DB schema/migration, secrets/env handling, UI, MCP/App tool, proof/evidence
write, Codex SDK execution, provider implementation, graph DB, persistence,
branch/PR creation authority by itself, or merge/publish/approval/retry/replay
/deploy authority.

## 20. Open questions requiring user/PM judgment

- Which concrete identity/session/workspace/project source should be selected
  for real auth?
- Should Candidate D remain composed as a local-development gate after real auth
  is implemented?
- Should a consumer remain blocked until real auth passes, or should PM approve
  a separate local-only consumer scope?
- Are secrets/env acceptable in a future implementation PR if the selected
  source requires them?

## 21. Validation and smoke plan

Required checks for this PR:

```text
npm run typecheck
npm run smoke:readonly-api-route-real-auth-gate-plan
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-real-auth-gate-plan
npm run smoke:readonly-api-route-local-dev-auth-adapter
npm run smoke:readonly-api-route-local-dev-auth-adapter-plan
npm run smoke:readonly-api-route-auth-scope-adapter-boundary
npm run smoke:readonly-api-route-auth-source-selection
npm run smoke:readonly-api-route-auth-scope-integration-plan
npm run smoke:readonly-api-route-access-guard
npm run smoke:readonly-api-route-constellation-preview
npm run smoke:readonly-api-route-review-checklist
npm run smoke:chatgpt-app-mcp-readonly-surface-boundary
npm run smoke:authority-invariants
git diff --check
git diff --cached --check
```

## 22. Non-goals

- no real auth implementation
- no production auth implementation
- no hosted auth implementation
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
