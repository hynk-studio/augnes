# AG Work Resume Confirmed Mapping Read Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes an AG Resume Confirmed Mapping Review panel
for read-only review of Stage C confirmed mapping identity metadata.

The panel calls the existing read route:

`GET /api/ag-work-resume/confirmed-mappings`

Confirmed mappings remain foreign/local identity associations only. Reading
them in Cockpit is not import authorization, not imported resume context, not
proof/evidence authorization, not session binding, not Codex execution
authority, and not approval, publish, retry, replay, or merge authority.

## Relationship To Existing Pieces

- Stage C record contract:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_RECORD_DESIGN_V0_1.md` defines the
  confirmed mapping record as identity metadata only.
- Stage C writer:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_WRITER_V0_1.md` documents the writer
  helper and create route. This panel does not call the writer or add create
  controls.
- Stage C route:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_ROUTE_V0_1.md` documents the shared
  `POST` create route and the adjacent `GET` read route. This panel calls only
  the `GET` route.
- Stage C reader:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_READ_V0_1.md` documents the shared
  reader core, helper, and `GET` route used by this panel.
- Stage C create panel:
  `docs/AG_WORK_RESUME_CONFIRMED_MAPPING_CREATE_COCKPIT_PANEL_V0_1.md`
  documents the separately scoped Operator panel that calls only the `POST`
  create route. This read panel remains read-only and does not call `POST`.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  records, confirmed mappings, imports, imported context, proof/evidence,
  session binding, and Codex continuation separate.

## Cockpit Location

The panel lives in the Cockpit Operator tab after the separately scoped AG
Resume Confirmed Mapping Create panel and before the coordination event
timeline.

## Inputs

- `mapping_id`: fetch one confirmed mapping. It must not be combined with list
  filters or `limit`.
- `foreign_scope` plus `foreign_work_id`: list confirmed mappings for one
  foreign work tuple.
- `local_scope` plus `local_work_id`: list confirmed mappings for one local work
  tuple.
- `source_proposal_id`: list confirmed mappings derived from one Stage B
  proposal row.
- `packet_id` plus `packet_hash`: list confirmed mappings for one packet
  identity.
- `status`: list confirmed mappings by status.
- `limit`: optional positive integer for list reads only. The route caps large
  values.

At least one supported read filter is required. There is no implicit list-all.
The panel performs local validation before calling the route and still relies on
the route to enforce the canonical input contract.

## Fixture Buttons

- `Load safe mapping id lookup`
- `Load safe foreign work lookup`
- `Load safe local work lookup`
- `Load safe source proposal lookup`
- `Load safe packet lookup`
- `Load safe status lookup`
- `Clear confirmed mapping inputs`
- `Read confirmed mappings`

Fixture buttons load synthetic public-safe filter values into local React state
only. They do not call routes, create rows, update rows, delete rows, record
proof/evidence, bind sessions, execute Codex, use persistence APIs, or mutate
Augnes state.

## Request Behavior

The panel sends only a `GET` request to:

`/api/ag-work-resume/confirmed-mappings`

The panel does not call `POST /api/ag-work-resume/confirmed-mappings`. It does
not call writer routes, update routes, lifecycle routes, import routes, work
routes, evidence/proof routes, session routes, Codex routes, bridge routes,
MCP/App routes, publication routes, approval routes, Direct Resume Code routes,
or relay routes.

The request has no body and does not set a JSON content type header.

## Output

The result section is labelled `Confirmed mapping read result` and renders:

- HTTP status.
- Route `ok`.
- Reader status.
- Record count.
- Applied filters.
- Limit.
- Warnings and failures.
- Route and reader recommended next step.
- Read authority boundary.
- Confirmed mapping cards with foreign work identity, local work identity,
  source proposal id, packet id/hash, status, confirmation metadata, lifecycle
  metadata, and record authority boundary.

Visible copy states that confirmed mapping reads are mapping identity metadata
only and are not imports, imported resume context, proof/evidence
authorization, session bindings, Codex execution authority, or merge/publish
authority.

## Error Behavior

- Missing filters fail locally before any route call.
- `mapping_id` combined with list filters or `limit` fails locally before any
  route call.
- Partial foreign work, local work, or packet identity filters fail locally
  before any route call.
- Non-positive or non-integer `limit` fails locally before any route call.
- Route errors render `Confirmed mapping read route error: ...` with
  `role="alert"`.
- `not_found`, `invalid_input`, and DB errors are rendered as read results
  when the route returns JSON.

## Accessibility Behavior

- All text inputs and the status menu use real `label` / `htmlFor`
  associations.
- Helper text is linked with `aria-describedby`.
- Local and route errors use `role="alert"`.
- The result section uses `aria-live="polite"` and a stable labelled heading.
- Fixture controls, lookup inputs, and read controls are grouped with
  accessible labels.
- Controls are native buttons, input, and select elements.
- The panel adds no `role="button"` div/span controls and no custom keyboard
  shortcuts.

## Authority Boundary

- Read-only.
- Mapping identity metadata only.
- No create control.
- No update route.
- No delete route.
- No lifecycle mutation.
- No proposal record creation or update.
- No import or imported resume context creation.
- No work item or work event creation.
- No proof/evidence recording.
- No session binding.
- No Codex execution or Codex continuation.
- No ChatGPT App cards.
- No MCP/App schema changes.
- No bridge tools.
- No telemetry or analytics.
- No localStorage, sessionStorage, or indexedDB persistence.
- No merge, publish, retry, replay, approval, external posting, auto-merge, or
  committed-state mutation.

Durable approval remains user/Core gated.

## Non-Goals

This panel does not add mapping confirmation, confirmed mapping creation,
confirmed mapping update/delete behavior, import persistence, imported resume
context, work item creation, work event creation, proof/evidence recording,
session binding, Codex execution controls, approval, publish, retry, replay,
external posting, merge, Direct Resume Code behavior, relay behavior, route
changes, database/schema changes, MCP/App tool schema changes, bridge tools,
ChatGPT App cards, hooks, plugins, skills, package runtime wiring beyond the
smoke script, secret-handling changes, telemetry, analytics, or committed-state
mutation.

## Browser Verification Requirement

Because this slice changes rendered Cockpit UI, browser verification should
open the Cockpit Operator tab and verify status listing, foreign work listing,
local work listing, source proposal listing, packet identity listing,
`mapping_id` fetch where a seeded synthetic record is available, not-found
handling, local validation errors, clear behavior, accessibility/keyboard
observation, network proof, DB side-effect proof, and absence of unauthorized
controls.

The browser report for this slice is:

`reports/browser/2026-05-31-ag-work-resume-confirmed-mapping-read-cockpit-panel-verification.md`

## Future Note

Import, imported resume context, lifecycle mutation, proof/evidence recording,
session binding, Codex continuation, approval, publish, retry, replay, and
merge remain separate future user/Core-gated designs. This panel output is
confirmed mapping identity metadata only.
