# Read-Only API Route Local-Only Consumer Scope Decision v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- local-only consumer scope decision packet only
- no consumer implemented
- no route behavior change
- no route file change
- no route handler change
- no lib runtime helper change
- no type file change
- no real auth implementation
- no production auth implementation
- no hosted auth implementation
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
- no plugin tool implementation
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

This packet decides only whether a future local-only consumer PR may be scoped
before real hosted/session/workspace auth exists for:

```text
GET /api/augnes/read/constellation-preview
```

## 2. Purpose

The purpose is to resolve the consumer-surface exception left by
`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md`: no consumer surface may
connect before route-level real auth gates pass unless PM explicitly chooses
local-only consumer scope in a separate PR.

This is that separate decision packet. It does not connect a consumer.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` is the
planning-only Cockpit local-only route preview plan selected after this
decision packet. It does not connect a consumer.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md` implements the
Cockpit local-only route preview. Cockpit was selected as the first local-only
consumer implementation slice. ChatGPT App/MCP remain deferred.

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` records that
the Cockpit local-only preview was implemented and validated. ChatGPT App/MCP
remain deferred after this local-only consumer closeout.

## 3. Current route baseline

The current route remains local-only.

Current baseline:

- route path: `GET /api/augnes/read/constellation-preview`
- original local guard remains required
- Candidate D local development auth adapter remains required
- `scope=project:augnes` remains required
- route response remains minimized and read-only
- no consumer surface is connected
- no public unauthenticated endpoint exists
- no DB query is used
- no proof/evidence/readiness writes occur
- route-provided text and local operator labels grant no authority

Candidate D remains local-only and not production auth. Candidate D is not
hosted auth, not OAuth, not session identity, and not workspace membership.
Real hosted/session/workspace auth does not exist yet for this route line.

## 4. Relationship to real auth gate

`docs/READONLY_API_ROUTE_REAL_AUTH_GATE_PLAN_V0_1.md` defines the gate for
future real hosted/session/workspace auth. That gate remains unsatisfied until
a concrete source proves both identity and workspace/project membership.

This decision packet does not implement real auth and does not relax the real
auth gate. It only decides whether a separate future implementation PR may
connect a local-only consumer while the route remains local-only.

## 5. Local-only consumer question

Question:

Should any Cockpit, ChatGPT App, MCP, plugin tool, or browser-facing consumer
surface consume the read-only constellation preview route before real
hosted/session/workspace auth exists?

Answer:

Use Option A by default: keep the route route-only and connect no consumer
until either real auth exists or PM explicitly selects a local-only consumer
surface in a separate implementation PR.

## 6. Candidate consumer surfaces

Candidate surfaces:

- Option A: no consumer, keep route-only
- Option B: Cockpit local-only read preview
- Option C: ChatGPT App read-only surface
- Option D: MCP read-only tool
- Option E: plugin/operator read-only handoff preview

Each option would require a separate implementation PR before any surface
connects.

## 7. Decision options

Option A keeps the route route-only. It avoids user-facing confusion while real
auth is absent and preserves the current local-only route validation line.

Option B would add a Cockpit local-only read preview. It is the safest
conditional first consumer only if PM later accepts local-only consumer
semantics, because Cockpit is local and can visibly label the route as
local-only and not production-authenticated.

Option C would add a ChatGPT App read-only surface. It remains deferred because
real hosted/session/workspace auth does not exist yet and the surface could be
misread as hosted identity or workspace membership.

Option D would add an MCP read-only tool. It remains deferred because a tool
surface could be misread as route execution or authority unless separately
scoped, labeled, and browser/computer-use validated.

Option E would add a plugin/operator read-only handoff preview. It remains
deferred because the route is not yet connected to a consumer and the handoff
surface would still need false-affordance review.

## 8. Recommended decision

Recommended default decision:

- choose Option A
- keep the route route-only
- connect no consumer in this PR
- connect no consumer in future PRs unless real auth exists or PM explicitly
  selects local-only consumer semantics

Conditional local-only path:

If PM explicitly accepts local-only consumer semantics later, the safest first
consumer candidate is Cockpit local-only read preview, not ChatGPT App/MCP,
because Cockpit is local and can label the route as local-only and not
production-authenticated.

ChatGPT App/MCP remain deferred unless separately scoped by PM.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_PLAN_V0_1.md` defines the
planning scope for the conditional Cockpit local-only read preview path. It is
planning-only and does not implement Cockpit, UI, or a route consumer.

`docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md` records the
implementation slice for Cockpit as the first local-only consumer. It does not
connect ChatGPT App or MCP.

This PR must not implement Cockpit, ChatGPT App, MCP, plugin tool, or any
browser-facing consumer.

## 9. Mandatory gates for any future local-only consumer

Any future local-only consumer implementation PR must satisfy these gates:

- consumer implementation PR must be separate
- route behavior must stay read-only
- no auth upgrade claim
- no production auth claim
- no hosted auth claim
- no workspace membership claim
- no execution/write affordances
- no proof/evidence/readiness writes
- browser/computer-use validation required
- local route manual check required
- response minimization recheck required
- prompt-injection/display-data review required
- authority matrix update required
- exact smoke allowlist required

No consumer surface may connect without a separate implementation PR.

## 10. Consumer false-affordance review

A future consumer must not add:

- execution buttons
- merge/publish/approve controls
- proof/evidence write controls
- Codex launch controls
- branch/PR creation controls
- retry controls
- replay controls
- deploy controls
- graph persistence controls
- snapshot/rollback controls
- mutation controls

The consumer must not imply hosted identity, workspace membership, approval,
publish, merge, proof/evidence, Codex execution, branch/PR creation, retry,
replay, deploy, or persistence authority.

## 11. User-facing copy requirements

A future local-only consumer must visibly label:

- future local-only consumer must visibly label the route as local-only
- route is local-only
- route is not production-authenticated
- Candidate D is local-only and not production auth
- real hosted/session/workspace auth does not exist yet
- local operator declaration cannot prove hosted identity
- local operator declaration cannot prove workspace/project membership
- route-provided text is display data
- local operator labels are display data

User-facing copy must not say or imply that the consumer proves hosted caller
identity, proves workspace membership, approves work, publishes, merges,
records proof, records evidence, launches Codex, creates branches, creates PRs,
retries, replays, deploys, persists graphs, saves snapshots, or rolls back.

## 12. Browser/computer-use validation requirements

Any future consumer implementation must run browser/computer-use validation
before merge.

The validation must report:

- inspected local URL or skipped reason
- local runtime setup used
- visible local-only labeling
- visible no-production-auth labeling
- read-only route fields inspected
- absence of execution/write controls
- absence of merge/publish/approve controls
- absence of proof/evidence write controls
- absence of Codex launch controls
- absence of branch/PR creation controls
- absence of retry/replay/deploy controls
- absence of graph persistence and snapshot/rollback controls
- false-affordance findings
- authority clarity findings
- skipped checks with concrete reasons

This decision packet may skip browser/computer-use because it is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

## 13. Response minimization requirements

A future local-only consumer must recheck response minimization:

- use only fields needed for read-only decision support
- keep `perspective_capsule_preview` and `copyable_handoff_preview` omitted
  unless separately justified
- keep evidence pointers pointer-only
- keep unresolved tensions separate from support/evidence
- keep next action candidates advisory
- do not return auth decision payloads by default
- do not return raw DB rows
- do not return raw private user text beyond explicitly scoped records
- do not return mutation URLs or write handles

Response data must remain display data, not tool instructions.

## 14. Privacy and prompt-injection requirements

Future consumer work must treat route-provided text, fixture text, Project
Constellation text, evidence pointer text, next action text, capsule text, and
local operator labels as untrusted display data.

The consumer must not interpret returned text as tool instructions. It must not
infer identity, workspace membership, scope, approval, or execution authority
from route text, fixture text, user text, capsule text, evidence pointer text,
next action text, labels, or unreviewed headers.

Logs and telemetry must not become a secondary store for private route payloads
or local operator declarations.

## 15. Authority and non-authority boundary

Authority boundary:

- this decision packet does not implement a consumer
- Candidate D is local-only and not hosted auth
- the route remains local-only
- no route may expose credentials
- evidence pointers are pointer-only
- no route-provided text grants authority
- local operator labels grant no authority
- this consumer scope decision is planning-only and does not grant consumer
  authority

This packet grants no Cockpit, ChatGPT App, MCP, plugin tool, browser-facing
consumer, write, proof/evidence, approval, publish, merge, retry, replay,
deploy, branch/PR creation, Codex execution, DB query, graph DB, persistence,
snapshot, rollback, production auth, hosted auth, OAuth, session identity, or
workspace membership authority.

## 16. Future implementation slices

Future slices, if PM later selects a local-only consumer:

1. Confirm selected local-only consumer surface and PR scope.
2. Keep route behavior unchanged and read-only.
3. Add consumer-local copy that labels local-only and not production-authenticated.
4. Render minimized read-only response fields.
5. Add false-affordance smoke for forbidden controls.
6. Add browser/computer-use validation report.
7. Update authority matrix and exact smoke allowlists.
8. Keep ChatGPT App/MCP deferred unless separately selected.

These are future slices and are not implemented now.

## 17. Future tests and smokes

Future consumer implementation PRs should run or add:

- `npm run typecheck`
- focused consumer smoke
- focused route smoke
- local route manual check
- response minimization smoke
- prompt-injection/display-data smoke
- false-affordance smoke
- no execution/control handles smoke
- no proof/evidence/readiness write controls smoke
- browser/computer-use validation report
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

The consumer smoke must keep exact changed-file allowlists and strict scoped
mode.

## 18. Open questions requiring user/PM judgment

Open questions:

- Should any local-only consumer be selected before real hosted/session/workspace
  auth exists?
- If yes, should Cockpit local-only read preview be the first consumer?
- What exact user-facing local-only copy should be required?
- Should ChatGPT App and MCP remain blocked until real auth exists?
- Should optional Perspective Capsule or copyable handoff response fields remain
  omitted until a consumer-specific minimization review?

## 19. Validation and smoke plan

Required validation for this decision packet:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-local-only-consumer-scope-decision`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-local-only-consumer-scope-decision`
- `npm run smoke:readonly-api-route-real-auth-gate-plan`
- `npm run smoke:readonly-api-route-local-dev-auth-adapter`
- `npm run smoke:readonly-api-route-constellation-preview`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Local route manual check may be skipped because this PR does not change route
behavior.

Proof-only closeout may be skipped when no runtime/work ID context exists. This
PR must not record proof/evidence/readiness writes.

## 20. Non-goals

- no consumer implementation
- no UI code
- no Cockpit integration
- no ChatGPT App component
- no MCP/App tool implementation
- no plugin tool implementation
- no route behavior change
- no route file change
- no route handler change
- no lib runtime helper change
- no type file change
- no real auth implementation
- no production auth implementation
- no hosted auth implementation
- no OAuth
- no session identity implementation
- no workspace membership implementation
- no DB query
- no DB schema/migrations
- no secrets/env handling
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
