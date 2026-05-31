# AG Work Resume Mapping Proposal Record Read Cockpit Panel v0.1

## Purpose

The Cockpit Operator tab exposes an AG Resume Mapping Proposal Record Review
panel for read-only review of Stage B mapping proposal records.

The panel calls the existing read route:

`GET /api/ag-work-resume/mapping-proposal-records`

Proposal records remain review metadata only. Reading them in Cockpit is not
mapping confirmation, not import authorization, not proof/evidence
authorization, not session binding, not Codex execution authority, and not
merge/publish authority.

## Relationship To Existing Pieces

- Stage B writer:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_WRITER_V0_1.md` documents the
  proposal-only writer. This panel does not call the writer or add write
  controls.
- Stage B reader:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_READ_V0_1.md` documents the
  shared reader core, helper, and route used by this panel.
- Mapping/import authority gate:
  `docs/AG_WORK_RESUME_MAPPING_IMPORT_AUTHORITY_GATE_V0_1.md` keeps proposal
  records, confirmed mappings, imports, proof/evidence, session binding, and
  Codex continuation separate.
- Stage A mapping proposal preview panel:
  `docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md`
  remains a preview-only surface. This panel reads persisted Stage B proposal
  records only.

## Cockpit Location

The panel lives in the Cockpit Operator tab after the AG Resume Mapping
Proposal Preview panel.

## Inputs

- `proposal_id`: fetch one proposal record. It must not be combined with list
  filters or `limit`.
- `foreign_scope` plus `foreign_work_id`: list proposal records for one
  foreign work tuple.
- `candidate_local_scope` plus `candidate_local_work_id`: list proposal records
  for one local candidate work tuple.
- `status`: list records by status.
- `limit`: optional positive integer for list reads only. The route caps large
  values.

At least one supported read filter is required. There is no implicit list-all.
The panel performs local validation before calling the route and still relies on
the route to enforce the canonical input contract.

## Fixture Buttons

- `Load safe proposal id lookup`
- `Load safe foreign work lookup`
- `Load safe candidate work lookup`
- `Load safe status lookup`
- `Clear proposal record inputs`

Fixture buttons load synthetic public-safe filter values into local React state
only. They do not call routes, create rows, update rows, delete rows, record
proof/evidence, bind sessions, execute Codex, use persistence APIs, or mutate
Augnes state.

## Request Behavior

The panel sends only a `GET` request to:

`/api/ag-work-resume/mapping-proposal-records`

The panel does not call `POST /api/ag-work-resume/mapping-proposal-records`.
It does not call update routes, lifecycle routes, import routes, work routes,
evidence/proof routes, session routes, Codex routes, bridge routes, publication
routes, approval routes, Direct Resume Code routes, or relay routes.

## Output

The result section is labelled `Mapping proposal record read result` and
renders:

- HTTP status.
- Route `ok`.
- Reader status.
- Record count.
- Applied filters.
- Limit.
- Warnings and failures.
- Route and reader recommended next step.
- Read authority boundary.
- Proposal record cards with foreign work, candidate local work, proposal
  metadata, comparison/gap/conflict/question summaries, foreign refs summary,
  repo context summary, redaction summary, and record authority boundary.

Visible copy states that proposal record reads are review metadata only and are
not mapping confirmation, imports, proof/evidence authorization, session
binding, Codex execution authority, or merge/publish authority.

## Error Behavior

- Missing filters fail locally before any route call.
- `proposal_id` combined with list filters or `limit` fails locally before any
  route call.
- Partial foreign work or candidate local work filters fail locally before any
  route call.
- Non-positive or non-integer `limit` fails locally before any route call.
- Route errors render `Mapping proposal record read route error: ...` with
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
- Proposal review metadata only.
- No create/write affordance.
- No update route.
- No withdraw, reject, supersede, or expire action.
- No confirmed mapping.
- No import.
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

This panel does not add mapping confirmation, mapping persistence, import
persistence, work item creation, work event creation, proof/evidence recording,
session binding, Codex execution controls, approval, publish, retry, replay,
external posting, merge, Direct Resume Code behavior, relay behavior, route
changes, database/schema changes, MCP/App tool schema changes, bridge tools,
ChatGPT App cards, hooks, plugins, skills, package runtime wiring beyond the
smoke script, secret-handling changes, telemetry, analytics, or committed-state
mutation.

## Browser Verification Requirement

Because this slice changes rendered Cockpit UI, browser verification should
open the Cockpit Operator tab and verify status listing, candidate or foreign
listing, `proposal_id` fetch where a seeded synthetic record is available,
not-found handling, local validation errors, clear behavior,
accessibility/keyboard observation, and absence of unauthorized controls.

The browser report for this slice is:

`reports/browser/2026-05-31-ag-work-resume-mapping-proposal-record-read-cockpit-panel-verification.md`

## Future Note

Mapping confirmation, import, lifecycle mutation, proof/evidence recording,
session binding, and Codex continuation remain separate future
user/Core-gated designs. This panel output is review metadata only.
