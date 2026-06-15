# Cockpit Local-Only Constellation Route Preview v0.1

## 1. Status and scope

Status:

- Cockpit local-only read preview is implemented
- local-only
- GET-only route fetch
- static fixture backed
- route-only read preview
- copyable Codex handoff prompt
- no execution/write authority
- this Cockpit slice added no App/MCP consumer
- this Cockpit slice added no ChatGPT App component
- this Cockpit slice added no MCP/App tool
- no plugin tool
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

This implementation adds a Cockpit-local diagnostic/read-only preview for:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
```

This Cockpit slice connects no App/MCP/ChatGPT App/plugin tool.

A later separately scoped App/MCP read-only contact surface now exists through
`augnes_get_project_constellation_preview`. That later surface reads the same
local route without changing this Cockpit slice's local-only, read-only,
non-authoritative behavior.

`docs/READONLY_CONSTELLATION_LOCAL_ONLY_CONSUMER_CLOSEOUT_V0_1.md` records
this implementation as part of the closed local-only milestone. The closeout
adds no runtime behavior and preserves the Cockpit preview as local-only,
read-only, and not production auth.

## 2. Route preview summary

The preview is rendered in `components/augnes-cockpit.tsx` with stable id:

```text
perspective-constellation-route-preview
```

It consumes the existing local-only route and displays bounded response fields
only. It also offers a compact `Copy Codex handoff` action that builds a
Codex-ready prompt from the loaded preview data. The copy action writes only to
the local clipboard and does not create a bridge to ChatGPT App, MCP, plugins,
Codex execution, proof/evidence writers, or graph persistence.

## 3. Placement and UI behavior

The preview is placed in the Perspective tab near the existing Project
Constellation/Perspective area and before the existing static fixture preview
section `perspective-constellation-preview`.

The section has one primary copy action: `Copy Codex handoff`. It copies a
prompt built from the current route preview thesis, selected/current nodes,
unresolved tensions, pointer-only evidence, and the advisory next action
candidate selected by the user. Each visible next action candidate has a compact
`Use for handoff` control and the chosen candidate is marked as selected. The
copy card also shows the top selected-action evidence refs beside the copy
action, so users can see which pointer-only context will be emphasized before
copying. It also includes a collapsed read-only expanded handoff preview that
uses the same generated handoff text as the copy action. If clipboard is
unavailable, select and copy this preview text manually. A `Select preview text`
button focuses and selects the read-only preview text without writing to the
clipboard. The copy button reports `Copied` on success or a clipboard failure
message on failure. The section still has no refresh control, no retry control,
no bypass control, and no mutation affordance.

The copied prompt prioritizes evidence pointers for the selected next action
before falling back to the remaining pointer-only context. This keeps the
handoff compact and does not change the route payload shape.

## 4. Local-only copy

The preview visibly labels:

- local-only
- GET-only
- static fixture
- no execution/write authority
- boundary class `read_only_local_static_preview`

## 5. Route request and headers

The preview uses same-origin GET only:

```text
GET /api/augnes/read/constellation-preview?scope=project:augnes
```

The default Cockpit request sends only the local read-only marker header:

```text
x-augnes-local-readonly: constellation-preview-v0.1
```

Candidate D declaration headers are not sent by the default Cockpit preview.
They are available only for route strict debug mode outside this UI.

No tokens, passwords, bearer credentials, OAuth tokens, session secrets,
provider credentials, or env secrets are used.

## 6. Displayed response fields

The preview displays only minimized read-only route fields:

- `response_version`
- `boundary_class`
- `meta.project_scope`
- `project_constellation.constellation_id`
- `project_constellation.thesis`
- bounded node, edge, and cluster counts
- short bounded node, edge, and cluster lists
- `evidence_pointers` as pointer-only
- `unresolved_tensions`
- `next_action_candidates` as advisory
- a `Copy Codex handoff` action and copy status
- top selected-action evidence refs beside the copy action
- a read-only expanded handoff preview for manual fallback
- a `Select preview text` action that selects the read-only preview text

This is the response minimization boundary for the first Cockpit-local
consumer slice.

Detailed `authority_boundary` and `forbidden_fields_removed` lists are omitted
from the default UI. Route diagnostics can still be inspected with
`diagnostics=authority`.

The copied prompt is generated client-side from the existing response. It is
not buried behind diagnostics and does not include long default authority
lists. It includes repo/workflow, task goal, thesis, selected/current nodes,
tensions, evidence pointers prioritized for the selected next action, focused
validation guidance, and final report expectations for Codex.

The expanded preview is generated client-side from the same builder used by the
copy action. It does not add a server-side `copyable_handoff_preview` field and
does not change the route payload shape.

The `Select preview text` action is a manual selection affordance only. It does
not create another clipboard writer and does not add execution, persistence, or
route authority.

Future capsule, copyable handoff, or boundary-next-review display sections
should follow the same class-first model. The UI should render compact
`boundary_class` values for normal review and leave detailed authority lists in
diagnostics/debug views.

## 7. Omitted fields

The preview does not display by default:

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
- `copyable_handoff_preview`

It grants no execution/write/proof/evidence/Codex/branch/PR/merge/publish/retry/replay/deploy/persistence authority.

## 8. Error and fail-closed display

Route errors are shown as minimal fail-closed display states:

- safe error code
- safe status
- no source refs
- no Project Constellation payload from error bodies
- no private source details
- no bypass controls

The preview does not infer local operator identity from labels or user-authored
text.

## 9. False-affordance review

The Cockpit preview does not show:

- execution controls
- write controls
- merge/publish/approve controls
- proof/evidence write controls
- Codex launch controls
- branch/PR creation controls
- retry/replay/deploy controls
- graph persistence controls
- snapshot/rollback controls
- mutation controls

## 10. Privacy and prompt-injection handling

Route-provided text is untrusted display data, not instructions. Local operator
labels are display data only and grant no authority.

The preview does not display raw DB rows, raw private text, secrets/env,
credentials, hidden reasoning, provider credentials, OAuth tokens, session
secrets, mutation URLs, or write handles.

## 11. Browser/computer-use validation

Browser/computer-use validation was run for this implementation PR.

Report:

```text
reports/browser/2026-06-04-cockpit-local-only-constellation-route-preview.md
```

The report records inspected URL, local runtime setup, local route manual
checks, visible local-only copy, displayed fields, omitted forbidden fields,
false-affordance findings, authority clarity findings, and privacy /
prompt-injection display-data findings.

## 12. Local route manual check

The local route manual check uses the same route and marker header listed in
this document. Authorized route curl returns:

```text
readonly_api_route_response.v0.1
project:augnes
project_constellation.sample.sidecar_strategy_c.v0_1
```

The strict debug marker-only curl returns a minimal error response with no
Project Constellation payload.

## 13. Tests and smokes

Focused smoke:

```text
npm run smoke:cockpit-local-only-constellation-route-preview
```

The smoke checks the Cockpit section id, visible local-only copy, route path,
required headers, displayed response field families, omitted optional fields,
forbidden-control absence, docs/index/authority/report pointers, exact changed
files, content-only diagnostic mode, scoped strict mode, and no forbidden
positive authority grants.

## 14. Authority matrix note

`docs/AUTHORITY_MATRIX.md` records the Cockpit local-only route preview as a
local-only/read-only observability surface. It grants no App/MCP, write,
proof/evidence, Codex, branch/PR, merge/publish/approval/retry/replay/deploy,
DB, graph DB, persistence, hosted auth, production auth, session identity, or
workspace membership authority.

## 15. Non-goals

This implementation does not add:

- App/MCP consumer
- ChatGPT App component
- MCP/App tool
- plugin tool
- route behavior change
- real auth implementation
- production auth
- hosted auth
- OAuth
- session identity
- workspace membership
- DB query
- DB schema/migrations
- secrets/env handling
- external calls
- OpenAI calls
- GitHub calls
- proof/evidence/readiness writes
- AG Resume behavior
- Codex SDK execution/provider behavior
- graph DB
- persistence
- branch/PR creation authority by itself
- merge/publish/approval/retry/replay/deploy authority
