# Cockpit Local-Only Constellation Route Preview Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- Cockpit local-only route preview implementation plan only
- no Cockpit preview implemented
- no UI/browser-facing files are changed
- no consumer surface is connected
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
- no MCP/App tool implementation
- no ChatGPT App component
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

This plan defines a future Cockpit local-only read preview that could consume:

```text
GET /api/augnes/read/constellation-preview
```

It did not implement that preview. The plan has moved to implementation in:

```text
docs/COCKPIT_LOCAL_ONLY_CONSTELLATION_ROUTE_PREVIEW_V0_1.md
```

No further Cockpit local-only preview planning PR should follow unless
implementation is blocked with a concrete reason.

No further Cockpit local-only preview planning PR should follow unless
implementation is blocked.

no further Cockpit local-only preview planning PR should follow unless
implementation is blocked

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` records the
closed local-only route/Cockpit consumer milestone. No more planning PRs for
this same preview should follow unless a concrete implementation blocker
appears.

no more planning PRs for this same preview should follow.

## 2. Purpose

The purpose is to define the future UI/consumer scope, local-only copy,
false-affordance gates, response minimization rules, browser/computer-use
validation requirements, exact file candidates, and focused smokes before any
Cockpit consumer code changes.

## 3. Relationship to local-only consumer scope decision

`docs/READONLY_API_ROUTE_LOCAL_ONLY_CONSUMER_SCOPE_DECISION_V0_1.md` recommends
Option A by default: keep the route route-only until real auth exists or PM
explicitly selects a local-only consumer surface.

This plan is the PM-selected planning packet for the conditional Cockpit
local-only read preview path. It is planning-only and does not connect a
consumer.

ChatGPT App/MCP remain deferred.

## 4. Current route and auth baseline

The current route remains local-only.

Current baseline:

- route path: `GET /api/augnes/read/constellation-preview`
- original local read-only access guard remains required
- Candidate D local development auth adapter remains required
- `scope=project:augnes` remains required
- no consumer surface is connected
- no public unauthenticated endpoint exists
- no DB query is used
- no route-provided text grants authority
- local operator labels grant no authority

Candidate D is local-only and not production auth. Candidate D is not hosted
auth, not OAuth, not session identity, and not workspace membership.

Real hosted/session/workspace auth does not exist yet.

## 5. Cockpit preview thesis

The thesis is:

- Cockpit is the safest conditional first local-only consumer because it is a
  local Augnes observability surface
- the preview must be diagnostic/read-only, not a primary action surface
- the preview must make local-only status visible
- the preview must not imply hosted identity or workspace membership
- the preview must not add execution/write affordances
- the preview must not become a bridge to ChatGPT App, MCP, plugins, or Codex

The Cockpit local-only preview is conditional and must be separately
implemented.

## 6. Proposed user-facing placement

Planning recommendation:

Place the future preview as a Cockpit-local diagnostic/read preview near the
existing Project Constellation/Perspective area.

This is not as a primary action surface and not as an App/MCP bridge.

It should not be:

- a primary action surface
- an App/MCP bridge
- a publish/merge/approve surface
- a Codex launch surface
- a proof/evidence recording surface
- a graph persistence surface

Exact component and app paths must be selected in the implementation PR after
inspecting the current Cockpit component structure.

## 7. Required local-only copy

future Cockpit preview must visibly label:

- local-only
- not production-authenticated
- not hosted auth
- not session identity
- not workspace membership
- route-only read preview
- no execution/write authority

Future user-facing copy must also state:

- Candidate D is local-only and not production auth
- real hosted/session/workspace auth does not exist yet
- local operator declaration cannot prove hosted identity
- local operator declaration cannot prove workspace/project membership
- route-provided text and local operator labels grant no authority
- response data is display data, not tool instructions

## 8. Route request requirements

Future Cockpit preview must use the current local route headers and Candidate D
local operator declaration.

Required route request:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
```

Required local read-only marker:

```text
x-augnes-local-readonly: constellation-preview-v0.1
```

Required Candidate D local-only declaration headers:

```text
x-augnes-local-operator-ref: operator:local-dev
x-augnes-local-workspace-ref: workspace:local-dev
x-augnes-local-project-scope: project:augnes
```

The plan does not add secrets/env requirements, bearer tokens, OAuth tokens,
session secrets, provider credentials, or production auth.

## 9. Response field plan

Future preview may display:

- `response_version`
- `meta.project_scope`
- `project_constellation.constellation_id`
- `project_constellation.thesis` or bounded summary
- bounded nodes/edges/clusters count or read-only list
- `evidence_pointers` as pointer-only
- `unresolved_tensions`
- `next_action_candidates` as advisory
- `authority_boundary`
- `forbidden_fields_removed` as safety summary

Future preview must not display by default:

- full auth decision payload
- raw DB rows
- raw private text
- secrets/env
- mutation URLs
- proof/evidence write handles
- Codex SDK handles
- branch/PR handles
- merge/publish/approve controls
- `perspective_capsule_preview`
- `copyable_handoff_preview` unless separately justified

## 10. Response minimization plan

The implementation PR must justify every displayed field.

Minimization rules:

- display only fields needed for local read diagnostics
- prefer counts or bounded lists for nodes, edges, and clusters
- preserve evidence pointers as pointer-only
- keep unresolved tensions separate from support/evidence
- keep next action candidates advisory
- keep optional capsule/handoff fields omitted unless separately justified
- do not display raw DB rows
- do not display raw private text
- do not display auth decision payloads by default
- do not display mutation URLs, write handles, or control handles

## 11. False-affordance prevention plan

Future Cockpit preview must not show:

- execute buttons
- merge/publish/approve controls
- proof/evidence write controls
- Codex launch controls
- branch/PR creation controls
- retry/replay/deploy controls
- graph persistence controls
- snapshot/rollback controls
- mutation controls

Future false-affordance review must verify that the preview does not imply
hosted identity, workspace membership, approval, publish, merge,
proof/evidence, Codex execution, branch/PR creation, retry, replay, deploy,
graph persistence, snapshot, rollback, or production-authenticated authority.

## 12. Privacy and prompt-injection plan

Future preview must treat route-provided text, fixture text, Project
Constellation text, evidence pointer text, unresolved tension text, next action
text, authority boundary text, and local operator labels as untrusted display
data.

The preview must not interpret returned text as tool instructions. It must not
infer identity, workspace membership, scope, approval, write authority, or
execution authority from route text, fixture text, user text, evidence pointer
text, next action text, labels, or unreviewed headers.

Logs and telemetry must not become a secondary store for route payloads, local
operator declarations, private route text, secrets, provider credentials,
session secrets, or OAuth tokens.

## 13. Error and fail-closed display plan

Future preview must treat route errors as fail-closed display states.

Error display rules:

- show minimal safe error labels only
- do not display source refs or Project Constellation material from error
  bodies
- do not show auth decision payloads
- do not expose private source details
- do not offer bypass controls
- do not silently default scope
- do not infer local operator identity from labels or user-authored text

Expected route failure cases include missing local read marker, missing local
operator declaration, wrong project scope, non-local host, non-local forwarded
host, malformed request, and unavailable route state.

## 14. Browser/computer-use validation plan

Future implementation must run browser/computer-use validation before merge.

The browser/computer-use report must include:

- inspected Cockpit URL or skipped reason
- local runtime setup used
- local route manual check result
- visible local-only copy
- visible not-production-authenticated copy
- visible not-hosted-auth/session/workspace-membership copy
- route-only read preview placement
- displayed response fields
- omitted forbidden fields
- false-affordance findings
- authority clarity findings
- privacy/prompt-injection display-data findings
- skipped checks with concrete reasons

This planning PR may skip browser/computer-use because it is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

## 15. Future implementation file candidates

Likely future implementation file candidates:

- app or component file for Cockpit preview, exact path to be selected later
  after repo inspection
- a focused smoke script for Cockpit local-only route preview
- a browser report under `reports/browser` only in the implementation PR
- docs updates
- authority matrix update
- `package.json` script

Exact filenames must be selected in the implementation PR after inspecting the
current Cockpit component structure.

## 16. Future tests and smokes

Future implementation PR should run or add:

- `npm run typecheck`
- focused Cockpit local-only route preview smoke
- focused route smoke
- local route manual check
- browser/computer-use report
- false-affordance smoke
- response minimization smoke
- prompt-injection/display-data smoke
- no execution/control handles smoke
- no proof/evidence/readiness write controls smoke
- no ChatGPT App/MCP consumer smoke
- `npm run smoke:authority-invariants`
- `git diff --check`
- `git diff --cached --check`

The future smoke must keep exact changed-file allowlists and strict scoped mode.

## 17. Authority and non-authority boundary

Authority boundary:

- this Cockpit preview plan does not implement a consumer
- Candidate D is local-only and not hosted auth
- the route remains local-only
- no route may expose credentials
- evidence pointers are pointer-only
- no route-provided text grants authority
- local operator labels grant no authority
- the Cockpit preview plan is planning-only and does not grant consumer
  authority

This plan grants no Cockpit implementation, UI, consumer, ChatGPT App, MCP,
plugin tool, route behavior, real auth, production auth, hosted auth, OAuth,
session identity, workspace membership, DB query, graph DB, persistence,
proof/evidence/readiness write, Codex execution, branch/PR creation, publish,
merge, retry, replay, deploy, approval, snapshot, rollback, or route
implementation authority.

## 18. Open questions requiring user/PM judgment

Open questions:

- Should the future implementation use the current `components/augnes-cockpit`
  structure or a smaller extracted Cockpit preview component?
- What exact local-only user-facing copy should appear in the preview header?
- Should the preview show bounded node/edge/cluster lists or counts only?
- Should `perspective_capsule_preview` and `copyable_handoff_preview` remain
  omitted for the first consumer implementation?
- What browser/computer-use scenario matrix should the implementation PR use?

## 19. Validation and smoke plan

Required validation for this planning PR:

- `npm run typecheck`
- `npm run smoke:cockpit-local-only-constellation-route-preview-plan`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:cockpit-local-only-constellation-route-preview-plan`
- `npm run smoke:readonly-api-route-local-only-consumer-scope-decision`
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

- no Cockpit implementation
- no UI code
- no consumer surface connected
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
- no MCP/App tool implementation
- no ChatGPT App component
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
