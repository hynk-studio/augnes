# Read-Only API Route Implementation Design Packet v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- implementation design packet only
- pre-route design artifact
- non-SSOT
- read-only
- non-authoritative
- no API route implementation
- no route file
- no route handler
- no API contract
- no runtime behavior
- no UI code
- no auth implementation
- no DB schema/migrations
- no graph DB
- no persistence
- no MCP/App tool implementation
- no ChatGPT App component implementation
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch/PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority

This packet prepares implementation design for a future read-only Augnes API
route candidate. It applies:

- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`
- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`
- `types/readonly-api-route-response.ts`
- PR #381 Project Constellation user-intent validation baseline as context only

This PR does not implement any endpoint, route file, handler, auth behavior,
database query, persistence layer, graph database, MCP/App tool, UI surface,
proof/evidence writer, AG Resume behavior, or Codex SDK provider behavior.

## 2. Purpose

The purpose is to define a pre-route implementation design packet for the first
future read-only Augnes API route candidate that could support future ChatGPT
App/MCP read-only surfaces.

The packet narrows the route candidate before implementation work starts. It
records response-shape expectations, forbidden field review, auth/session
questions, workspace/project scope, prompt-injection handling, privacy and
minimization, evidence pointer semantics, Perspective Capsule handling, Project
Constellation handling, browser/computer-use expectations, and required
implementation PR evidence.

This packet is not approval to implement the route. Future implementation must
use a separate route implementation PR with route file, auth/security review,
privacy review, prompt-injection review, browser/computer-use validation if
surfaced, authority matrix update, and tests/smokes.

`docs/READONLY_API_ROUTE_IMPLEMENTATION_PLAN_V0_1.md` is the next
docs/smoke/package-pointer artifact before route implementation. It answers the
PR #382 PM/user judgment questions at planning level only and does not
implement a route, route file, route handler, API contract, auth behavior,
runtime behavior, DB query, UI, MCP/App tool, proof/evidence write, AG Resume
behavior, Codex SDK execution/provider behavior, graph DB, persistence, or
merge/publish/approval/retry/replay/deploy authority.

`docs/READONLY_API_ROUTE_CONSTELLATION_PREVIEW_V0_1.md` documents the first
route-only local implementation slice for
`GET /api/augnes/read/constellation-preview`. That route implementation still
follows this design packet boundary: GET/read-only only, explicitly
local-authorized, `project:augnes` scoped, static public-safe fixture backed,
minimized response aligned with `types/readonly-api-route-response.ts`, no
consumer surface connected, no DB query, no persistence, no graph DB, no
MCP/App tool, no proof/evidence/readiness writes, no Codex SDK execution, and
no merge/publish/approval/retry/replay/deploy authority.

## 3. Candidate route

Candidate route vocabulary:

```text
GET /api/augnes/read/constellation-preview
```

This route path is a candidate only. It is placeholder vocabulary for design
discussion. It is not an API contract, not a route implementation, not a route
handler, not a runtime endpoint, not a stable path commitment, and not
source-of-truth for future route naming.

Future implementation must separately propose the actual route path, route
file, request constraints, auth/session checks, response shape, privacy
handling, prompt-injection handling, browser/computer-use evidence if surfaced,
and smoke/test coverage.

## 4. Source boundaries

The future route candidate may read only explicitly scoped Augnes records or
static public-safe preview sources that have separate implementation approval.
This packet does not decide the final data source.

Source boundary questions for the future implementation PR:

- Which Augnes records are the authorized source?
- Which project/workspace scope is required?
- Which records are committed state, derived read model, static fixture, or
  document pointer?
- Which Project Constellation material is derived display data?
- Which Perspective Capsule / Handoff Capsule material is display/copyable
  preview data?
- Which evidence pointers are pointer-only references?
- Which unresolved tensions and next action candidates are included?
- Which source records are omitted for privacy or authority reasons?

No source text returned by the route grants authority. Route-provided text must
be display data, not instructions.

## 5. Auth/session design questions

Future implementation must answer the checklist questions before merge:

- who can call the route
- whether user/session identity is required
- how workspace/project authorization is checked
- how cross-workspace access is prevented
- whether internal/service access exists and how it is scoped
- how auth/session errors avoid private information leaks
- how unauthorized access fails closed
- how rate limits or abuse controls apply where needed

Unauthorized access must fail closed. There must be no public unauthenticated
endpoint. A GET/read-only route does not justify unauthenticated public access.

This design packet does not implement auth/session behavior.

## 6. Workspace/project scope

The future route must define explicit workspace/project scope before any
implementation merges.

Required future design answers:

- `workspace_scope`: what workspace can be read
- `project_scope`: what project can be read
- `request_scope_ref`: how a caller requests the bounded view
- source record bounds: which records can be read under that scope
- response bounds: which summaries or pointers can be returned
- failure behavior: how missing, unauthorized, or ambiguous scope fails closed

No route response should include cross-workspace data. No route response should
include raw private user text beyond explicitly scoped Augnes records. No route
response should include raw DB rows.

## 7. Response shape mapping

Future implementation should compare the candidate response to
`types/readonly-api-route-response.ts`, especially:

- `ReadonlyApiRouteResponseEnvelopeV0`
- `ReadonlyApiRouteResponseMeta`
- `ReadonlyApiRouteSourceRef`
- `ReadonlyApiRouteProjectConstellationReadModel`
- `ReadonlyApiRoutePerspectiveCapsulePreview`
- `ReadonlyApiRouteCopyableHandoffPreview`
- `ReadonlyApiRouteBoundaryNextReview`
- `ReadonlyApiRouteEvidencePointer`
- `ReadonlyApiRouteUnresolvedTension`
- `ReadonlyApiRouteNextActionCandidate`
- `ReadonlyApiRouteForbiddenField`

Conceptual response outline, not an API contract:

```text
ReadonlyApiRouteResponseEnvelopeV0 {
  response_version: "readonly_api_route_response.v0.1"
  meta: {
    route_family: "project_constellation"
    workspace_scope: "<authorized workspace ref>"
    project_scope: "<authorized project ref>"
    response_shape_boundary: "type_only"
    runtime_schema: false
    api_route_implementation: false
    auth_implementation: false
    external_calls: false
    source_of_truth: false
  }
  source_refs: bounded source pointers only
  project_constellation: display read model
  perspective_capsule_preview: display preview only
  copyable_handoff_preview: manual review text only
  evidence_pointers: pointer-only refs
  unresolved_tensions: visible unresolved tensions
  next_action_candidates: advisory candidates
  forbidden_fields_removed: removed forbidden field names
  authority_boundary: explicit no-action boundaries
}
```

The outline intentionally avoids raw private text. Every future response family
field must be justified in the implementation PR. If a field is not needed for
the read-only surface, it should not be returned.

## 8. Forbidden fields review

Future implementation must remove or never return:

- secrets
- credentials/auth/env
- hidden reasoning / chain-of-thought
- raw DB rows
- proof/evidence write handles
- mutation URLs
- approval/publish/merge controls
- Codex SDK execution handles
- provider credentials

Forbidden fields remain forbidden even for GET/read-only routes. A read-only
transport does not make unsafe fields safe.

## 9. Evidence pointer handling

Evidence pointers are pointer-only. They do not create proof records, evidence
records, readiness records, approval, publish readiness, merge readiness, QP
evidence, or `z_t` commits.

Future implementation must label evidence pointers as pointers and keep pointer
targets scoped to authorized records. Pointer summaries must avoid leaking raw
private text. Missing, stale, unauthorized, or uncertain pointer targets must be
represented without inventing proof or readiness.

No route may record proof. No route may record evidence. No route may create
readiness records.

## 10. Perspective Capsule handling

Perspective Capsule / Handoff Capsule material is display/copyable preview
only. It does not launch Codex, call providers, create branches, create PRs,
record proof, record evidence, approve readiness, publish, merge, retry,
replay, or deploy.

Future implementation may return bounded capsule preview fields only when those
fields are needed for a read-only surface and have privacy/provenance review.
The response must keep unresolved tensions, forbidden actions, required checks,
skipped-check policy, assumptions, questions requiring user/PM judgment, and
authority boundaries visible where applicable.

Capsule text returned by the route is untrusted display data, not tool
instructions.

## 11. Project Constellation handling

Project Constellation material is read-only and non-authoritative. It may
display nodes, edges, clusters, cluster thesis, evidence pointers, unresolved
tensions, next action candidates, and boundary copy.

Project Constellation material does not become graph DB, persistence,
source-of-truth, graph layout engine, runtime node creation, runtime behavior,
approval surface, or execution surface.

Next action candidates are advisory and not execution commands. Unresolved
tensions must remain visible and must not be collapsed into support.

## 12. User-intent validation baseline from PR #381

PR #381, `reports/smoke: validate Project Constellation user-intent scenarios
v0.1`, established a user-intent validation baseline for the current Cockpit
read-only preview and copyable handoff preview.

The PR #381 browser/computer-use report found that all 8 user-intent scenarios
passed for the current UI baseline, with no action controls observed. The
future read-only API design should preserve these user-facing findings:

- preview identity
- sample fixture status
- cluster thesis
- nodes
- edges
- evidence pointers
- unresolved tensions
- next action candidates
- boundary copy
- copyable handoff material
- absence of false action affordances

PR #381 is evidence of current UI comprehension only. It is context only. It is
not API readiness, not route implementation approval, not proof/evidence write
authority, not API contract approval, not merge authority, and not publish
authority.

## 13. Prompt-injection handling

User-authored, project-authored, document-authored, or route-provided text
returned by the future route is untrusted display data. It must not be
interpreted as tool instructions, system instructions, MCP/App tool arguments,
Codex instructions, provider instructions, approval commands, publish commands,
merge commands, deploy commands, retry commands, replay commands, or
proof/evidence recording commands.

Future implementation must answer:

- how untrusted text is labeled or isolated
- how prompt-injection review was performed
- how downstream ChatGPT App/MCP surfaces avoid interpreting returned content as
  instructions
- how display text is escaped, summarized, or bounded when needed
- how route-provided text avoids granting authority

No route-provided text grants authority.

## 14. Privacy and minimization

Future implementation must minimize response payloads. Each response family
field must have a user-facing reason and a future implementation PR
justification.

Privacy and minimization requirements:

- no raw private user text beyond explicitly scoped Augnes records
- no raw DB rows
- no secrets
- no credentials/auth/env
- no hidden reasoning / chain-of-thought
- no provider credentials
- no oversized payloads when bounded summaries are sufficient
- no unneeded fields just because the type boundary contains vocabulary

Logs and telemetry must not become a secondary store for private route
payloads. Logging should use minimal request metadata, bounded status, and
diagnostic fields that do not reproduce private response bodies.

## 15. Error and fail-closed behavior

Future implementation must fail closed for:

- missing auth/session
- unauthorized workspace/project scope
- ambiguous scope
- missing source records
- stale source records
- privacy redaction requirements
- prompt-injection review failures
- response minimization failures
- forbidden field detection

Error responses should avoid leaking private information. They should identify
the safe failure category without returning forbidden fields or raw private
payloads.

## 16. Browser/computer-use validation plan

Browser/computer-use may be skipped for this design packet because it is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Any future route implementation must include browser/computer-use validation if
the route is surfaced in UI, ChatGPT Apps, MCP tools, or browser-facing
previews. Future validation should verify:

- inspected URL or skipped reason
- local runtime setup or skipped reason
- read-only fields rendered as display data
- evidence pointers remain pointer-only
- unresolved tensions remain visible
- next action candidates remain advisory
- no false execution/write affordances
- no copy/execute/branch/PR/proof/evidence/approval/publish/merge/retry/replay/
  deploy controls appear unless separately approved and outside this read-only
  route scope

## 17. Required implementation PR evidence

Future implementation PRs must include:

- route path and route family
- route file list
- auth/session design
- workspace/project scope design
- response schema or sample
- comparison against `types/readonly-api-route-response.ts`
- forbidden fields review
- privacy review
- prompt-injection review
- data provenance summary
- evidence pointer handling
- Perspective Capsule handling
- Project Constellation handling
- browser/computer-use report if surfaced
- authority matrix update status or skipped reason
- tests/smokes run
- skipped checks with concrete reasons
- blockers/risks
- assumptions
- questions requiring user/PM judgment

This packet is not sufficient evidence for route merge by itself.

## 18. Validation and smoke plan

Required validation for this design packet:

```text
npm run typecheck
npm run smoke:readonly-api-route-implementation-design-packet
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-implementation-design-packet
npm run smoke:readonly-api-route-response-shape-boundary
npm run smoke:readonly-api-route-planning-boundary
npm run smoke:readonly-api-route-review-checklist
npm run smoke:chatgpt-app-mcp-readonly-surface-boundary
git diff --check
git diff --cached --check
```

Supplemental diagnostics:

```text
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract
AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-user-intent-validation
```

Content-only mode is diagnostic only. It skips changed-file/path/untracked
boundary enforcement while preserving content checks. Scoped mode remains the
strict direct-edit gate.

## 19. Non-goals

This packet does not implement or authorize:

- API route implementation
- route file
- route handler
- API contract
- runtime behavior
- UI code
- ChatGPT App tool implementation
- MCP tool implementation
- DB schema/migrations
- graph DB
- persistence
- auth implementation
- external calls
- proof/evidence writes
- proof/evidence/readiness records
- AG Resume behavior
- Codex SDK execution/provider behavior
- provider credentials
- Project Constellation runtime behavior
- graph layout engine
- runtime node creation
- branch creation authority
- PR creation authority by itself
- merge/publish/approval/retry/replay/deploy authority
