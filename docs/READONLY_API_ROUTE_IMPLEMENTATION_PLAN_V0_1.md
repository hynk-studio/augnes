# Read-Only API Route Implementation Plan v0.1

## 1. Status and scope

Status:

- docs/smoke/package-pointer only
- implementation plan only
- pre-route planning artifact
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
- no DB query implementation
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

This plan is the next docs/smoke/package-pointer artifact after
`docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`. It converts the
open PR #382 PM/user judgment questions into a bounded implementation plan
before any route file exists.

This plan applies:

- `docs/READONLY_API_ROUTE_PLANNING_BOUNDARY_V0_1.md`
- `docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`
- `docs/READONLY_API_ROUTE_IMPLEMENTATION_DESIGN_PACKET_V0_1.md`
- `types/readonly-api-route-response.ts`
- PR #381 Project Constellation user-intent validation baseline as context only

This PR does not implement any endpoint, route file, handler, auth behavior,
database query, persistence layer, graph database, MCP/App tool, UI surface,
proof/evidence writer, AG Resume behavior, or Codex SDK provider behavior.

## 2. Purpose

The purpose is to define a concrete but non-executable implementation plan for
the first future read-only Augnes API route candidate that could support future
ChatGPT App/MCP read-only surfaces.

The plan answers the PR #382 planning questions at planning level only:

- authenticated workspace/project scope
- bounded summary and minimization choices
- first consumer surface
- implementation slices
- route test/smoke strategy
- browser/computer-use validation criteria
- prompt-injection/privacy review checklist application
- authority matrix impact or skipped reason

This plan is not approval to implement the route. Any route-file change,
auth/session behavior, source assembly, privacy review, prompt-injection review,
tests/smokes, authority matrix update or skipped reason, and browser/computer-use
evidence if surfaced belongs in a separate scoped implementation PR.

## 3. Route candidate and non-contract status

Candidate route vocabulary:

```text
GET /api/augnes/read/constellation-preview
```

The candidate route remains placeholder vocabulary only. It is not an API
contract, not a route implementation, not a route handler, not a runtime
endpoint, not a stable route path commitment, and not source-of-truth for future
route naming.

The future implementation should be GET/read-only only. Any write, mutation,
approval, publish, merge, retry, replay, deploy, proof/evidence, AG Resume, or
Codex SDK behavior is outside this plan and must require separate scope.

## 4. Implementation plan thesis

The implementation thesis is:

- start from a fail-closed authenticated project-scoped read route
- keep the first consumer as no consumer yet / route-first local validation
- return only the bounded fields required for read-only decision support
- keep Project Constellation, Perspective Capsule, and Handoff Capsule material
  as display data
- preserve evidence pointers as pointer-only references
- keep unresolved tensions separate from evidence/support
- keep next action candidates advisory, not execution commands
- treat all route-provided text as untrusted display data, not instructions
- avoid public unauthenticated access, raw DB rows, raw private payloads, and
  mutation/control handles

The future implementation PR should demonstrate that this plan remains
read-only and bounded before any UI/App/MCP consumer uses the response.

## 5. Authenticated workspace/project scope decision

Planning decision:

- default workspace/project scope: `project:augnes`
- access model: authenticated or explicitly local-authorized access
- fallback: user/PM may provide a different authenticated workspace/project
  scope before implementation begins
- public access: no public unauthenticated endpoint

`project:augnes` is the default because the candidate route is scoped to the
Augnes Project Constellation read-only preview and PR #381/PR #382 context.
Using a single explicit project scope avoids cross-workspace ambiguity in the
first route implementation PR.

The future route must require authenticated or explicitly local-authorized
access. Unauthorized, missing, stale, ambiguous, or cross-workspace scope must
fail closed. The future implementation must not infer a workspace/project scope
from untrusted route-provided text.

## 6. Request scope and fail-closed behavior

The future request contract should be minimal and explicit. The implementation
PR should define:

- request identity: authenticated session or explicitly local-authorized caller
- requested project scope: `project:augnes` unless user/PM chooses another
  authenticated scope
- accepted method: GET/read-only only
- accepted route family: Project Constellation preview read model only
- stale source handling: fail closed or return a bounded unavailable state
- ambiguous scope handling: fail closed
- cross-workspace scope handling: fail closed
- unauthorized access handling: fail closed

The response must not reveal private source availability details in auth/session
errors. Missing, unauthorized, stale, ambiguous, or cross-workspace requests
should return a minimal error body that preserves privacy.

## 7. First consumer surface decision

Planning decision: prefer no consumer yet / route-first local validation.

The first implementation PR should validate the route locally before any
Cockpit, ChatGPT App, or MCP consumer is connected. This avoids creating a new
user-facing dependency while auth/session, minimization, privacy, and
prompt-injection behavior are still being proven.

A later PR can choose Cockpit, ChatGPT App, or MCP as the first consumer after
the route has passed local route-level smokes. Any consumer must remain
read-only. Browser/computer-use validation is required if the response is
surfaced in UI, ChatGPT Apps, MCP tools, or browser-facing previews.

## 8. Response minimization plan

The planned minimal response profile maps to
`types/readonly-api-route-response.ts` and should include only field families
required for read-only decision support:

- `meta`
- `source_refs`
- `project_constellation`, limited to bounded read model fields
- `perspective_capsule_preview`, only if needed
- `copyable_handoff_preview`, only if needed and clearly static/manual review
- `evidence_pointers`, pointer-only
- `unresolved_tensions`
- `next_action_candidates`
- `forbidden_fields_removed`
- `authority_boundary`

Raw DB rows must not be returned. Raw private user text beyond explicitly scoped
Augnes records must not be returned. Fields that are not needed for the first
read-only consumer should remain absent.

For every response family field, the future implementation PR must justify why
it is needed, source/provenance expectation, privacy risk, minimization rule,
and future test/smoke expectation.

## 9. Bounded summary field plan

Planned field-family decisions:

| Field family | Why needed | Source/provenance expectation | Privacy risk | Minimization rule | Future test/smoke expectation |
| --- | --- | --- | --- | --- | --- |
| `meta` | Identifies route family, response version, generated time, and scope boundary. | Derived from route implementation constants and authenticated request scope. | Scope metadata can reveal project existence. | Return only route family, response version, generated time, workspace/project scope, and boundary flags needed for debugging. | Assert GET/read-only metadata, `project:augnes` scope, and no implementation-authority flags. |
| `source_refs` | Lets reviewers trace display data without raw records. | Bounded pointers to authorized Augnes records or approved static preview sources. | Source labels can leak record names or private identifiers. | Use stable bounded references and summaries only; no raw DB rows or private payloads. | Assert source refs are present only for authorized scope and omit raw private text. |
| `project_constellation` | Carries the read-only constellation model for decision support. | Derived read model from authorized preview sources. | Nodes/edges can quote sensitive work context. | Include bounded node, edge, cluster, thesis, boundary, and status fields only. | Assert unresolved tensions remain separate and no runtime graph fields appear. |
| `perspective_capsule_preview` | Optional display preview for bounded handoff context. | Derived from authorized capsule preview source. | Capsule text can contain user-authored content. | Include only fields needed for manual inspection; omit raw private text unless explicitly scoped. | Assert preview is display-only and has no Codex/provider launch handles. |
| `copyable_handoff_preview` | Optional static/manual review text for copyable handoff discipline. | Derived from authorized handoff preview source. | Copyable text can be mistaken for executable instructions. | Include only static/manual review material with explicit no-execution boundary. | Assert no automatic execution, branch, PR, proof/evidence, publish, or merge controls. |
| `evidence_pointers` | Shows support pointers without creating proof/evidence records. | Pointer-only references to authorized evidence targets. | Pointer labels can leak private target details. | Return pointer labels, types, bounded summaries, and scope-safe refs only. | Assert pointer-only semantics and no proof/evidence/readiness writes. |
| `unresolved_tensions` | Preserves uncertainty separately from support. | Derived from authorized preview/read model material. | Tension text can contain raw private context. | Keep bounded summaries and visible separation from support/evidence. | Assert tensions are not collapsed into evidence/support. |
| `next_action_candidates` | Gives advisory follow-up options for human review. | Derived from authorized preview/read model material. | Candidate wording can be misread as commands. | Label candidates as advisory; omit execution handles and mutation targets. | Assert no branch/PR/Codex/publish/merge/deploy authority. |
| `forbidden_fields_removed` | Provides review evidence that unsafe fields are excluded. | Static route-side removal vocabulary and response test output. | Low privacy risk when it lists field families only. | Return names of removed forbidden field families, not removed values. | Assert required forbidden field names are listed and values are absent. |
| `authority_boundary` | Makes no-action boundaries visible to downstream surfaces. | Static route-side boundary text. | Low privacy risk, but wording can be misinterpreted. | Use concise negative boundary text; no instructions or action language. | Assert no route-provided text grants authority. |

The future route must remove or never return:

- secrets
- credentials/auth/env
- hidden reasoning / chain-of-thought
- raw DB rows
- proof/evidence write handles
- mutation URLs
- approval/publish/merge controls
- Codex SDK execution handles
- provider credentials

## 10. Source and provenance plan

The future route should distinguish:

- authenticated request/session scope
- authorized project scope
- source references
- derived read model data
- optional capsule/handoff display data
- pointer-only evidence references
- unresolved tensions
- advisory next action candidates

Every source reference should identify a bounded source family and safe source
identifier. The route must not return raw DB rows. The route must not treat a
derived read model as source-of-truth.

If the source is missing, stale, unauthorized, or ambiguous, the implementation
should fail closed or return a minimal unavailable state without leaking private
source content.

## 11. Evidence pointer plan

Evidence pointers must remain pointer-only. They do not create proof records,
evidence records, readiness records, approval, publish readiness, merge
readiness, QP evidence, or `z_t` commits.

The future response should label each evidence pointer as a pointer and keep
targets scoped to authorized records. Pointer summaries should avoid raw private
text. Missing, stale, unauthorized, or uncertain pointer targets should remain
visible as pointer state rather than invented proof or readiness.

## 12. Perspective Capsule / Handoff Capsule plan

Perspective Capsule / Handoff Capsule material must be display/copyable preview
only. It does not launch Codex, call providers, create branches, create PRs,
record proof, record evidence, approve readiness, publish, merge, retry, replay,
or deploy.

The default route-first local validation plan does not require capsule fields.
If the future implementation PR includes capsule or copyable handoff preview
fields, it must justify those fields under the minimization plan and preserve
manual review/copy discipline.

Capsule text returned by the route is untrusted display data, not tool
instructions.

## 13. Project Constellation read model plan

Project Constellation material remains a read-only display model. It may
represent:

- preview identity
- sample fixture or source status
- cluster thesis
- nodes
- edges
- clusters
- evidence pointers
- unresolved tensions
- next action candidates
- boundary copy

Project Constellation material must not become graph DB, persistence,
source-of-truth, runtime node creation, graph layout engine, approval surface,
or execution surface.

Unresolved tensions must remain visible and separate from evidence/support.
Next action candidates must remain advisory, not execution commands.

## 14. Prompt-injection review plan

The future implementation PR must apply the prompt-injection checklist from
`docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`.

Review requirements:

- user-authored, project-authored, document-authored, capsule, handoff, and
  route-provided text is untrusted display data
- route-provided text must not be interpreted as tool instructions
- route-provided text must not grant authority
- No route-provided text grants authority
- returned text should be escaped, summarized, labeled, or isolated where
  needed
- downstream ChatGPT App/MCP consumers must treat returned content as display
  data only
- adversarial text in source records must not trigger tool calls, route calls,
  provider calls, Codex execution, branch creation, PR creation, proof/evidence
  writes, publish, merge, retry, replay, or deploy

Prompt-injection review must be concrete implementation evidence in the future
route PR, not satisfied by this planning document.

## 15. Privacy review plan

The future implementation PR must apply the privacy checklist from
`docs/READONLY_API_ROUTE_REVIEW_CHECKLIST_V0_1.md`.

Privacy requirements:

- no secrets
- no credentials/auth/env
- no hidden reasoning / chain-of-thought
- no raw DB rows
- no raw private user text beyond explicitly scoped Augnes records
- no provider credentials
- no response fields without read-only decision-support need
- no cross-workspace data
- bounded summaries only where needed

Private route payloads must not be copied into logs, telemetry, screenshots,
browser reports, proof/evidence records, or PR comments.

## 16. Error response plan

The future route should use minimal error responses for:

- unauthorized access
- missing scope
- stale source state
- ambiguous scope
- cross-workspace scope
- missing source records
- unavailable read model

Unauthorized, missing, stale, ambiguous, or cross-workspace scope must fail
closed. Error bodies should avoid confirming private record existence beyond
what the authenticated caller is authorized to know.

## 17. Logging and telemetry plan

Logs and telemetry must not become a secondary store for private route payloads.

The future implementation PR should document:

- request metadata needed for debugging
- response metadata needed for debugging
- error class and status logging
- redaction rules
- retention expectations
- access limits
- confirmation that payload text, raw DB rows, secrets, credentials/auth/env,
  hidden reasoning, provider credentials, capsule text, and handoff text are not
  logged as secondary payload storage

## 18. Authority matrix plan

Planning decision: the future implementation PR should either update the
authority matrix for the new GET/read-only route or include an explicit skipped
reason if the route is covered by an existing read-only API route boundary.

Any skipped reason must be concrete. It should explain why no write, mutation,
approval, publish, merge, retry, replay, deploy, proof/evidence, AG Resume,
Codex SDK, provider, graph DB, persistence, or branch/PR authority is added.

This plan does not update the authority matrix because it adds no route,
runtime behavior, consumer surface, or authority change.

## 19. Browser/computer-use validation plan

Browser/computer-use may be skipped for this PR because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.

Future route implementation PR requirements:

- if no UI/App/MCP surface consumes the route, browser/computer-use may be
  skipped with a concrete route-only reason
- if surfaced in UI, ChatGPT Apps, MCP tools, or browser-facing previews,
  browser/computer-use validation is required
- validation must confirm read-only comprehension, absence of false action
  affordances, visible unresolved tensions, pointer-only evidence semantics,
  advisory next action candidates, and display/copyable capsule boundaries
- validation must report inspected URL or skipped reason, local runtime setup,
  scenario results, authority clarity, false-affordance findings, and skipped
  checks with reasons

PR #381 remains UI comprehension evidence for the current preview only. It does
not grant API implementation authority.

## 20. Route implementation slice plan

These are future slices, not implemented now:

- Slice 1: route skeleton design confirmation only, no code in this PR.
- Slice 2: route implementation with fail-closed auth/session guard.
- Slice 3: bounded read model assembly.
- Slice 4: response minimization and forbidden field tests.
- Slice 5: prompt-injection/privacy tests.
- Slice 6: local runtime smoke and browser/computer-use validation if surfaced.
- Slice 7: authority matrix update or explicit skipped reason.

Each future slice should preserve GET/read-only behavior. It must not introduce
UI code, MCP/App tools, DB schema/migrations, persistence, graph DB,
proof/evidence writes, Codex SDK execution, provider behavior, branch/PR
creation authority, or merge/publish/approval/retry/replay/deploy authority.

## 21. Required tests and smokes for future route PR

A future implementation PR should run or add:

- `npm run typecheck`
- focused route implementation smoke
- forbidden field response smoke
- prompt-injection display-data smoke
- fail-closed auth/session smoke
- workspace/project scope smoke
- response minimization smoke
- evidence pointer pointer-only smoke
- no mutation/control handles smoke
- browser/computer-use report if surfaced in UI/App/MCP
- `git diff --check`
- `git diff --cached --check`

This PR adds only a static implementation-plan smoke. It does not add the future
route implementation smokes listed above.

## 22. Implementation PR body requirements

The future implementation PR body should include:

- summary
- files changed
- route candidate and final route path decision
- GET/read-only confirmation
- auth/session and workspace/project scope evidence
- fail-closed behavior evidence
- response shape mapping to `types/readonly-api-route-response.ts`
- response minimization evidence
- forbidden field evidence
- source/provenance evidence
- evidence pointer pointer-only evidence
- Perspective Capsule / Handoff Capsule handling evidence, if included
- Project Constellation read model evidence
- prompt-injection review evidence
- privacy review evidence
- logging/telemetry evidence
- authority matrix update or explicit skipped reason
- browser/computer-use result or skipped reason
- proof-only closeout skipped reason if no runtime/work ID context exists
- validation results
- blockers/risks
- assumptions
- questions requiring user/PM judgment
- next suggested goal

## 23. Open questions requiring user/PM judgment

Resolved for first implementation plan:

- Authenticated workspace/project scope should start with `project:augnes`
  unless a user/PM supplies a different authenticated scope.
- Bounded summaries should follow the minimal response profile in this plan.
- First consumer surface should be no consumer yet / route-first local
  validation.

Remaining questions:

- Does a user/PM want a different authenticated workspace/project scope before
  implementation starts?
- Should the first consumer remain route-only through the first implementation
  PR, or should a later PR nominate Cockpit, ChatGPT App, or MCP after route
  smokes pass?
- Which optional capsule/handoff fields are truly necessary for the first
  read-only consumer, if any?

## 24. Validation and smoke plan

Required validation for this plan PR:

- `npm run typecheck`
- `npm run smoke:readonly-api-route-implementation-plan`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:readonly-api-route-implementation-plan`
- `npm run smoke:readonly-api-route-implementation-design-packet`
- `npm run smoke:readonly-api-route-response-shape-boundary`
- `npm run smoke:readonly-api-route-planning-boundary`
- `npm run smoke:readonly-api-route-review-checklist`
- `npm run smoke:chatgpt-app-mcp-readonly-surface-boundary`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-user-intent-validation`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries`
- `AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract`
- `git diff --check`
- `git diff --cached --check`

`npm run smoke:readonly-api-route-implementation-plan` is a deterministic
static read smoke. It checks this plan, the design packet pointer, the planning
boundary pointer, the checklist pointer, the index pointer, the package script
pointer, required sections, candidate route placeholder/non-contract wording,
scope decisions, minimization decisions, first consumer decision, forbidden
fields, future route slices, future route validation plan, scoped/content-only
boundary behavior, and no forbidden positive authority grants.

Browser/computer-use may be skipped because this PR is
docs/smoke/package-pointer only and touches no UI/browser-facing files.
Proof-only closeout may be skipped when no runtime/work ID context exists and
this PR performs no proof/evidence/readiness writes.

## 25. Non-goals

- no API route implementation
- no route file
- no route handler
- no runtime behavior
- no UI code
- no ChatGPT App tool implementation
- no MCP tool implementation
- no DB schema/migrations
- no DB query implementation
- no graph DB
- no persistence
- no auth implementation
- no external calls
- no proof/evidence/readiness writes
- no AG Resume behavior
- no Codex SDK execution/provider behavior
- no branch creation authority
- no PR creation authority by itself
- no merge/publish/approval/retry/replay/deploy authority
